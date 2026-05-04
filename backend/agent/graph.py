"""
Multi-Tenant AI Sales Agent — Core Graph
==========================================
Framework : LangGraph (StateGraph)
LLM       : Groq API
Changes from v1:
  - Removed hardcoded AutoStream references
  - Added tenant_config injection into state
  - build_system_prompt now takes tenant config
  - RAG retrieves from tenant-specific KB
  - Lead capture calls tenant-aware service
"""

import json
import os
import urllib.error
import urllib.request
from typing import TypedDict, Annotated, Optional, Any
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from utils.rag import retrieve_context
from utils.nlp import extract_entities, analyze_sentiment
from agent.prompts import build_system_prompt, build_lead_collection_prompts
from utils.lead_capture import validate_email, validate_lead_data

load_dotenv()


# ─────────────────────────────────────────────
# STATE DEFINITION
# ─────────────────────────────────────────────

class AgentState(TypedDict):
    # Conversation
    messages: Annotated[list, add_messages]
    intent: str
    sentiment: str
    turn_count: int

    # Lead collection FSM
    lead_name: Optional[str]
    lead_email: Optional[str]
    lead_platform: Optional[str]
    lead_captured: bool
    collection_step: str       # "" | "name" | "email" | "platform" | "done"

    # Routing
    last_topic: str

    # Multi-tenant context (injected per request, not persisted in Redis)
    tenant_config: Optional[dict]


# ─────────────────────────────────────────────
# LLM SETUP
# ─────────────────────────────────────────────

class GroqChat:
    def __init__(self, api_key: str, model: str = "llama3-8b-8192", temperature: float = 0.4, max_tokens: int = 512):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def invoke(self, messages: list[Any]) -> Any:
        payload = {
            "model": self.model,
            "input": [self._message_to_input(message) for message in messages],
            "temperature": self.temperature,
            "max_output_tokens": self.max_tokens,
        }

        request = urllib.request.Request(
            "https://api.groq.com/openai/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "AutoStream-GroqClient/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            raise RuntimeError(f"Groq API error: {exc.code} {body}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Groq API network error: {exc.reason}") from exc

        return type("GroqResponse", (), {"content": self._extract_text(data)})

    def _message_to_input(self, message: Any) -> dict[str, str]:
        if isinstance(message, SystemMessage):
            role = "system"
        elif isinstance(message, HumanMessage):
            role = "user"
        else:
            role = "assistant"
        return {"role": role, "content": message.content}

    def _extract_text(self, payload: dict[str, Any]) -> str:
        output = payload.get("output")
        if isinstance(output, list) and output:
            first = output[0]
            content = first.get("content")
            if isinstance(content, list):
                texts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "output_text"]
                if texts:
                    return "".join(texts)
                return " ".join(str(item) for item in content if isinstance(item, str))
            if isinstance(content, str):
                return content
        return str(payload)


def get_llm() -> GroqChat:
    api_key = (
        os.getenv("GROQ_API_KEY")
        or os.getenv("GROQ_API")
        or os.getenv("GROQ_KEY")
    )
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured. Set GROQ_API_KEY in Render env vars or .env."
        )

    api_key = api_key.strip().strip('"').strip("'")
    if api_key.lower().startswith("bearer "):
        api_key = api_key[7:].strip()

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is empty after normalization. Check your Render env value."
        )

    return GroqChat(api_key=api_key)


# ─────────────────────────────────────────────
# INTENT DETECTION — unchanged from v1
# ─────────────────────────────────────────────

HIGH_INTENT_SIGNALS = [
    "sign up", "sign me up", "i want to try", "i'd like to", "subscribe",
    "get started", "ready to", "let's go", "count me in", "sounds great",
    "sounds good", "i'm in", "purchase", "buy", "upgrade", "register",
    "create my account", "start now", "i'll take", "let me get"
]

INQUIRY_SIGNALS = [
    "price", "pricing", "plan", "cost", "feature", "4k", "resolution",
    "refund", "support", "cancel", "trial", "free", "how much", "what is",
    "tell me", "explain", "difference", "compare", "include", "unlimited",
    "export", "format", "team", "mobile", "annual", "yearly", "discount"
]

COMPLAINT_SIGNALS = [
    "not working", "broken", "issue", "problem", "error", "bug",
    "terrible", "awful", "disappointed", "refund me", "cancel my",
    "overcharged", "wrong", "failed", "crash", "slow", "unresponsive"
]

GREETING_SIGNALS = [
    "hi", "hello", "hey", "good morning", "good afternoon",
    "good evening", "howdy", "what's up", "greetings", "yo"
]


def detect_intent(message: str, state: AgentState) -> str:
    """
    Classify user intent using layered keyword heuristics.
    Order of precedence:
    1. If mid-collection → "lead_collection"
    2. High-intent → "high_intent"
    3. Complaint → "complaint"
    4. Inquiry → "inquiry"
    5. Greeting → "greeting"
    6. Default → "inquiry"
    """
    if state.get("collection_step") in ("name", "email", "platform"):
        return "lead_collection"

    msg = message.lower()
    if any(sig in msg for sig in HIGH_INTENT_SIGNALS):
        return "high_intent"
    if any(sig in msg for sig in COMPLAINT_SIGNALS):
        return "complaint"
    if any(sig in msg for sig in INQUIRY_SIGNALS):
        return "inquiry"
    if any(sig in msg for sig in GREETING_SIGNALS):
        return "greeting"
    return "inquiry"


