-- Supabase schema migration: initial tenants and leads tables
-- Run this on your Supabase/Postgres database to create the required schema.

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    tone VARCHAR(32) NOT NULL DEFAULT 'friendly',
    pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
    faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants (tenant_id);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(64) NOT NULL UNIQUE,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    platform VARCHAR(128),
    user_id VARCHAR(128),
    intent TEXT,
    score VARCHAR(16) NOT NULL DEFAULT 'cold',
    status VARCHAR(24) NOT NULL DEFAULT 'new',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_email ON leads (tenant_id, email);

ALTER TABLE tenants
    ADD CONSTRAINT tenants_tone_check CHECK (tone IN ('friendly', 'professional', 'casual', 'formal', 'bold'));

ALTER TABLE leads
    ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'closed', 'lost'));
