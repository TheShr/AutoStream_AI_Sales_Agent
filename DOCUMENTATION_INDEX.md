# 📚 AutoStream SaaS — Documentation Index

Welcome! Here's how to navigate the documentation for your AI Sales Agent platform.

---

## 🚀 Getting Started (Start Here!)

### New Users
1. **[QUICKSTART.md](./QUICKSTART.md)** — 10-minute setup guide
   - Prerequisites check
   - Backend setup
   - Frontend setup
   - First agent creation
   - Testing the chat
   - Widget deployment

### Already Set Up?
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** — What was built for you
  - Feature overview
  - Architecture diagram
  - Data flow example
  - Integration paths
  - Production checklist

---

## 📖 Comprehensive Guides

### [FEATURES.md](./FEATURES.md) — Complete Feature Reference
Everything about the platform:

| Section | Content |
|---------|---------|
| **Core Features** | Widget, Deploy page, Leads, Test Mode, API Keys, Webhooks, Analytics, Reliability |
| **Backend API** | All endpoints documented |
| **Frontend Pages** | Every page with features listed |
| **Data Storage** | File structure and schema |
| **Security** | Multi-tenant isolation, authentication, CORS |
| **Deployment** | Production checklist |
| **Workflows** | 3 common usage patterns |
| **Troubleshooting** | Common issues & solutions |

---

## 🎯 Feature By Feature

