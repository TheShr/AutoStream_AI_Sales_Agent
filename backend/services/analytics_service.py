"""
Analytics Service
=================
Tracks usage metrics per tenant.

Storage: JSON files in ./data/analytics/{tenant_id}.json
Tracks chats, leads, and conversion rates.

Schema:
    {
        "tenant_id": "...",
        "total_chats": 0,
        "total_leads": 0,
        "conversion_rate": 0.0,
        "last_updated": "ISO8601"
    }
"""

import json
import os
from datetime import datetime
from typing import Dict, Any

from .lead_service import get_leads

ANALYTICS_DIR = os.path.join(os.path.dirname(__file__), "../data/analytics")


def _analytics_path(tenant_id: str) -> str:
    os.makedirs(ANALYTICS_DIR, exist_ok=True)
    return os.path.join(ANALYTICS_DIR, f"{tenant_id}.json")


def get_analytics(tenant_id: str) -> Dict[str, Any]:
    """
    Get analytics data for a tenant.

    Returns:
        Analytics dict with total_chats, total_leads, conversion_rate
    """
    path = _analytics_path(tenant_id)
    if not os.path.exists(path):
        # Initialize with zero values
        analytics = {
            "tenant_id": tenant_id,
            "total_chats": 0,
            "total_leads": 0,
            "conversion_rate": 0.0,
            "last_updated": datetime.utcnow().isoformat()
        }
        with open(path, "w") as f:
            json.dump(analytics, f, indent=2)
        return analytics

    with open(path, "r") as f:
        try:
            data = json.load(f)
            return data
        except json.JSONDecodeError:
            return {
                "tenant_id": tenant_id,
                "total_chats": 0,
                "total_leads": 0,
                "conversion_rate": 0.0,
                "last_updated": datetime.utcnow().isoformat()
            }


def update_analytics(tenant_id: str, chat_count: int = 0, lead_count: int = 0) -> Dict[str, Any]:
    """
    Update analytics for a tenant.

    Args:
        tenant_id: The tenant to update
        chat_count: Number of new chats to add
        lead_count: Number of new leads to add

    Returns:
        Updated analytics dict
    """
    analytics = get_analytics(tenant_id)

    analytics["total_chats"] += chat_count
    analytics["total_leads"] += lead_count

    # Recalculate conversion rate
    if analytics["total_chats"] > 0:
        analytics["conversion_rate"] = round((analytics["total_leads"] / analytics["total_chats"]) * 100, 2)
    else:
        analytics["conversion_rate"] = 0.0

    analytics["last_updated"] = datetime.utcnow().isoformat()

    path = _analytics_path(tenant_id)
    with open(path, "w") as f:
        json.dump(analytics, f, indent=2)

    print(f"[AnalyticsService] Updated analytics for tenant '{tenant_id}': {analytics['total_chats']} chats, {analytics['total_leads']} leads, {analytics['conversion_rate']}% conversion")
    return analytics


def track_chat(tenant_id: str) -> None:
    """Increment chat count for a tenant."""
    update_analytics(tenant_id, chat_count=1)


def track_lead(tenant_id: str) -> None:
    """Increment lead count for a tenant."""
    update_analytics(tenant_id, lead_count=1)