"""
Lead Service
============
Stores and retrieves captured leads per tenant using PostgreSQL.
"""

from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy.exc import SQLAlchemyError

from db import SessionLocal
from models import Lead


def _calculate_lead_score(intent: str, name: str, email: str, phone: Optional[str]) -> str:
    score = 0
    intent_lower = (intent or "").lower()

    if any(keyword in intent_lower for keyword in ["buy", "purchase", "pricing", "cost", "quote"]):
        score += 3
    elif any(keyword in intent_lower for keyword in ["info", "learn", "details", "more"]):
        score += 2
    elif any(keyword in intent_lower for keyword in ["contact", "call", "email"]):
        score += 1

    if name and name.strip():
        score += 1
    if email and "@" in email:
        score += 1
    if phone and phone.strip():
        score += 1

    if score >= 5:
        return "hot"
    elif score >= 3:
        return "warm"
    return "cold"


def save_lead(
    tenant_id: str,
    name: str,
    email: str,
    platform: str,
    user_id: Optional[str] = None,
    phone: Optional[str] = None,
    intent: Optional[str] = None,
) -> dict:
    """Persist a captured lead for a tenant."""
    with SessionLocal() as session:
        try:
            lead = (
                session.query(Lead)
                .filter_by(tenant_id=tenant_id, email=email)
                .one_or_none()
            )
            now = datetime.utcnow()
            score = _calculate_lead_score(intent or "", name, email, phone)

            if lead:
                lead.name = name or lead.name
                lead.phone = phone or lead.phone
                lead.platform = platform or lead.platform
                lead.user_id = user_id or lead.user_id
                lead.intent = intent or lead.intent
                lead.score = score
                lead.status = "new"
                lead.updated_at = now
            else:
                lead = Lead(
                    lead_id=str(uuid4()),
                    tenant_id=tenant_id,
                    name=name,
                    email=email,
                    phone=phone or "",
                    platform=platform or "",
                    user_id=user_id,
                    intent=intent or "",
                    score=score,
                    status="new",
                    notes="",
                    created_at=now,
                    updated_at=now,
                )
                session.add(lead)

            session.commit()
            session.refresh(lead)

            return {
                "lead_id": lead.lead_id,
                "tenant_id": lead.tenant_id,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "platform": lead.platform,
                "user_id": lead.user_id,
                "intent": lead.intent,
                "score": lead.score,
                "status": lead.status,
                "notes": lead.notes,
                "created_at": lead.created_at.isoformat(),
                "updated_at": lead.updated_at.isoformat(),
            }
        except SQLAlchemyError as exc:
            session.rollback()
            raise RuntimeError(f"Unable to save lead: {exc}") from exc


def update_lead_status(
    tenant_id: str,
    lead_id: str,
    status: Optional[str] = None,
    notes: Optional[str] = None,
) -> Optional[dict]:
    with SessionLocal() as session:
        try:
            lead = (
                session.query(Lead)
                .filter_by(tenant_id=tenant_id, lead_id=lead_id)
                .one_or_none()
            )
            if not lead:
                return None

            if status is not None:
                lead.status = status
            if notes is not None:
                lead.notes = notes
            lead.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(lead)
            return {
                "lead_id": lead.lead_id,
                "tenant_id": lead.tenant_id,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "platform": lead.platform,
                "user_id": lead.user_id,
                "intent": lead.intent,
                "score": lead.score,
                "status": lead.status,
                "notes": lead.notes,
                "created_at": lead.created_at.isoformat(),
                "updated_at": lead.updated_at.isoformat(),
            }
        except SQLAlchemyError as exc:
            session.rollback()
            raise RuntimeError(f"Unable to update lead: {exc}") from exc


def get_leads(tenant_id: str, limit: int = 100, offset: int = 0) -> List[dict]:
    """Retrieve leads for a tenant with pagination."""
    with SessionLocal() as session:
        leads = (
            session.query(Lead)
            .filter_by(tenant_id=tenant_id)
            .order_by(Lead.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [
            {
                "lead_id": lead.lead_id,
                "tenant_id": lead.tenant_id,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "platform": lead.platform,
                "user_id": lead.user_id,
                "intent": lead.intent,
                "score": lead.score,
                "status": lead.status,
                "notes": lead.notes,
                "created_at": lead.created_at.isoformat(),
                "updated_at": lead.updated_at.isoformat(),
            }
            for lead in leads
        ]
