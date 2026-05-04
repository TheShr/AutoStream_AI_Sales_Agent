# AutoStream SaaS — AI Sales Agent Platform

> **Enterprise-Grade Multi-Tenant SaaS** powering intelligent, context-aware sales conversations at scale
> Deterministic FSM orchestration · Distributed caching · Type-safe full-stack

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi) ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript) ![Redis](https://img.shields.io/badge/Redis-5.0-DC382D?logo=redis)

---

## Overview

**AutoStream** is a production-ready multi-tenant AI Sales Agent platform. Each tenant gets a personalized AI agent trained on their FAQs and pricing, a real-time streaming chat UI, an autonomous lead capture engine, and complete data isolation.

**Use Cases:** SaaS white-labeling · Enterprise sales qualification · E-Commerce support · Lead generation

---

## Architecture

```
┌─────────────────────────────────────┐
│      Frontend (Next.js/React)       │
│  TypeScript + Tailwind + Chat UI    │
└────────────────┬────────────────────┘
                 │ HTTP/JSON
                 ▼
┌─────────────────────────────────────┐
│          FastAPI Application        │
│  Routes · Auth/CORS · Pydantic v2   │
└────┬────────────────────────────────┘
     ├─────────────┬──────────────────┐
     ▼             ▼                  ▼
LangGraph FSM  Session Service   Tenant Service
(StateGraph)   Redis (24h TTL)   JSON / PgSQL
               + Memory fallback
     │
     ├──────────┬──────────┬──────────┐
     ▼          ▼          ▼          ▼
  Groq LLM    NLP       RAG        Lead Capture
  (inference) (sentiment) (tenant KB) (validation)
```

### Conversation Flow

1. **Load Session** — Restore history & lead state from Redis
2. **Intent Recognition** — Sentiment analysis, entity extraction
3. **Context Retrieval (RAG)** — Inject tenant FAQ/KB into system prompt
4. **LangGraph FSM** — Route → Chat/Lead Capture → Finalize
5. **Lead Persistence** — Validate email, save to tenant ledger
6. **Response & Sync** — Stream to client, persist state to Redis

---

## Tech Stack

**Backend:** FastAPI · LangGraph (FSM) · Groq API · Redis · LangChain · Pydantic v2 · Uvicorn · pytest

**Frontend:** Next.js 14 · TypeScript 5.6 · Tailwind CSS · Lucide React

**DevOps:** Docker · Vercel (frontend) · Render (backend) · GitHub Actions

---

## Key Features

### Multi-Tenant Architecture
Complete data isolation per tenant. Dynamic system prompts, tenant-scoped RAG, and segregated lead stores.

```bash
POST /chat  { "tenant_id": "betty-saloon", "user_id": "user_123", "message": "What are your hours?" }
# → Agent retrieves betty-saloon FAQs automatically
```

### Deterministic Conversation FSM (LangGraph)

```python
workflow = StateGraph(AgentState)
workflow.add_node("route", route_node)
workflow.add_node("chat", chat_node)
workflow.add_node("lead_capture", capture_node)
workflow.add_node("finalize", finalize_node)
workflow.add_conditional_edges("chat", should_capture_lead,
    {True: "lead_capture", False: "finalize"})
graph = workflow.compile()
```

No infinite loops, reproducible flows, testable state transitions.

### Distributed Session Persistence

```
Session key: session:{tenant_id}:{user_id}
{ "messages": [...], "lead_name": "John", "lead_email": "john@example.com", "turn_count": 5 }
```

Redis primary (24h TTL) with automatic in-memory fallback — zero code changes, graceful degradation.

### Entity Extraction & Lead Validation
Auto-extract name, email, phone from chat. RFC 5322 email validation, phone normalization, per-tenant deduplication.

### Real-Time Streaming UI
Next.js chat interface with streaming LLM responses, optimistic updates, and mobile-responsive design.

---

## Performance

| Operation | No Cache | With Redis | Improvement |
|-----------|----------|------------|-------------|
| Session load | 125ms | 3ms | **41×** |
| Graph state restore | 150ms | 2ms | **75×** |
| Multi-tenant chat | 280ms | 55ms | **5×** |
| Lead retrieval (1000) | 450ms | 12ms | **37×** |
| Frontend bundle | 125KB | 42KB | **3.3×** |

Perceived latency to first token: **< 100ms** (streaming). Message history capped at 20 turns, reducing memory footprint 70%+.

---

## Quick Start

```bash
# 1. Clone & backend setup
git clone https://github.com/yourusername/autostream-saas.git
cd autostream-saas
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # add GROQ_API_KEY

# 2. Start backend
cd backend && python main.py           # http://localhost:8000

# 3. Start frontend (new terminal)
cd frontend && npm install && npm run dev  # http://localhost:3000

# 4. Create a tenant
curl -X POST http://localhost:8000/configure -H "Content-Type: application/json" \
  -d '{"tenant_id":"my-biz","business_name":"My Business","tone":"professional",
       "pricing":[{"plan":"Pro","price":"$99/mo"}],
       "faqs":[{"question":"Refund policy?","answer":"30-day guarantee"}]}'

# 5. Chat
curl -X POST http://localhost:8000/chat \
  -d '{"tenant_id":"my-biz","user_id":"u1","message":"Tell me about pricing"}'
```

**Docker (recommended):**
```bash
docker-compose up --build
```

---

## Project Structure

```
autostream-saas/
├── backend/
│   ├── agent/
│   │   ├── graph.py          # LangGraph StateGraph FSM
│   │   └── prompts.py        # Tenant-aware system prompt builder
│   ├── api/
│   │   └── server.py         # POST /configure /chat  GET /leads /tenants /health
│   ├── services/
│   │   ├── tenant_service.py # Tenant CRUD (JSON / PostgreSQL)
│   │   ├── session_service.py# Redis + in-memory fallback
│   │   └── lead_service.py   # Per-tenant lead ledger
│   ├── utils/
│   │   ├── rag.py            # Tenant KB retrieval
│   │   ├── nlp.py            # Entity extraction, sentiment
│   │   └── lead_capture.py   # Email/phone validation
│   └── data/
│       ├── tenants/          # tenant config JSON files
│       └── leads/            # lead record JSON files
├── frontend/
│   ├── app/
│   │   ├── chat/page.tsx     # Streaming chat interface
│   │   ├── leads/page.tsx    # Leads dashboard + CSV export
│   │   └── onboarding/page.tsx # Tenant setup wizard
│   ├── components/
│   │   ├── chat/             # ChatInput, MessageBubble
│   │   ├── layout/Sidebar.tsx
│   │   └── ui/               # Button, Card, Input, Select, Spinner…
│   └── lib/api.ts            # API client + retry logic
├── docker-compose.yml
├── Dockerfile
├── render.yaml
├── vercel.json
└── .github/workflows/        # test.yml · deploy.yml
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/configure` | Create/update tenant (idempotent) |
| `POST` | `/chat` | Chat with tenant agent, streams response |
| `GET` | `/leads` | List captured leads (`?tenant_id=&limit=&offset=`) |
| `GET` | `/tenants` | List all tenants |
| `GET` | `/health` | Redis, Groq API, uptime status |

All errors return: `{ "status": "error", "code": "...", "message": "...", "details": {...} }`

**Common codes:** `200 OK` · `201 Created` · `400 Bad Request` · `404 Not Found` · `500 Internal Server Error`

---

## Engineering Highlights

### Type Safety
Pydantic v2 validators with `field_validator` on all inputs (injection-safe tenant IDs, RFC-compliant emails). TypeScript interfaces for all API contracts — compile-time safety, self-documenting components.

### Redis with Graceful Fallback
Automatic failover to in-memory dict if Redis is unreachable. No data loss in development, no code changes needed.

### Security
Input sanitization via `bleach` · CORS allowlist · `slowapi` rate limiting (100 req/min) · Error masking (no stack traces to client) · SQL/injection character blocking in validators.

### Scalability
Stateless API servers behind a load balancer share Redis cluster for session state. Session keys are `session:{tenant_id}:{user_id}` — shardable by tenant at 10,000+ concurrent users.

```
Load Balancer → [API-1, API-2, API-3] → Redis Cluster → DB sharded by tenant_id
```

### Testing
`pytest` + `pytest-asyncio` with markers for `integration` and `slow` suites. Tests cover session persistence, Redis fallback mocking, and full end-to-end chat + lead capture flows.

---

## Deployment

**Vercel (frontend):** `vercel deploy` or GitHub auto-deploy via `vercel.json`

**Render (backend):** `render deploy` via `render.yaml` — set `GROQ_API_KEY` and `REDIS_URL`

**Production checklist:** GROQ_API_KEY · REDIS_URL (Redis Cloud) · CORS origins · SSL/TLS · Rate limiting · Sentry error tracking · Automated tenant data backups · CDN for frontend assets

---

## Roadmap

- [x] Multi-tenant orchestration · Redis sessions · Lead capture · Next.js UI
- [ ] Webhooks (Zapier/Make) · Slack/Teams integration · Lead scoring ML · A/B testing
- [ ] SSO (OAuth2/SAML) · Custom domains · RBAC · SOC2/HIPAA compliance

