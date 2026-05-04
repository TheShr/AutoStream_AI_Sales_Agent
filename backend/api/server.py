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
    test_mode: bool = False  # New field for test mode

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
    extracted_entities: Optional[dict] = None  # New field for test mode
    test_mode: bool = False  # New field to indicate if this was a test response


class WidgetConfigResponse(BaseModel):
    tenant_id: str
    theme: str
    business_name: str
    welcome_message: str


class FeedbackRequest(BaseModel):
    tenant_id: str
    message: str
    response: str
    rating: int  # 1 for thumbs up, -1 for thumbs down

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v not in [-1, 1]:
            raise ValueError("rating must be 1 (thumbs up) or -1 (thumbs down)")
        return v


class ApiKeyResponse(BaseModel):
    tenant_id: str
    api_key: str
    created_at: str


class LeadUpdateRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ["new", "contacted", "qualified", "closed", "lost"]:
            raise ValueError("status must be one of: new, contacted, qualified, closed, lost")
        return v


class WebhookRequest(BaseModel):
    url: str
    events: List[str]

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        from urllib.parse import urlparse
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("url must be a valid URL")
        return v

    @field_validator("events")
    @classmethod
    def validate_events(cls, v):
        allowed = ["lead.created", "lead.updated"]
        if not all(event in allowed for event in v):
            raise ValueError(f"events must be subset of: {', '.join(allowed)}")
        return v


