"""
Lead capture tool for AutoStream agent.

Simulates a mock CRM API call. In production, this would POST to
a backend service (e.g. HubSpot, Salesforce, or a custom API).
"""

import json
import re
from datetime import datetime
from typing import Optional, Tuple


def mock_lead_capture(name: str, email: str, platform: str) -> dict:
    """
    Mock API function to capture a qualified lead.

    Args:
        name: Full name of the lead
        email: Email address of the lead
        platform: Creator platform (YouTube, Instagram, TikTok, etc.)

    Returns:
        dict with status, message, and lead metadata
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"\n{'='*55}")
    print(f"  ✅  LEAD CAPTURED SUCCESSFULLY")
    print(f"{'='*55}")
    print(f"  Name     : {name}")
    print(f"  Email    : {email}")
    print(f"  Platform : {platform}")
    print(f"  Time     : {timestamp}")
    print(f"{'='*55}\n")

    # Simulate a CRM API response
    return {
        "status": "success",
        "message": f"Lead captured successfully: {name}, {email}, {platform}",
        "lead_id": f"LEAD-{abs(hash(email)) % 100000:05d}",
        "lead": {
            "name": name,
            "email": email,
            "platform": platform,
            "captured_at": datetime.now().isoformat(),
            "source": "autostream-chat-agent",
        }
    }


def validate_email(email: str) -> bool:
    """Validate email format using regex."""
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email.strip()))


def validate_lead_data(
    name: Optional[str],
    email: Optional[str],
    platform: Optional[str]
) -> Tuple[bool, str]:
    """
    Validate all lead fields before triggering capture.

    Returns:
        (is_valid: bool, error_message: str)
    """
    if not name or not name.strip():
        return False, "Name is missing or empty."
    if len(name.strip()) < 2:
        return False, "Name seems too short."
    if not email or not email.strip():
        return False, "Email is missing."
    if not validate_email(email):
        return False, f"'{email}' does not appear to be a valid email address."
    if not platform or not platform.strip():
        return False, "Creator platform is missing."
    return True, ""
