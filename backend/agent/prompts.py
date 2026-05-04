"""
Prompt Engineering Templates — Multi-Tenant Version
=====================================================
All prompts are now dynamically built from tenant_config.
No hardcoded business names, descriptions, or KB references.
"""

from utils.rag import get_full_knowledge_base_summary


# ─────────────────────────────────────────────
# SENTIMENT TONE INJECTIONS (reusable)
# ─────────────────────────────────────────────

SENTIMENT_TONE_INJECTIONS = {
    "positive": "The user seems engaged and positive. Match their energy — be warm and enthusiastic.",
    "neutral": "The user seems neutral. Be helpful and informative.",
    "negative": "The user seems dissatisfied. Acknowledge their concern first before answering. Be empathetic.",
    "frustrated": (
        "The user appears frustrated. DO NOT be defensive. "
        "Start by validating their frustration ('I completely understand...'), "
        "then provide a clear, calm, helpful answer."
    ),
}

TONE_PERSONALITY = {
    "friendly": "Warm, enthusiastic, and conversational — like a knowledgeable friend.",
    "professional": "Polished, concise, and authoritative — like a senior consultant.",
    "casual": "Relaxed and fun — like chatting with a helpful colleague.",
    "formal": "Formal and precise — like a customer service professional.",
    "bold": "Confident, dynamic, and assertive — like a bold brand voice that stands out.",
}


def build_system_prompt(tenant_config: dict, sentiment_label: str = "neutral") -> str:
    """
    Dynamically build the system prompt from tenant configuration.

    Args:
        tenant_config: Dict with business_name, description, tone, pricing, faqs, etc.
        sentiment_label: One of 'positive', 'neutral', 'negative', 'frustrated'

    Returns:
        Full system prompt string
    """
    business_name = tenant_config.get("business_name", "our company")
    description = tenant_config.get("description", "")
    tone_key = tenant_config.get("tone", "friendly")
    personality = TONE_PERSONALITY.get(tone_key, TONE_PERSONALITY["friendly"])

    # Build KB summary from tenant config
    kb_summary = get_full_knowledge_base_summary(tenant_config)

    base_prompt = f"""You are an intelligent sales assistant for {business_name}.

{description}

Your personality: {personality}

Your responsibilities:
1. Answer questions about {business_name}'s features, pricing, and policies using ONLY the knowledge base below
2. Detect when users are ready to sign up and smoothly transition into lead collection
3. Handle frustrated or confused users with extra care and patience
4. Never fabricate features, prices, or policies not in the knowledge base

STRICT RULES:
- Never mention competitor products unprompted
- Never promise features not listed in the knowledge base
- When uncertain, say "Let me check on that for you"
- Keep responses under 120 words unless user asks for detailed info

--- KNOWLEDGE BASE ---
{kb_summary}
--- END KNOWLEDGE BASE ---"""

    tone_note = SENTIMENT_TONE_INJECTIONS.get(sentiment_label, SENTIMENT_TONE_INJECTIONS["neutral"])
    return base_prompt + f"\n\nTONE GUIDANCE: {tone_note}"


def build_lead_collection_prompts(tenant_config: dict) -> dict:
    """
    Build lead collection prompts dynamically for a tenant.
    
    Args:
        tenant_config: Tenant configuration dict

    Returns:
        Dict of prompt strings for each FSM step
    """
    business_name = tenant_config.get("business_name", "us")

    return {
        "start": (
            f"That's fantastic! Let's get you started with {business_name}. 🚀 "
            "I just need a few quick details. Could I start with your full name?"
        ),
        "ask_email": "Great to meet you, {name}! What's the best email address to reach you?",
        "ask_platform": "Perfect! And which platform do you mainly create content for? (e.g. YouTube, Instagram, TikTok, LinkedIn)",
        "confirm_success": (
            f"🎉 You're all set, {{name}}! I've passed your details to the {business_name} team "
            "and someone will be in touch at {email} shortly. "
            "Welcome aboard — we can't wait to help you grow on {platform}! ✨"
        ),
        "invalid_email": (
            "Hmm, that email doesn't look quite right. "
            "Could you double-check and share it again? (e.g. yourname@gmail.com)"
        ),
    }
