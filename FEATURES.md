# AutoStream SaaS — Complete Feature Documentation

> This document details all production-ready features available in the AutoStream AI Sales Agent Platform.

---

## 🎯 Core Features

### 1. 🌐 Embeddable Widget

**Purpose:** Allow any website to embed your AI sales agent instantly.

**Location:** `/public/widget.js`

**Features:**
- Self-contained, no dependencies
- Floating chat bubble (bottom-right)
- Shadow DOM for CSS isolation
- Persistent user IDs (localStorage)
- Secure tenant configuration via data attributes

**Usage:**
```html
<script src="https://yourdomain.com/widget.js" data-tenant="your-tenant-id" data-api-url="https://api.yourdomain.com"></script>
```

**Backend Endpoint:**
```http
GET /widget/config?tenant_id=your-tenant-id
```

Returns:
```json
{
  "tenant_id": "your-tenant-id",
  "theme": "dark",
  "business_name": "Your Business",
  "welcome_message": "Hello! How can I help?"
}
```

---

### 2. 🚀 Deploy Page

**Purpose:** Self-service embed script distribution and live preview.

**Location:** `/app/deploy/page.tsx`

**Features:**
- Load tenant configuration
- Display embed script with copy button
- Live preview of widget
- Instructions for integration
- Open preview in new window

**Access:** Dashboard → Deploy

---

### 3. 📊 Lead Pipeline

**Enhanced Lead Schema:**
```json
{
  "lead_id": "LEAD-12345",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "platform": "widget",
  "user_id": "user_12345",
  "intent": "pricing",
  "score": "hot|warm|cold",
  "status": "new|contacted|qualified|closed|lost",
  "notes": "Interested in enterprise plan",
  "timestamp": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Lead Scoring:**
- **Hot** (5+ points) — Purchase intent + complete profile
- **Warm** (3-4 points) — Information seeking + partial data
- **Cold** (0-2 points) — General inquiry + sparse data

**Endpoints:**
```http
GET  /leads?tenant_id=...              → List all leads
PATCH /leads/{lead_id}?tenant_id=...   → Update status/notes
```

**Frontend:**
- Leads Dashboard at `/app/leads`
- Filter by status, score, search
- Inline editing of status & notes
- CSV export
- Real-time updates

---

### 4. 🧪 Test Mode

**Purpose:** Non-persistent agent testing with detailed entity extraction.

**Features:**
- Toggle "Test Mode" in Chat page
- Messages do NOT create leads
- Shows extracted entities in sidebar:
  - Intent detection
  - Sentiment analysis
  - Lead name, email, platform
  - Collection step
- Feedback buttons (thumbs up/down)

**Backend Support:**
```json
{
  "test_mode": true,
  "extracted_entities": {
    "intent": "pricing",
    "sentiment": "positive",
    "lead_name": "John Doe",
    "lead_email": "john@example.com",
    "lead_platform": "widget",
    "collection_step": "email"
  }
}
```

---

### 5. 🔌 API Key System

**Purpose:** Secure programmatic access to chat API.

**Backend:**
```http
GET  /api-keys?tenant_id=...           → Get current key
POST /api-keys?tenant_id=...           → Regenerate key
```

**Storage:** Tenant configuration (JSON)

**Usage Example:**
```bash
curl -X POST "https://api.yourdomain.com/chat" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "your-tenant",
    "user_id": "external_user_123",
    "message": "Tell me about your pricing"
  }'
