"""
API Key Service
===============
Manages API keys for tenant authentication.

Storage: API keys are stored in the tenant config JSON files.
"""

import secrets
import os
from typing import Optional

from .tenant_service import load_tenant, save_tenant


def generate_api_key(tenant_id: str) -> str:
    """
    Generate a new API key for a tenant.

    Args:
        tenant_id: The tenant to generate API key for

    Returns:
        The new API key
    """
    api_key = f"sk_{secrets.token_urlsafe(32)}"

    # Load current tenant config
    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise ValueError(f"Tenant '{tenant_id}' not found")

    # Update with new API key
    tenant_config["api_key"] = api_key
    tenant_config["api_key_created_at"] = __import__("datetime").datetime.utcnow().isoformat()

    # Save updated config
    save_tenant(tenant_id, tenant_config)

    return api_key


def get_api_key(tenant_id: str) -> str:
    """
    Get the API key for a tenant.

    Args:
        tenant_id: The tenant to get API key for

    Returns:
        The API key, or generates one if none exists
    """
    tenant_config = load_tenant(tenant_id)
    if not tenant_config:
        raise ValueError(f"Tenant '{tenant_id}' not found")

    api_key = tenant_config.get("api_key")
    if not api_key:
        # Generate one if it doesn't exist
        api_key = generate_api_key(tenant_id)

    return api_key


def validate_api_key(tenant_id: str, api_key: str) -> bool:
    """
    Validate an API key for a tenant.

    Args:
        tenant_id: The tenant ID
        api_key: The API key to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        stored_key = get_api_key(tenant_id)
        return stored_key == api_key
    except ValueError:
        return False