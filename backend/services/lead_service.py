"""
Lead Service
============
Stores and retrieves captured leads per tenant.

Storage: JSON files in ./data/leads/{tenant_id}.json
Each file is a list of lead objects.

Enhanced Lead schema:
    {
        "lead_id": "...",
        "name": "...",
        "email": "...",
        "phone": "...",  # New field
        "platform": "...",
        "user_id": "...",
        "intent": "...",  # New field
        "score": "hot|warm|cold",  # New field
        "status": "new|contacted|qualified|closed|lost",  # New field
        "notes": "...",  # New field
        "timestamp": "ISO8601",
        "updated_at": "ISO8601"  # New field
    }
"""

import json
import os
from datetime import datetime
from typing import Optional, List

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
    phone: Optional[str] = None,
    intent: Optional[str] = None,
) -> dict:
    """
    Persist a captured lead for a tenant.

    Args:
        tenant_id: The tenant this lead belongs to
        name, email, platform: Lead fields
        user_id: Optional originating session user
        phone: Optional phone number
        intent: Optional detected intent

    Returns:
        The saved lead dict
    """
    path = _leads_path(tenant_id)
    leads = _load_raw(path)

    now = datetime.utcnow().isoformat()
    lead_id = f"LEAD-{abs(hash(email + tenant_id + str(datetime.utcnow()))) % 100000:05d}"

    # Score the lead based on intent and other factors
    score = _calculate_lead_score(intent or "", name, email, phone)

    lead = {
        "lead_id": lead_id,
        "name": name,
        "email": email,
        "phone": phone or "",
        "platform": platform,
        "user_id": user_id,
        "intent": intent or "",
        "score": score,
        "status": "new",
        "notes": "",
        "timestamp": now,
        "updated_at": now,
    }
    leads.append(lead)

    with open(path, "w") as f:
        json.dump(leads, f, indent=2)

    print(f"[LeadService] Lead saved for tenant '{tenant_id}': {name} <{email}> (score: {score})")
    return lead


def update_lead(
    tenant_id: str,
    lead_id: str,
    status: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[dict]:
    """
    Update a lead's status and/or notes.

    Args:
        tenant_id: The tenant the lead belongs to
        lead_id: The ID of the lead to update
        status: New status (optional)
        notes: New notes (optional)

    Returns:
        The updated lead dict, or None if not found
    """
    path = _leads_path(tenant_id)
    leads = _load_raw(path)

    for lead in leads:
        if lead.get("lead_id") == lead_id:
            if status is not None:
                lead["status"] = status
            if notes is not None:
                lead["notes"] = notes
            lead["updated_at"] = datetime.utcnow().isoformat()

            with open(path, "w") as f:
                json.dump(leads, f, indent=2)

            print(f"[LeadService] Lead updated for tenant '{tenant_id}': {lead_id} (status: {status})")
            return lead

    return None


def get_leads(tenant_id: str) -> List[dict]:
    """
    Retrieve all leads for a tenant.

    Returns:
        List of lead dicts, newest first
    """
    path = _leads_path(tenant_id)
    leads = _load_raw(path)
    return sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)


def _calculate_lead_score(intent: str, name: str, email: str, phone: Optional[str]) -> str:
    """
    Calculate lead score based on intent, completeness, and other factors.

    Returns:
        "hot", "warm", or "cold"
    """
    score = 0

    # Intent-based scoring
    intent_lower = intent.lower()
    if any(keyword in intent_lower for keyword in ["buy", "purchase", "pricing", "cost", "quote"]):
        score += 3
    elif any(keyword in intent_lower for keyword in ["info", "learn", "details", "more"]):
        score += 2
    elif any(keyword in intent_lower for keyword in ["contact", "call", "email"]):
        score += 1

    # Completeness scoring
    if name and name.strip():
        score += 1
    if email and "@" in email:
        score += 1
    if phone and phone.strip():
        score += 1

    # Determine final score
    if score >= 5:
        return "hot"
    elif score >= 3:
        return "warm"
    else:
        return "cold"


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