```

**Frontend:**
- Settings → API Settings page
- Copy key button
- Regenerate button with confirmation
- Usage example with curl

---

### 6. 🔔 Webhook System

**Purpose:** Real-time integrations with CRM, Slack, email services.

**Schema:**
```json
{
  "webhook_id": "wh_abc123",
  "tenant_id": "your-tenant",
  "url": "https://crm.example.com/webhook",
  "events": ["lead.created", "lead.updated"],
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Endpoints:**
```http
POST   /webhooks?tenant_id=...         → Create webhook
GET    /webhooks?tenant_id=...         → List webhooks
DELETE /webhooks/{webhook_id}?...      → Delete webhook
```

**Events:**
- `lead.created` — Fired when lead captured
- `lead.updated` — Fired when lead status changes

**Payload Example:**
```json
{
  "event": "lead.created",
  "data": {
    "lead_id": "LEAD-12345",
    "name": "John Doe",
    "email": "john@example.com",
    "platform": "widget",
    "timestamp": "2025-01-15T10:30:00Z",
    "tenant_id": "your-tenant"
  }
}
```

---

### 7. 📈 Analytics Dashboard

**Purpose:** Track usage, leads captured, and conversion metrics.

**Location:** `/app/analytics`

**Metrics:**
- **Total Chats** — Number of chat interactions
- **Leads Captured** — Total qualified leads
- **Conversion Rate** — (Leads / Chats) × 100%
- **Last Updated** — Timestamp of last metric update

**Backend Endpoint:**
```http
GET /analytics?tenant_id=...
```

Response:
```json
{
  "tenant_id": "your-tenant",
  "total_chats": 145,
  "total_leads": 23,
  "conversion_rate": 15.86,
  "last_updated": "2025-01-15T10:30:00Z"
}
```

**Tracking:**
- Chat count incremented per message (non-test mode)
- Lead count incremented on lead capture
- Conversion rate auto-calculated
- Persisted per tenant

---

### 8. ⚙️ Reliability & Error Handling

**Features:**
- **Retry Logic** — Exponential backoff for Groq API failures
- **Timeout Protection** — 30s timeout on LLM requests
- **Error Handlers** — Graceful HTTP error responses
- **Fallback Responses** — "Sorry, I encountered an issue" message
- **Request Logging** — All errors logged to console

**Groq API Resilience:**
```python
max_retries = 3
for attempt in range(max_retries):
    try:
        # Request to Groq
    except HTTPError as exc:
        if exc.code >= 500 and attempt < max_retries - 1:
            time.sleep(2 ** attempt)  # Backoff
            continue
        raise
```

---

## 🔌 Backend API Reference

### Authentication

**API Key Auth:**
```
Authorization: Bearer {api_key}
```

**Session Auth:**
- Tenant ID + User ID (automatic via frontend)

### Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/configure` | None | Create/update tenant |
| POST | `/chat` | Key/Session | Chat message |
| GET | `/leads` | None | List leads |
| PATCH | `/leads/{id}` | None | Update lead |
| GET | `/widget/config` | None | Widget config |
| POST | `/feedback` | None | Submit feedback |
| GET | `/api-keys` | None | Get API key |
| POST | `/api-keys` | None | Regenerate API key |
| POST | `/webhooks` | None | Create webhook |
| GET | `/webhooks` | None | List webhooks |
| DELETE | `/webhooks/{id}` | None | Delete webhook |
| GET | `/analytics` | None | Get analytics |

---

## 🎨 Frontend Pages

| Route | Purpose | Features |
|-------|---------|----------|
| `/` | Home | Landing/redirect |
| `/onboarding` | Setup | Tenant config, pricing, FAQs |
| `/chat` | Main interface | Chat UI + Test Mode toggle |
| `/leads` | Lead management | Filter, search, edit, export |
| `/analytics` | Metrics | Chats, leads, conversion |
| `/deploy` | Embed script | Copy script, live preview |
| `/settings/api` | API keys | View, regenerate, usage example |
| `/preview` | Widget test | Live widget preview |

---

## 📦 Data Storage

### Backend Storage Structure

```
/backend/data/
├── tenants/
│   ├── tenant-1.json
│   └── tenant-2.json
├── leads/
│   ├── tenant-1.json
│   └── tenant-2.json
├── analytics/
│   ├── tenant-1.json
│   └── tenant-2.json
├── webhooks/
│   ├── tenant-1.json
│   └── tenant-2.json
├── feedback/
│   └── all.json
└── api_keys/
    └── keys.json
```

### Session Storage

- **Redis** (production) — 24h TTL, auto-cleanup
- **In-Memory Fallback** — Development mode
- Stores: messages, intent, sentiment, lead_state

---

## 🔐 Security Considerations

1. **Multi-Tenant Isolation**
   - All queries filtered by `tenant_id`
   - No cross-tenant data leakage

2. **API Key Validation**
   - Bearer token checked on protected routes
   - Keys regenerated on demand

3. **Rate Limiting**
   - Consider adding: 100 req/min per API key
   - Implement via middleware

4. **Data Encryption**
   - Store API keys encrypted in DB
   - Use HTTPS in production

5. **CORS**
   - Frontend configured with proper origins
   - Widget supports any domain

---

## 🚀 Deployment Checklist

- [ ] Set `GROQ_API_KEY` environment variable
- [ ] Configure `CORS_ORIGINS` for frontend domain
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in frontend
- [ ] Test `/widget/config` endpoint
- [ ] Verify email validation in leads
- [ ] Enable Redis for session persistence
- [ ] Set up webhook delivery timeout (10s)
- [ ] Configure monitoring/logging

---

## 📋 Example Workflows

### Workflow 1: Widget Integration

1. Tenant creates agent in `/onboarding`
2. Navigate to `/deploy`
3. Copy embed script
4. Add to website `<head>`
5. Widget appears on website
6. Visitors chat, leads auto-captured

### Workflow 2: CRM Integration

1. Go to Settings → API
2. Copy API key
3. Create webhook: `POST /webhooks`
4. Configure CRM webhook handler
5. Test with sample lead
6. On new lead: webhook fires to CRM

### Workflow 3: Test Mode

1. Go to `/chat`
2. Toggle "Test Mode"
3. Chat with agent
4. Extracted entities show in sidebar
5. Messages don't create leads
6. Submit feedback (👍/👎)

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget not loading | Check `data-tenant` attribute |
| Chat returns error | Verify tenant exists in `/configure` |
| Leads not captured | Check email validation, test mode off |
| API key returns 401 | Verify Bearer token format |
| Analytics showing 0 | Ensure non-test mode chats were sent |

---

## 📚 Next Steps

- [ ] Add rate limiting middleware
- [ ] Implement payment system (Stripe)
- [ ] Add chat history export
- [ ] Build admin dashboard for multi-tenant
- [ ] Add SMS/Email lead notifications
- [ ] Implement A/B testing for prompts
- [ ] Add custom domain support

---

## 📞 Support

For issues or feature requests, contact: support@autostream.ai