### 1. 🌐 Embeddable Widget
**Purpose:** Add AI chat to any website
- **Guide:** [FEATURES.md → Embeddable Widget](./FEATURES.md#1--embeddable-widget)
- **File:** `/public/widget.js`
- **Quick Start:** Add one line to website:
  ```html
  <script src="https://yourdomain.com/widget.js" data-tenant="tenant-id"></script>
  ```

### 2. 🚀 Deploy Page
**Purpose:** Self-service embed script distribution
- **Guide:** [FEATURES.md → Deploy Page](./FEATURES.md#2--deploy-page)
- **Location:** `/app/deploy`
- **Features:** Copy script, live preview, instructions

### 3. 📊 Lead Pipeline
**Purpose:** Auto-capture and manage leads
- **Guide:** [FEATURES.md → Lead Pipeline](./FEATURES.md#3--lead-pipeline)
- **Location:** `/app/leads`
- **Features:** Filter, search, edit, export, scoring

### 4. 🧪 Test Mode
**Purpose:** Test agent without capturing leads
- **Guide:** [FEATURES.md → Test Mode](./FEATURES.md#4--test-mode)
- **Location:** Chat page toggle
- **Features:** Entity extraction, sentiment analysis, feedback

### 5. 🔌 API Key System
**Purpose:** Secure programmatic access
- **Guide:** [FEATURES.md → API Key System](./FEATURES.md#5--api-key-system)
- **Location:** `/app/settings/api`
- **Features:** View, regenerate, usage examples

### 6. 🔔 Webhook System
**Purpose:** CRM/Slack/Email integrations
- **Guide:** [FEATURES.md → Webhook System](./FEATURES.md#6--webhook-system)
- **API:** `/webhooks` endpoints
- **Features:** Event-driven, auto-triggers

### 7. 📈 Analytics Dashboard
**Purpose:** Track usage and conversion
- **Guide:** [FEATURES.md → Analytics](./FEATURES.md#7--analytics-dashboard)
- **Location:** `/app/analytics`
- **Metrics:** Chats, leads, conversion rate

### 8. ⚙️ Reliability
**Purpose:** Production-grade error handling
- **Guide:** [FEATURES.md → Reliability](./FEATURES.md#8--reliability--error-handling)
- **Features:** Retry logic, timeouts, fallbacks

---

## 🗂️ Technical Documentation

### Backend (`/backend`)

**Main Files:**
- **`api/server.py`** — FastAPI application, all endpoints
- **`agent/graph.py`** — LangGraph FSM, Groq LLM, retry logic
- **`services/`** — Business logic modules

**Data Storage:**
- **`data/tenants/`** — Tenant configurations (JSON)
- **`data/leads/`** — Lead records per tenant (JSON)
- **`data/analytics/`** — Usage metrics per tenant (JSON)
- **`data/webhooks/`** — Webhook configs per tenant (JSON)

### Frontend (`/frontend`)

**Main Pages:**
- **`app/chat/`** — Main chat interface + test mode
- **`app/leads/`** — Lead management dashboard
- **`app/analytics/`** — Analytics metrics
- **`app/settings/api/`** — API key management
- **`app/deploy/`** — Embed script generation
- **`app/preview/`** — Widget preview

**Utilities:**
- **`lib/api.ts`** — Backend API client functions
- **`components/`** — Reusable UI components

---

## 🔧 Common Tasks

### I want to...

| Task | Guide | Location |
|------|-------|----------|
| Embed widget on my website | [QUICKSTART.md → Step 8](./QUICKSTART.md#8-get-embed-script) | `/deploy` |
| Manage captured leads | [FEATURES.md → Lead Pipeline](./FEATURES.md#3--lead-pipeline) | `/leads` |
| Integrate with CRM | [FEATURES.md → Webhook System](./FEATURES.md#6--webhook-system) | API docs |
| Get API key for external app | [QUICKSTART.md → Step 9](./QUICKSTART.md#9-get-api-key) | `/settings/api` |
| Test agent without capturing leads | [FEATURES.md → Test Mode](./FEATURES.md#4--test-mode) | `/chat` toggle |
| View usage metrics | [FEATURES.md → Analytics](./FEATURES.md#7--analytics-dashboard) | `/analytics` |
| Export leads to CSV | [FEATURES.md → Lead Pipeline](./FEATURES.md#3--lead-pipeline) | `/leads` export |
| Deploy to production | [FEATURES.md → Deployment](./FEATURES.md--deployment-checklist) | Render/Vercel |

---

## 🎓 Learning Paths

### Path 1: Quick Demo (15 min)
1. Read [QUICKSTART.md](./QUICKSTART.md) overview
2. Run setup commands
3. Try `/chat` and toggle test mode
4. View `/leads` dashboard
5. Get embed script from `/deploy`

### Path 2: Understanding Architecture (30 min)
1. Read [IMPLEMENTATION_COMPLETE.md → Architecture](./IMPLEMENTATION_COMPLETE.md#architecture-overview)
2. Review [FEATURES.md → Backend API Reference](./FEATURES.md--backend-api-reference)
3. Check data flow diagram in [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md#data-flow-example-visitor-captures-as-lead)

### Path 3: Full Deep Dive (2 hours)
1. Read [FEATURES.md](./FEATURES.md) completely
2. Review backend code in `/backend/api/server.py`
3. Review frontend code in `/frontend/app/`
4. Check data structure in `/backend/data/`
5. Study [QUICKSTART.md → Production Deployment](./QUICKSTART.md--production-deployment)

---

## 🚀 Deployment Guides

### Local Development
- See: [QUICKSTART.md → Backend Setup](./QUICKSTART.md#1-backend-setup)
- See: [QUICKSTART.md → Frontend Setup](./QUICKSTART.md#2-frontend-setup)

### Production (Render + Vercel)
- See: [QUICKSTART.md → Production Deployment](./QUICKSTART.md--production-deployment)
- See: [FEATURES.md → Deployment Checklist](./FEATURES.md--deployment-checklist)

### Docker
- See: [QUICKSTART.md → Docker](./QUICKSTART.md--docker)

---

## 🐛 Troubleshooting

### Common Issues & Solutions
- See: [QUICKSTART.md → Troubleshooting](./QUICKSTART.md--troubleshooting)
- See: [FEATURES.md → Troubleshooting](./FEATURES.md--troubleshooting)

### Debug Checklist
1. Check environment variables are set
2. Verify Groq API key is valid
3. Check CORS_ORIGINS includes your domain
4. Look at server logs: `tail -f backend/logs.txt`
5. Check browser console for errors
6. Verify tenant was created via `/onboarding`

---

## 📞 Support Resources

| Resource | Purpose |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | Get up and running fast |
| [FEATURES.md](./FEATURES.md) | Learn about every feature |
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | See what was built |
| GitHub Issues | Report bugs or request features |
| Email | Contact support@autostream.ai |

---

## 📋 File Structure at a Glance

```
autostream-saas/
├── README.md                          ← Original project README
├── QUICKSTART.md                      ← Start here! Quick setup guide
├── FEATURES.md                        ← Complete feature documentation
├── IMPLEMENTATION_COMPLETE.md         ← What was delivered
├── DOCUMENTATION_INDEX.md             ← You are here!
│
├── backend/
│   ├── main.py                        → Entry point
│   ├── requirements.txt               → Python dependencies
│   ├── api/server.py                  → FastAPI app + endpoints
│   ├── agent/graph.py                 → LangGraph FSM + LLM
│   ├── services/                      → Business logic
│   │   ├── tenant_service.py
│   │   ├── lead_service.py
│   │   ├── analytics_service.py       → NEW!
│   │   ├── webhook_service.py
│   │   ├── api_key_service.py
│   │   ├── session_service.py
│   │   └── feedback_service.py
│   ├── utils/                         → Helpers
│   └── data/                          → JSON storage
│       ├── tenants/
│       ├── leads/
│       ├── analytics/                 → NEW!
│       └── webhooks/
│
└── frontend/
    ├── package.json                   → Node dependencies
    ├── app/
    │   ├── chat/page.tsx              → Chat + test mode
    │   ├── leads/page.tsx             → Lead dashboard
    │   ├── analytics/page.tsx         → Analytics    → NEW!
    │   ├── settings/api/page.tsx      → API settings  → NEW!
    │   ├── deploy/page.tsx            → Embed script
    │   ├── preview/page.tsx           → Widget preview
    │   └── onboarding/page.tsx        → Setup wizard
    ├── components/
    │   └── layout/Sidebar.tsx         → Updated nav
    ├── lib/api.ts                     → API client
    └── public/
        └── widget.js                  → Embed widget
```

---

## ✅ What's Ready to Use

- ✅ Chat interface with streaming
- ✅ Test mode with entity extraction
- ✅ Lead capture & management
- ✅ Analytics dashboard
- ✅ API keys for external access
- ✅ Webhooks for CRM integration
- ✅ Embeddable widget
- ✅ Deploy page with preview
- ✅ Multi-tenant support
- ✅ Error handling & retry logic

---

## 🎉 Next Steps

1. **If new:** Start with [QUICKSTART.md](./QUICKSTART.md)
2. **If exploring:** Read [FEATURES.md](./FEATURES.md)
3. **If deploying:** Follow [QUICKSTART.md → Production](./QUICKSTART.md#-production-deployment)
4. **If integrating:** Check specific feature guides above

---

**Last Updated:** January 15, 2025
**Version:** 2.0.0 (Full SaaS Platform)

