"""
Tenant Service
==============
Manages tenant configurations using PostgreSQL via SQLAlchemy.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError

from db import SessionLocal
from models import Tenant


def save_tenant(tenant_id: str, config: dict) -> dict:
    """
    Create or update a tenant configuration.
    """
    with SessionLocal() as session:
        try:
            tenant = session.query(Tenant).filter_by(tenant_id=tenant_id).one_or_none()
            now = datetime.utcnow()

            if tenant:
                tenant.business_name = config.get("business_name", tenant.business_name)
                tenant.description = config.get("description", tenant.description)
                tenant.tone = config.get("tone", tenant.tone)
                tenant.pricing = config.get("pricing", tenant.pricing or {})
                tenant.faqs = config.get("faqs", tenant.faqs or [])
                tenant.updated_at = now
            else:
                tenant = Tenant(
                    tenant_id=tenant_id,
                    business_name=config.get("business_name", ""),
                    description=config.get("description", ""),
                    tone=config.get("tone", "friendly"),
                    pricing=config.get("pricing", {}) or {},
                    faqs=config.get("faqs", []) or [],
                    created_at=now,
                    updated_at=now,
                )
                session.add(tenant)

            session.commit()
            session.refresh(tenant)

            return {
                "tenant_id": tenant.tenant_id,
                "business_name": tenant.business_name,
                "description": tenant.description,
                "tone": tenant.tone,
                "pricing": tenant.pricing,
                "faqs": tenant.faqs,
                "created_at": tenant.created_at.isoformat(),
                "updated_at": tenant.updated_at.isoformat(),
            }
        except SQLAlchemyError as exc:
            session.rollback()
            raise RuntimeError(f"Unable to save tenant: {exc}") from exc


def load_tenant(tenant_id: str) -> Optional[dict]:
    """Load tenant configuration by ID."""
    with SessionLocal() as session:
        tenant = session.query(Tenant).filter_by(tenant_id=tenant_id).one_or_none()
        if not tenant:
            return None
        return {
            "tenant_id": tenant.tenant_id,
            "business_name": tenant.business_name,
            "description": tenant.description,
            "tone": tenant.tone,
            "pricing": tenant.pricing,
            "faqs": tenant.faqs,
            "created_at": tenant.created_at.isoformat(),
            "updated_at": tenant.updated_at.isoformat(),
        }


def list_tenants() -> list[dict]:
    """List all configured tenants (summary view)."""
    with SessionLocal() as session:
        tenants = session.query(Tenant).order_by(Tenant.created_at.desc()).all()
        return [
            {
                "tenant_id": tenant.tenant_id,
                "business_name": tenant.business_name,
                "tone": tenant.tone,
                "created_at": tenant.created_at.isoformat(),
                "updated_at": tenant.updated_at.isoformat(),
            }
            for tenant in tenants
        ]


def delete_tenant(tenant_id: str) -> bool:
    """Delete a tenant and all associated data."""
    with SessionLocal() as session:
        tenant = session.query(Tenant).filter_by(tenant_id=tenant_id).one_or_none()
        if not tenant:
            return False
        session.delete(tenant)
        session.commit()
        return True
