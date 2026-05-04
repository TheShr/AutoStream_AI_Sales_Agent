# AutoStream AI Sales Agent — Backend

A FastAPI-based backend service for the AutoStream AI Sales Agent SaaS platform.

## Features

- 🤖 AI-powered sales conversations using LangGraph
- 🔐 Multi-tenant architecture with tenant isolation
- 📊 Lead management with scoring and status tracking
- 🔑 API key management for developer access
- 🪝 Webhook notifications for lead events
- 💬 Real-time chat with test mode support
- 📈 User feedback collection
- 🐳 Docker containerization for easy deployment

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TheShr/AutoStream_AI_Sales_Agent.git
   cd AutoStream_AI_Sales_Agent/backend
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run with Docker Compose (recommended)**
   ```bash
   docker-compose up --build
   ```

4. **Or run locally**
   ```bash
   pip install -r requirements.txt
   python main.py
   ```

The API will be available at `http://localhost:8000`

### API Endpoints

- `GET /health` — Health check
- `POST /chat` — AI chat endpoint
- `GET /leads` — Get leads for tenant
- `PATCH /leads/{lead_id}` — Update lead
- `POST /feedback` — Submit user feedback
- `GET /api-keys` — Get API keys
- `POST /api-keys` — Generate new API key
- `GET /webhooks` — Get webhook configurations
- `POST /webhooks` — Create webhook
- `DELETE /webhooks/{id}` — Delete webhook
- `GET /widget-config` — Get widget configuration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `REDIS_URL` | Redis connection URL | No (falls back to in-memory) |
| `WEBHOOK_VERIFY_TOKEN` | Token for webhook verification | No |

## Docker Deployment

### Render (Recommended)

1. Connect your GitHub repository to Render
2. Use the `render.yaml` blueprint in the root directory
3. Set environment variables in Render dashboard
4. Deploy!

### Manual Docker

```bash
# Build the image
docker build -t autostream-backend .

# Run the container
docker run -p 8000:8000 \
  -e GROQ_API_KEY=your_key_here \
  -e REDIS_URL=redis://your-redis-url \
  autostream-backend
```

## Architecture

- **FastAPI**: High-performance async web framework
- **LangGraph**: AI agent orchestration
- **Redis**: Session persistence (optional)
- **Pydantic v2**: Data validation and serialization
- **Docker**: Containerization for consistent deployment

## Development

### Project Structure

```
backend/
├── api/           # FastAPI routes and server
├── agent/         # LangGraph agent logic
├── services/      # Business logic services
├── utils/         # Utility functions
├── data/          # Data storage (JSON files)
└── main.py        # Application entry point
```

### Testing

```bash
# Run with reload for development
uvicorn api.server:app --reload --port 8000

# Access API docs at http://localhost:8000/docs
```

## License

MIT License