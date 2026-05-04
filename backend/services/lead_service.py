"""
Lead Service
============
Stores and retrieves captured leads per tenant.

Storage: JSON files in ./data/leads/{tenant_id}.json
Each file is a list of lead objects.

Key format: leads:{tenant_id}

Lead schema:
    {
        "name": "...",
        "email": "...",
        "platform": "...",
        "user_id": "...",
        "timestamp": "ISO8601"
    }
"""

import json
import os
from datetime import datetime
from typing import Optional

LEADS_DIR = os.path.join(os.path.dirname(__file__), "../data/leads")


def _leads_path(tenant_id: str) -> str:
    os.makedirs(LEADS_DIR, exist_ok=True)
    return os.path.join(LEADS_DIR, f"{tenant_id}.json")


def save_lead(
    tenant_id: str,
    name: str,
    email: str,
    platform: str,
    user_id: Optional[str] = None,
) -> dict:
    """
    Persist a captured lead for a tenant.

    Args:
        tenant_id: The tenant this lead belongs to
        name, email, platform: Lead fields
        user_id: Optional originating session user

    Returns:
        The saved lead dict
    """
    path = _leads_path(tenant_id)
    leads = _load_raw(path)

    lead = {
        "name": name,
        "email": email,
        "platform": platform,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "lead_id": f"LEAD-{abs(hash(email + tenant_id)) % 100000:05d}",
    }
    leads.append(lead)

    with open(path, "w") as f:
        json.dump(leads, f, indent=2)

    print(f"[LeadService] Lead saved for tenant '{tenant_id}': {name} <{email}>")
    return lead


def get_leads(tenant_id: str) -> list[dict]:
    """
    Retrieve all leads for a tenant.

    Returns:
        List of lead dicts, newest first
    """
    path = _leads_path(tenant_id)
    leads = _load_raw(path)
    return sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)


def _load_raw(path: str) -> list:
    """Load leads JSON or return empty list if file doesn't exist."""
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []
