"""
Feedback Service
================
Stores and retrieves feedback for agent responses.

Storage: JSON files in ./data/feedback/{tenant_id}.json
Each file is a list of feedback objects.

Feedback schema:
    {
        "feedback_id": "...",
        "tenant_id": "...",
        "message": "...",
        "response": "...",
        "rating": 1 or -1,
        "timestamp": "ISO8601"
    }
"""

import json
import os
from datetime import datetime
from typing import List

FEEDBACK_DIR = os.path.join(os.path.dirname(__file__), "../data/feedback")


def _feedback_path(tenant_id: str) -> str:
    os.makedirs(FEEDBACK_DIR, exist_ok=True)
    return os.path.join(FEEDBACK_DIR, f"{tenant_id}.json")


def save_feedback(
    tenant_id: str,
    message: str,
    response: str,
    rating: int
) -> dict:
    """
    Persist feedback for a tenant.

    Args:
        tenant_id: The tenant this feedback belongs to
        message: The user message
        response: The agent response
        rating: 1 for thumbs up, -1 for thumbs down

    Returns:
        The saved feedback dict
    """
    path = _feedback_path(tenant_id)
    feedback_list = _load_raw(path)

    feedback = {
        "feedback_id": f"FB-{abs(hash(message + response + tenant_id + str(datetime.utcnow()))) % 100000:05d}",
        "tenant_id": tenant_id,
        "message": message,
        "response": response,
        "rating": rating,
        "timestamp": datetime.utcnow().isoformat(),
    }
    feedback_list.append(feedback)

    with open(path, "w") as f:
        json.dump(feedback_list, f, indent=2)

    print(f"[FeedbackService] Feedback saved for tenant '{tenant_id}': {rating}")
    return feedback


def get_feedback(tenant_id: str) -> List[dict]:
    """
    Retrieve all feedback for a tenant.

    Returns:
        List of feedback dicts, newest first
    """
    path = _feedback_path(tenant_id)
    feedback_list = _load_raw(path)
    return sorted(feedback_list, key=lambda x: x.get("timestamp", ""), reverse=True)


def _load_raw(path: str) -> list:
    """Load feedback JSON or return empty list if file doesn't exist."""
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []