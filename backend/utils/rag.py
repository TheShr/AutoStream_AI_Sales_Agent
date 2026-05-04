"""
RAG (Retrieval-Augmented Generation) — Multi-Tenant Version
============================================================
Instead of loading a single hardcoded JSON file, this module
now retrieves context from the tenant's own knowledge base config.

The tenant KB is built from their config dict:
  - pricing plans
  - FAQs
  - description
  - policies (if provided)

In production, replace with a vector store (FAISS, Chroma, Pinecone).
"""

from typing import Optional


def retrieve_context(query: str, tenant_config: dict) -> str:
    """
    Retrieve relevant knowledge base sections for a query.

    Uses keyword-based matching against the tenant's config.
    Now fully tenant-isolated — no global state.

    Args:
        query: The user's message or question
        tenant_config: The tenant's configuration dict

    Returns:
        Formatted string of relevant KB content
    """
    query_lower = query.lower()
    sections = []

    business_name = tenant_config.get("business_name", "Company")
    description = tenant_config.get("description", "")

    # Always include company context
    sections.append(f"Company: {business_name}\n{description}")

    # ── PRICING ──
    pricing_keywords = [
        "price", "pricing", "plan", "cost", "month", "annual", "yearly",
        "how much", "subscription", "fee", "afford", "cheap", "upgrade",
        "starter", "basic", "pro", "enterprise", "free", "trial"
    ]
    if any(kw in query_lower for kw in pricing_keywords):
        pricing = tenant_config.get("pricing", {})
        if pricing:
            pricing_text = f"{business_name} Pricing:\n"
            # Handle both list-of-plans format and flat dict format
            if isinstance(pricing, list):
                for plan in pricing:
                    pricing_text += _format_plan(plan)
            elif isinstance(pricing, dict):
                plans = pricing.get("plans", [])
                if plans:
                    for plan in plans:
                        pricing_text += _format_plan(plan)
                else:
                    # Flat key-value pricing dict
                    for k, v in pricing.items():
                        pricing_text += f"• {k}: {v}\n"
            sections.append(pricing_text)

    # ── FAQs ──
    faq_keywords = [
        "how", "can i", "what", "when", "where", "why", "support",
        "cancel", "refund", "return", "policy", "work", "feature",
        "platform", "export", "format", "upgrade", "downgrade"
    ]
    if any(kw in query_lower for kw in faq_keywords):
        faqs = tenant_config.get("faqs", [])
        if faqs:
            faq_text = "FAQs:\n"
            for faq in faqs:
                if isinstance(faq, dict):
                    q = faq.get("question", faq.get("q", ""))
                    a = faq.get("answer", faq.get("a", ""))
                    if q and a:
                        faq_text += f"• Q: {q}\n  A: {a}\n"
                elif isinstance(faq, str):
                    faq_text += f"• {faq}\n"
            sections.append(faq_text)

    return "\n\n".join(sections)


def _format_plan(plan: dict) -> str:
    """Format a single pricing plan dict into readable text."""
    name = plan.get("name", plan.get("id", "Plan"))
    price = plan.get("price_monthly", plan.get("price", plan.get("monthly", "")))
    annual = plan.get("price_annual", plan.get("annual", ""))
    features = plan.get("features", plan.get("includes", []))
    ideal_for = plan.get("ideal_for", plan.get("description", ""))

    text = f"\n• {name}"
    if price:
        text += f" — ${price}/month"
    if annual:
        text += f" (${annual}/year)"
    text += "\n"
    if ideal_for:
        text += f"  Best for: {ideal_for}\n"
    if features and isinstance(features, list):
        text += f"  Features: {', '.join(features)}\n"
    return text


def get_full_knowledge_base_summary(tenant_config: dict) -> str:
    """
    Build a full formatted KB summary for the system prompt.
    Used once during prompt construction, not on every query.

    Args:
        tenant_config: Tenant configuration dict

    Returns:
        Formatted multi-section KB string
    """
    business_name = tenant_config.get("business_name", "Company")
    description = tenant_config.get("description", "")
    pricing = tenant_config.get("pricing", {})
    faqs = tenant_config.get("faqs", [])

    summary = f"=== {business_name} Knowledge Base ===\n\n"
    summary += f"{description}\n\n"

    # Pricing section
    if pricing:
        summary += "--- PRICING ---\n"
        if isinstance(pricing, list):
            for plan in pricing:
                summary += _format_plan(plan)
        elif isinstance(pricing, dict):
            plans = pricing.get("plans", [])
            if plans:
                for plan in plans:
                    summary += _format_plan(plan)
            else:
                for k, v in pricing.items():
                    summary += f"• {k}: {v}\n"
        summary += "\n"

    # FAQs section
    if faqs:
        summary += "--- FAQs ---\n"
        for faq in faqs:
            if isinstance(faq, dict):
                q = faq.get("question", faq.get("q", ""))
                a = faq.get("answer", faq.get("a", ""))
                if q and a:
                    summary += f"Q: {q}\nA: {a}\n\n"
            elif isinstance(faq, str):
                summary += f"• {faq}\n"

    return summary.strip()
