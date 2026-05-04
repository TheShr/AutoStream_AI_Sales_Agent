"""
Tenant Service
==============
Manages tenant configurations.

Storage: JSON files in ./data/tenants/{tenant_id}.json
Designed so swapping to PostgreSQL requires only changing
the load/save methods — the interface stays the same.
"""

import json
import os
from typing import Optional
from datetime import datetime

TENANTS_DIR = os.path.join(os.path.dirname(__file__), "../data/tenants")


def _tenant_path(tenant_id: str) -> str:
    os.makedirs(TENANTS_DIR, exist_ok=True)
    return os.path.join(TENANTS_DIR, f"{tenant_id}.json")


def save_tenant(tenant_id: str, config: dict) -> dict:
    """
    Create or update a tenant configuration.

    Args:
        tenant_id: Unique identifier (e.g. "gympro")
        config: Full tenant config dict

    Returns:
        Saved config with metadata
    """
    existing = load_tenant(tenant_id) or {}
    now = datetime.utcnow().isoformat()

    tenant = {
        **existing,
        **config,
        "tenant_id": tenant_id,
        "updated_at": now,
        "created_at": existing.get("created_at", now),
    }

    with open(_tenant_path(tenant_id), "w") as f:
        json.dump(tenant, f, indent=2)

    return tenant


def load_tenant(tenant_id: str) -> Optional[dict]:
    """
    Load tenant configuration by ID.

    Returns:
        Tenant config dict, or None if not found
    """
    path = _tenant_path(tenant_id)
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return json.load(f)


def list_tenants() -> list[dict]:
    """
    List all configured tenants (summary view).

    Returns:
        List of tenant summary dicts
    """
    os.makedirs(TENANTS_DIR, exist_ok=True)
    tenants = []
    for fname in os.listdir(TENANTS_DIR):
        if fname.endswith(".json"):
            path = os.path.join(TENANTS_DIR, fname)
            with open(path, "r") as f:
                data = json.load(f)
                tenants.append({
                    "tenant_id": data.get("tenant_id"),
                    "business_name": data.get("business_name"),
                    "tone": data.get("tone"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                })
    return tenants


def delete_tenant(tenant_id: str) -> bool:
    """Delete a tenant and all associated data."""
    path = _tenant_path(tenant_id)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False
