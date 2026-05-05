# AutoStream SaaS — Quick Start Guide

> Get your AI Sales Agent platform up and running in 10 minutes.

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- Groq API key (free: [console.groq.com](https://console.groq.com))
- Redis (optional, local dev uses memory)

---

## 1. Backend Setup

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Configure Environment

Create `.env` file:

```env
GROQ_API_KEY=gsk_your_api_key_here
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Start Server

```bash
python main.py
```

✅ Server runs at `http://localhost:8000`

---

## 2. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Start Dev Server

```bash
npm run dev
```

✅ App runs at `http://localhost:3000`

---

## 3. First Agent Setup

1. **Go to** `http://localhost:3000/onboarding`
2. **Fill in:**
   - Tenant ID: `my-company` (alphanumeric + hyphens)
   - Business Name: `My Company`
   - Description: Brief about your business
   - Tone: Select one (friendly, professional, etc.)
   - Add pricing tiers (optional)
   - Add FAQs (optional)
3. **Click "Configure Agent"**

✅ Agent created and ready!

---

## 4. Test the Chat

1. **Go to** `http://localhost:3000/chat`
2. **Type a message:** "Tell me about your pricing"
3. **Watch it respond** with your agent personality

---

## 5. Try Test Mode

1. **In Chat page**, toggle "Test Mode"
2. **Chat again**, notice extracted entities appear:
   - Intent (pricing, demo, support, etc.)
   - Sentiment (positive, neutral, negative)
   - Lead fields (name, email, etc.)
3. **Messages don't create leads** in test mode
4. **Submit feedback** (👍/👎)

---

## 6. Capture Real Leads

1. **Toggle back to "Live Mode"**
2. **Chat with intent to capture:**
   - Agent will ask for name, email, platform
   - Lead auto-created after conversation
3. **Go to** `/leads` **to see captured leads**

---

## 7. Export & Manage Leads

In `/leads` page:
- **Filter** by status, score
- **Search** by name, email
- **Edit status** (new → contacted → qualified → closed)
- **Add notes** to each lead
- **Export CSV** of all leads

---

## 8. Get Embed Script

1. **Go to** `/deploy`
2. **Load tenant config** (it auto-loads if you set it in storage)
3. **Copy embed script**
4. **Add to your website:**

```html
<!DOCTYPE html>
<html>
<head>
  <script src="http://localhost:8000/widget.js" data-tenant="my-company"></script>
</head>
<body>
  <h1>My Website</h1>
  <!-- Widget will appear as floating bubble -->
</body>
</html>
```

✅ Widget now appears as floating chat bubble on your site!

---

## 9. Get API Key

1. **Go to** `/settings/api`
2. **Copy your API key**
3. **Use in external apps:**

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "my-company",
    "user_id": "external_user_123",
    "message": "Hello, I am interested in your services"
  }'
```

---

## 10. View Analytics

1. **Go to** `/analytics`
2. **See:**
   - Total chats sent
   - Leads captured
   - Conversion rate %
   - Last updated time

---

## 🔗 Full Feature List

| Feature | Path | Status |
|---------|------|--------|
| Chat UI | `/chat` | ✅ Working |
| Test Mode | `/chat` (toggle) | ✅ Working |
| Leads Dashboard | `/leads` | ✅ Working |
| Lead Editing | `/leads` | ✅ Working |
| Deploy Script | `/deploy` | ✅ Working |
| Widget | `/public/widget.js` | ✅ Working |
| Analytics | `/analytics` | ✅ Working |
| API Keys | `/settings/api` | ✅ Working |
| Webhooks | `/api` | ✅ Ready |
| Feedback | `/chat` | ✅ Working |

---

## 🚀 Production Deployment

### Render.com (Recommended)

**Backend:**
1. Push to GitHub
2. Create Render service
3. Set environment variables
4. Deploy

**Frontend:**
1. Deploy to Vercel
2. Set `NEXT_PUBLIC_API_BASE_URL`
3. Done!

### Docker

```bash
cd backend
docker build -t autostream-backend .
docker run -p 8000:8000 -e GROQ_API_KEY=... autostream-backend
```

---

## 📋 Troubleshooting

### Widget not loading on my website?

```
Issue: CORS error in console
Fix: Check CORS_ORIGINS environment variable includes your domain
```

### Chat returns "Sorry, I encountered an issue"?

```
Issue: LLM request failed
Fix: Verify GROQ_API_KEY is set and valid
```

### Leads not being captured?

```
Issue: Messages not persisting as leads
Fix: Make sure you're in "Live Mode", not "Test Mode"
```

### API key returns 401?

```
Issue: Invalid authorization header
Fix: Use format: Authorization: Bearer {api_key}
```

---

## 📞 Need Help?

- Check logs: `tail -f backend/logs.txt`
- Verify Groq API status: `https://status.groq.com`
- Read full docs: See `FEATURES.md`

---

## Next: Advanced Features

- Integrate with CRM via webhooks
- Build custom frontend with API
- Deploy widget to multiple sites
- Monitor analytics over time
- A/B test different prompts

Enjoy! 🚀

