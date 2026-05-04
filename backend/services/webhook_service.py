"""
Webhook Service
================
Manages webhooks for tenant events.

Storage: JSON files in ./data/webhooks/{tenant_id}.json
Each file is a list of webhook objects.

Webhook schema:
    {
        "webhook_id": "...",
        "tenant_id": "...",
        "url": "...",
        "events": ["lead.created"],
        "created_at": "ISO8601"
    }
"""

import json
import os
import aiohttp
from datetime import datetime
from typing import List, Dict, Any

WEBHOOKS_DIR = os.path.join(os.path.dirname(__file__), "../data/webhooks")


def _webhooks_path(tenant_id: str) -> str:
    os.makedirs(WEBHOOKS_DIR, exist_ok=True)
    return os.path.join(WEBHOOKS_DIR, f"{tenant_id}.json")


def create_webhook(tenant_id: str, url: str, events: List[str]) -> dict:
    """
    Create a webhook for a tenant.

    Args:
        tenant_id: The tenant this webhook belongs to
        url: The webhook URL
        events: List of events to trigger on

    Returns:
        The created webhook dict
    """
    path = _webhooks_path(tenant_id)
    webhooks = _load_raw(path)

    webhook = {
        "webhook_id": f"WH-{abs(hash(url + tenant_id + str(datetime.utcnow()))) % 100000:05d}",
        "tenant_id": tenant_id,
        "url": url,
        "events": events,
        "created_at": datetime.utcnow().isoformat(),
    }
    webhooks.append(webhook)

    with open(path, "w") as f:
        json.dump(webhooks, f, indent=2)

    print(f"[WebhookService] Webhook created for tenant '{tenant_id}': {url}")
    return webhook


def get_webhooks(tenant_id: str) -> List[dict]:
    """
    Get all webhooks for a tenant.

    Returns:
        List of webhook dicts
    """
    path = _webhooks_path(tenant_id)
    return _load_raw(path)


def delete_webhook(tenant_id: str, webhook_id: str) -> bool:
    """
    Delete a webhook.

    Args:
        tenant_id: The tenant the webhook belongs to
        webhook_id: The webhook ID to delete

    Returns:
        True if deleted, False if not found
    """
    path = _webhooks_path(tenant_id)
    webhooks = _load_raw(path)

    for i, webhook in enumerate(webhooks):
        if webhook.get("webhook_id") == webhook_id:
            webhooks.pop(i)
            with open(path, "w") as f:
                json.dump(webhooks, f, indent=2)
            print(f"[WebhookService] Webhook deleted for tenant '{tenant_id}': {webhook_id}")
            return True

    return False


async def trigger_webhooks(tenant_id: str, event: str, data: Dict[str, Any]) -> None:
    """
    Trigger webhooks for a specific event.

    Args:
        tenant_id: The tenant to trigger webhooks for
        event: The event type (e.g., "lead.created")
        data: The event payload
    """
    webhooks = get_webhooks(tenant_id)

    payload = {
        "event": event,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }

    async with aiohttp.ClientSession() as session:
        for webhook in webhooks:
            if event in webhook.get("events", []):
                try:
                    async with session.post(
                        webhook["url"],
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=aiohttp.ClientTimeout(total=5)  # 5 second timeout
                    ) as response:
                        if response.status >= 200 and response.status < 300:
                            print(f"[WebhookService] Webhook triggered successfully: {webhook['url']} for event {event}")
                        else:
                            print(f"[WebhookService] Webhook failed with status {response.status}: {webhook['url']}")
                except Exception as e:
                    print(f"[WebhookService] Webhook error for {webhook['url']}: {str(e)}")


def _load_raw(path: str) -> list:
    """Load webhooks JSON or return empty list if file doesn't exist."""
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []