from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB

from db import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(64), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tone = Column(String(32), nullable=False, default="friendly")
    pricing = Column(JSONB, nullable=False, default=dict)
    faqs = Column(JSONB, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(String(64), unique=True, nullable=False, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.tenant_id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(64), nullable=True)
    platform = Column(String(128), nullable=True)
    user_id = Column(String(128), nullable=True)
    intent = Column(Text, nullable=True)
    score = Column(String(16), nullable=False, default="cold")
    status = Column(String(24), nullable=False, default="new")
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


Index("ix_leads_tenant_email", Lead.tenant_id, Lead.email)
