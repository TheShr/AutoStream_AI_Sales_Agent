"""
Multi-Tenant AI Sales Agent — FastAPI Application
==================================================
Routes:
  POST /configure      — Create/update a tenant
  POST /chat           — Chat endpoint (tenant-aware)
  GET  /leads          — Get captured leads for a tenant
  GET  /tenants        — List all tenants
  GET  /health         — Health check

All endpoints are tenant-scoped via tenant_id.
"""

import os
import sys
from typing import Optional, List, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from langchain_core.messages import HumanMessage, AIMessage

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.graph import build_graph, get_initial_state
from services.tenant_service import save_tenant, load_tenant, list_tenants
from services.session_service import load_session, save_session
from services.lead_service import save_lead, get_leads

# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────

app = FastAPI(
    title="AI Sales Agent SaaS",
    description="Multi-tenant AI Sales Agent Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compile graph once at startup
graph = build_graph()

# Mount static frontend
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")


# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────

class ConfigureRequest(BaseModel):
    tenant_id: str
    business_name: str
    description: str
    tone: str = "friendly"
    pricing: Any = {}       # Flexible: list of plans or flat dict
    faqs: List[Any] = []    # List of {question, answer} dicts or strings

    @field_validator("tenant_id")
    @classmethod
    def validate_tenant_id(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("tenant_id must be at least 2 characters")
        # Sanitize: only allow alphanumeric + hyphens/underscores
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', v.strip()):
            raise ValueError("tenant_id may only contain letters, numbers, hyphens, and underscores")
        return v.strip().lower()

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v):
        allowed = {"friendly", "professional", "casual", "formal"}
        if v not in allowed:
            raise ValueError(f"tone must be one of: {', '.join(allowed)}")
        return v

    @field_validator("business_name")
    @classmethod
    def validate_business_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("business_name must be at least 2 characters")
        return v.strip()


class ConfigureResponse(BaseModel):
    success: bool
    tenant_id: str
    business_name: str
    message: str
    created_at: str
    updated_at: str


class ChatRequest(BaseModel):
    tenant_id: str
    user_id: str
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError("message cannot be empty")
        return v.strip()


class ChatResponse(BaseModel):
    tenant_id: str
    user_id: str
    response: str
    intent: str
    sentiment: str
    lead_captured: bool
    turn_count: int


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Service health check."""
    return {
        "status": "ok",
        "service": "AI Sales Agent SaaS",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/configure", response_model=ConfigureResponse)
async def configure_tenant(request: ConfigureRequest):
    """
    Create or update a tenant configuration.

    Stores:
    - business_name, description, tone
    - pricing structure
    - FAQs

    Returns the saved tenant config with timestamps.
    """
    config = request.model_dump()
    saved = save_tenant(request.tenant_id, config)

    return ConfigureResponse(
        success=True,
        tenant_id=saved["tenant_id"],
        business_name=saved["business_name"],
        message=f"Tenant '{saved['business_name']}' configured successfully.",
        created_at=saved["created_at"],
        updated_at=saved["updated_at"],
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main multi-tenant chat endpoint.

    Flow:
    1. Load tenant config (404 if not found)
    2. Load existing session or create fresh state
    3. Inject tenant config into state
    4. Run LangGraph agent
    5. Persist updated session
    6. If lead just captured, save to lead store
    7. Return response
    """
    # 1. Load tenant
    tenant_config = load_tenant(request.tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{request.tenant_id}' not found. Create it via POST /configure first."
        )

    # 2. Load or init session
    state = load_session(request.tenant_id, request.user_id)
    if state is None:
        state = get_initial_state(tenant_config)
    else:
        # Re-inject tenant config (not persisted in session)
        state["tenant_config"] = tenant_config

    # 3. Append user message
    state["messages"].append(HumanMessage(content=request.message))

    # 4. Run agent graph
    result = graph.invoke(state)

    # 5. Persist updated session
    save_session(request.tenant_id, request.user_id, result)

    # 6. If lead just captured this turn, persist it
    just_captured = (
        result.get("lead_captured", False)
        and not state.get("lead_captured", False)
        and result.get("collection_step") == "done"
    )
    if just_captured:
        save_lead(
            tenant_id=request.tenant_id,
            name=result.get("lead_name", ""),
            email=result.get("lead_email", ""),
            platform=result.get("lead_platform", ""),
            user_id=request.user_id,
        )

    # 7. Extract response
    reply = next(
        (m.content for m in reversed(result["messages"]) if isinstance(m, AIMessage)),
        "Sorry, I encountered an issue. Please try again."
    )

    return ChatResponse(
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        response=reply,
        intent=result.get("intent", ""),
        sentiment=result.get("sentiment", "neutral"),
        lead_captured=result.get("lead_captured", False),
        turn_count=result.get("turn_count", 0),
    )


@app.get("/leads")
async def get_tenant_leads(
    tenant_id: str = Query(..., description="Tenant ID to fetch leads for")
):
    """
    Return all captured leads for a tenant, newest first.

    Query param: ?tenant_id=gympro
    """
    # Verify tenant exists
    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    leads = get_leads(tenant_id)
    return {
        "tenant_id": tenant_id,
        "business_name": tenant_config.get("business_name"),
        "total": len(leads),
        "leads": leads,
    }


@app.get("/tenants")
async def get_all_tenants():
    """List all configured tenants (summary view)."""
    tenants = list_tenants()
    return {
        "total": len(tenants),
        "tenants": tenants,
    }