class WebhookResponse(BaseModel):
    webhook_id: str
    tenant_id: str
    url: str
    events: List[str]
    created_at: str


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
async def chat(request: ChatRequest, authorization: Optional[str] = None):
    """
    Main multi-tenant chat endpoint.

    Supports both dashboard (session-based) and API key authentication.

    Flow:
    1. Load tenant config (404 if not found)
    2. Authenticate via API key if provided
    3. Load existing session or create fresh state
    4. Inject tenant config into state
    5. Run LangGraph agent
    6. Persist updated session (unless test mode)
    7. If lead just captured and not test mode, save to lead store
    8. Return response with additional test mode data
    """
    from services.api_key_service import validate_api_key

    # 1. Load tenant
    tenant_config = load_tenant(request.tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{request.tenant_id}' not found. Create it via POST /configure first."
        )

    # 2. Validate API key if provided
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Invalid authorization header format. Use 'Bearer <api_key>'."
            )
        api_key = authorization[7:]  # Remove "Bearer " prefix
        if not validate_api_key(request.tenant_id, api_key):
            raise HTTPException(
                status_code=401,
                detail="Invalid API key."
            )

    # 3. Load or init session
    state = load_session(request.tenant_id, request.user_id)
    if state is None:
        state = get_initial_state(tenant_config)
    else:
        # Re-inject tenant config (not persisted in session)
        state["tenant_config"] = tenant_config

    # 4. Append user message
    state["messages"].append(HumanMessage(content=request.message))

    # 5. Run agent graph
    result = graph.invoke(state)

    # 6. Persist updated session (skip in test mode)
    if not request.test_mode:
        save_session(request.tenant_id, request.user_id, result)

    # 7. If lead just captured this turn and not test mode, persist it
    just_captured = (
        result.get("lead_captured", False)
        and not state.get("lead_captured", False)
        and result.get("collection_step") == "done"
        and not request.test_mode
    )
    if just_captured:
        save_lead(
            tenant_id=request.tenant_id,
            name=result.get("lead_name", ""),
            email=result.get("lead_email", ""),
            platform=result.get("lead_platform", ""),
            user_id=request.user_id,
            phone=result.get("lead_phone", ""),
            intent=result.get("intent", ""),
        )

        # Trigger webhooks for lead.created event
        from services.webhook_service import trigger_webhooks
        lead_data = {
            "lead_id": f"LEAD-{abs(hash(result.get('lead_email', '') + request.tenant_id)) % 100000:05d}",
            "name": result.get("lead_name", ""),
            "email": result.get("lead_email", ""),
            "platform": result.get("lead_platform", ""),
            "timestamp": datetime.utcnow().isoformat(),
            "tenant_id": request.tenant_id
        }
        await trigger_webhooks(request.tenant_id, "lead.created", lead_data)

    # 8. Extract response
    reply = next(
        (m.content for m in reversed(result["messages"]) if isinstance(m, AIMessage)),
        "Sorry, I encountered an issue. Please try again."
    )

    # 9. Prepare extracted entities for test mode
    extracted_entities = None
    if request.test_mode:
        extracted_entities = {
            "intent": result.get("intent", ""),
            "sentiment": result.get("sentiment", "neutral"),
            "lead_name": result.get("lead_name", ""),
            "lead_email": result.get("lead_email", ""),
            "lead_platform": result.get("lead_platform", ""),
            "collection_step": result.get("collection_step", ""),
        }

    return ChatResponse(
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        response=reply,
        intent=result.get("intent", ""),
        sentiment=result.get("sentiment", "neutral"),
        lead_captured=result.get("lead_captured", False),
        turn_count=result.get("turn_count", 0),
        extracted_entities=extracted_entities,
        test_mode=request.test_mode,
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


# ─────────────────────────────────────────────
# NEW ENDPOINTS FOR EXTENDED FUNCTIONALITY
# ─────────────────────────────────────────────

@app.get("/widget/config", response_model=WidgetConfigResponse)
async def get_widget_config(
    tenant_id: str = Query(..., description="Tenant ID for widget configuration")
):
    """
    Get widget configuration for embedding the chat widget on external websites.

    Returns theme, business name, and welcome message for the tenant.
    """
    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    return WidgetConfigResponse(
        tenant_id=tenant_id,
        theme="dark",  # Default theme, could be configurable later
        business_name=tenant_config.get("business_name", ""),
        welcome_message=f"Hello! I'm here to help you with {tenant_config.get('business_name', 'our services')}. How can I assist you today?"
    )


@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit feedback for a chat interaction (thumbs up/down).

    Used in test mode to collect feedback on agent responses.
    """
    from services.feedback_service import save_feedback

    saved = save_feedback(
        tenant_id=request.tenant_id,
        message=request.message,
        response=request.response,
        rating=request.rating
    )

    return {"success": True, "feedback_id": saved["feedback_id"]}


@app.get("/api-keys")
async def get_api_key(
    tenant_id: str = Query(..., description="Tenant ID to get API key for")
):
    """
    Get the API key for a tenant (for external API access).
    """
    from services.api_key_service import get_api_key

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    api_key = get_api_key(tenant_id)
    return ApiKeyResponse(
        tenant_id=tenant_id,
        api_key=api_key,
        created_at=tenant_config.get("api_key_created_at", tenant_config.get("created_at", ""))
    )


@app.post("/api-keys")
async def regenerate_api_key(
    tenant_id: str = Query(..., description="Tenant ID to regenerate API key for")
):
    """
    Regenerate the API key for a tenant.
    """
    from services.api_key_service import generate_api_key

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    api_key = generate_api_key(tenant_id)
    return ApiKeyResponse(
        tenant_id=tenant_id,
        api_key=api_key,
        created_at=datetime.utcnow().isoformat()
    )


@app.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: str,
    request: LeadUpdateRequest,
    tenant_id: str = Query(..., description="Tenant ID the lead belongs to")
):
    """
    Update a lead's status and/or add notes.
    """
    from services.lead_service import update_lead

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    updated = update_lead(tenant_id, lead_id, request.status, request.notes)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Lead '{lead_id}' not found for tenant '{tenant_id}'."
        )

    return updated


@app.post("/webhooks", response_model=WebhookResponse)
async def create_webhook(
    request: WebhookRequest,
    tenant_id: str = Query(..., description="Tenant ID to create webhook for")
):
    """
    Create a webhook for a tenant to receive events.
    """
    from services.webhook_service import create_webhook

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    webhook = create_webhook(tenant_id, request.url, request.events)
    return WebhookResponse(**webhook)


@app.get("/webhooks")
async def get_webhooks(
    tenant_id: str = Query(..., description="Tenant ID to get webhooks for")
):
    """
    Get all webhooks for a tenant.
    """
    from services.webhook_service import get_webhooks

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    webhooks = get_webhooks(tenant_id)
    return {"tenant_id": tenant_id, "webhooks": webhooks}


@app.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    tenant_id: str = Query(..., description="Tenant ID the webhook belongs to")
):
    """
    Delete a webhook.
    """
    from services.webhook_service import delete_webhook

    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise HTTPException(
            status_code=404,
            detail=f"Tenant '{tenant_id}' not found."
        )

    success = delete_webhook(tenant_id, webhook_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Webhook '{webhook_id}' not found for tenant '{tenant_id}'."
        )

    return {"success": True}
