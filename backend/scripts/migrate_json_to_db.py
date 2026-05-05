import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from db import Base, SessionLocal, engine
from models import Tenant, Lead

TENANTS_DIR = Path(__file__).resolve().parents[1] / "data" / "tenants"
LEADS_DIR = Path(__file__).resolve().parents[1] / "data" / "leads"


def migrate_tenants(session):
    TENANTS_DIR.mkdir(parents=True, exist_ok=True)
    for tenant_file in TENANTS_DIR.glob("*.json"):
        with tenant_file.open("r", encoding="utf-8") as f:
            data = json.load(f)

        tenant_id = data.get("tenant_id")
        if not tenant_id:
            print(f"Skipping {tenant_file.name}: missing tenant_id")
            continue

        existing = session.query(Tenant).filter_by(tenant_id=tenant_id).one_or_none()
        now = data.get("updated_at") or data.get("created_at")

        if existing:
            existing.business_name = data.get("business_name", existing.business_name)
            existing.description = data.get("description", existing.description)
            existing.tone = data.get("tone", existing.tone)
            existing.pricing = data.get("pricing", existing.pricing or {})
            existing.faqs = data.get("faqs", existing.faqs or [])
            existing.updated_at = now or existing.updated_at
        else:
            tenant = Tenant(
                tenant_id=tenant_id,
                business_name=data.get("business_name", ""),
                description=data.get("description", ""),
                tone=data.get("tone", "friendly"),
                pricing=data.get("pricing", {}) or {},
                faqs=data.get("faqs", []) or [],
                created_at=data.get("created_at"),
                updated_at=now,
            )
            session.add(tenant)

    session.commit()
    print("Tenant migration complete.")


def migrate_leads(session):
    LEADS_DIR.mkdir(parents=True, exist_ok=True)
    for lead_file in LEADS_DIR.glob("*.json"):
        tenant_id = lead_file.stem
        with lead_file.open("r", encoding="utf-8") as f:
            leads = json.load(f)

        if not isinstance(leads, list):
            print(f"Skipping {lead_file.name}: invalid JSON format")
            continue

        for entry in leads:
            email = entry.get("email")
            if not email:
                continue

            lead_id = entry.get("lead_id") or f"LEAD-{tenant_id}-{abs(hash(email)) % 100000:05d}"
            existing = (
                session.query(Lead)
                .filter_by(tenant_id=tenant_id, email=email)
                .one_or_none()
            )
            if existing:
                existing.name = entry.get("name", existing.name)
                existing.phone = entry.get("phone", existing.phone)
                existing.platform = entry.get("platform", existing.platform)
                existing.user_id = entry.get("user_id", existing.user_id)
                existing.intent = entry.get("intent", existing.intent)
                existing.score = entry.get("score", existing.score)
                existing.status = entry.get("status", existing.status)
                existing.notes = entry.get("notes", existing.notes)
                existing.updated_at = entry.get("updated_at") or existing.updated_at
                continue

            lead = Lead(
                lead_id=lead_id,
                tenant_id=tenant_id,
                name=entry.get("name", ""),
                email=email,
                phone=entry.get("phone", ""),
                platform=entry.get("platform", ""),
                user_id=entry.get("user_id"),
                intent=entry.get("intent", ""),
                score=entry.get("score", "cold"),
                status=entry.get("status", "new"),
                notes=entry.get("notes", ""),
                created_at=entry.get("timestamp"),
                updated_at=entry.get("updated_at") or entry.get("timestamp"),
            )
            session.add(lead)

    session.commit()
    print("Lead migration complete.")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        migrate_tenants(session)
        migrate_leads(session)
    print("Migration finished.")