# ─────────────────────────────────────────────
# CORE AGENT NODE
# ─────────────────────────────────────────────

def process_message(state: AgentState) -> AgentState:
    """
    Primary agent node — now tenant-aware.

    Key changes from v1:
    - Uses tenant_config for prompts and KB retrieval
    - Lead collection prompts built from tenant business name
    - RAG uses tenant-specific knowledge base
    """
    llm = get_llm()
    messages = state["messages"]
    tenant_config = state.get("tenant_config") or {}

    last_human = next(
        (m.content for m in reversed(messages) if isinstance(m, HumanMessage)), ""
    )

    # ── NLP PRE-PROCESSING ──
    entities = extract_entities(last_human)
    sentiment = analyze_sentiment(last_human)
    intent = detect_intent(last_human, state)

    collection_step = state.get("collection_step", "")
    lead_name = state.get("lead_name")
    lead_email = state.get("lead_email")
    lead_platform = state.get("lead_platform")
    turn_count = state.get("turn_count", 0) + 1

    # Build lead prompts dynamically from tenant config
    LEAD_PROMPTS = build_lead_collection_prompts(tenant_config)

    # ── LEAD COLLECTION STATE MACHINE ── (FSM logic unchanged)
    if collection_step == "name":
        name_value = entities.name_candidate or last_human.strip()
        lead_name = name_value
        collection_step = "email"
        response = LEAD_PROMPTS["ask_email"].format(name=lead_name)

    elif collection_step == "email":
        email_value = entities.email or last_human.strip()
        if not validate_email(email_value):
            response = LEAD_PROMPTS["invalid_email"]
        else:
            lead_email = email_value
            collection_step = "platform"
            response = LEAD_PROMPTS["ask_platform"]

    elif collection_step == "platform":
        platform_value = entities.platform or last_human.strip()
        lead_platform = platform_value
        collection_step = "done"

        is_valid, error = validate_lead_data(lead_name, lead_email, lead_platform)
        if is_valid:
            response = LEAD_PROMPTS["confirm_success"].format(
                name=lead_name,
                email=lead_email,
                platform=lead_platform,
            )
        else:
            response = f"Something looks off: {error} — could you share that again?"
            collection_step = "platform"

    elif intent == "high_intent":
        collection_step = "name"
        response = LEAD_PROMPTS["start"]

    elif intent == "complaint":
        system_prompt = build_system_prompt(tenant_config, "frustrated")
        rag_context = retrieve_context(last_human, tenant_config)
        prompt_messages = [
            SystemMessage(content=system_prompt),
            *[m for m in messages[:-1]],
            HumanMessage(
                content=f"[User complaint]: {last_human}\n\n[Relevant KB Context]:\n{rag_context}"
            )
        ]
        ai_response = llm.invoke(prompt_messages)
        response = ai_response.content
        collection_step = ""

    elif intent == "greeting":
        system_prompt = build_system_prompt(tenant_config, sentiment.label)
        prompt_messages = [
            SystemMessage(content=system_prompt),
            *[m for m in messages[:-1]],
            HumanMessage(content=last_human)
        ]
        ai_response = llm.invoke(prompt_messages)
        response = ai_response.content
        collection_step = ""

    else:  # inquiry
        system_prompt = build_system_prompt(tenant_config, sentiment.label)
        rag_context = retrieve_context(last_human, tenant_config)
        prompt_messages = [
            SystemMessage(content=system_prompt),
            *[m for m in messages[:-1]],
            HumanMessage(
                content=f"[User question]: {last_human}\n\n[Relevant Knowledge Base Context]:\n{rag_context}"
            )
        ]
        ai_response = llm.invoke(prompt_messages)
        response = ai_response.content
        collection_step = ""

    return {
        **state,
        "messages": [AIMessage(content=response)],
        "intent": intent,
        "sentiment": sentiment.label,
        "turn_count": turn_count,
        "lead_name": lead_name,
        "lead_email": lead_email,
        "lead_platform": lead_platform,
        "lead_captured": state.get("lead_captured", False) or (collection_step == "done"),
        "collection_step": collection_step,
        "last_topic": intent if intent not in ("greeting", "lead_collection") else state.get("last_topic", ""),
        "tenant_config": tenant_config,  # pass-through
    }


# ─────────────────────────────────────────────
# BUILD LANGGRAPH
# ─────────────────────────────────────────────

def build_graph():
    """Compile the LangGraph StateGraph. Single node — all routing inside."""
    graph = StateGraph(AgentState)
    graph.add_node("agent", process_message)
    graph.set_entry_point("agent")
    graph.add_edge("agent", END)
    return graph.compile()


def get_initial_state(tenant_config: dict = None) -> AgentState:
    """Return a fresh initial state for a new conversation."""
    return {
        "messages": [],
        "intent": "",
        "sentiment": "neutral",
        "turn_count": 0,
        "lead_name": None,
        "lead_email": None,
        "lead_platform": None,
        "lead_captured": False,
        "collection_step": "",
        "last_topic": "",
        "tenant_config": tenant_config or {},
    }
