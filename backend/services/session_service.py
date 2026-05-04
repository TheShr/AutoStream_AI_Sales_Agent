"""
Session Service
===============
Manages per-user conversation state.

Key format: session:{tenant_id}:{user_id}

Storage strategy:
  1. Try Redis (if REDIS_URL is set)
  2. Fall back to in-memory dict (development / no-Redis mode)

State is serialized to JSON for storage, deserialized on load.
LangChain message objects are converted to/from dicts.
"""

import json
import os
from typing import Optional
from datetime import datetime

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# In-memory fallback
_memory_store: dict = {}

# Try to connect to Redis
_redis_client = None
try:
    import redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    _redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
    _redis_client.ping()
    print("[SessionService] Redis connected")
except Exception:
    print("[SessionService] Redis unavailable — using in-memory fallback")
    _redis_client = None


SESSION_TTL = 60 * 60 * 24  # 24 hours


def _session_key(tenant_id: str, user_id: str) -> str:
    return f"session:{tenant_id}:{user_id}"


def _serialize_state(state: dict) -> str:
    """Convert AgentState to JSON-serializable dict."""
    serializable = {k: v for k, v in state.items() if k != "messages"}

    # Serialize messages
    messages = []
    for m in state.get("messages", []):
        if isinstance(m, HumanMessage):
            messages.append({"type": "human", "content": m.content})
        elif isinstance(m, AIMessage):
            messages.append({"type": "ai", "content": m.content})
        elif isinstance(m, SystemMessage):
            messages.append({"type": "system", "content": m.content})
    serializable["messages"] = messages

    # Don't store tenant_config in session (injected per-request)
    serializable.pop("tenant_config", None)

    return json.dumps(serializable)


def _deserialize_state(data: str) -> dict:
    """Restore AgentState from JSON string."""
    raw = json.loads(data)

    # Restore message objects
    messages = []
    for m in raw.get("messages", []):
        t = m.get("type")
        content = m.get("content", "")
        if t == "human":
            messages.append(HumanMessage(content=content))
        elif t == "ai":
            messages.append(AIMessage(content=content))
        elif t == "system":
            messages.append(SystemMessage(content=content))
    raw["messages"] = messages

    return raw


def load_session(tenant_id: str, user_id: str) -> Optional[dict]:
    """
    Load existing session state.

    Returns:
        AgentState dict or None if no session exists
    """
    key = _session_key(tenant_id, user_id)

    if _redis_client:
        data = _redis_client.get(key)
        if data:
            return _deserialize_state(data)
    else:
        data = _memory_store.get(key)
        if data:
            return _deserialize_state(data)

    return None


def save_session(tenant_id: str, user_id: str, state: dict) -> None:
    """Persist session state."""
    key = _session_key(tenant_id, user_id)
    serialized = _serialize_state(state)

    if _redis_client:
        _redis_client.setex(key, SESSION_TTL, serialized)
    else:
        _memory_store[key] = serialized


def delete_session(tenant_id: str, user_id: str) -> None:
    """Clear a user's session."""
    key = _session_key(tenant_id, user_id)
    if _redis_client:
        _redis_client.delete(key)
    else:
        _memory_store.pop(key, None)


def list_sessions(tenant_id: str) -> list[str]:
    """List all active user_ids for a tenant (for debugging)."""
    prefix = f"session:{tenant_id}:"
    if _redis_client:
        return [k.replace(prefix, "") for k in _redis_client.keys(f"{prefix}*")]
    else:
        return [k.replace(prefix, "") for k in _memory_store.keys() if k.startswith(prefix)]
