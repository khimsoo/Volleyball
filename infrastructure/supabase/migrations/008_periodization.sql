-- ─── Periodization Plans ─────────────────────────────────────────────────────

CREATE TABLE periodization_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id),
  season          VARCHAR(20) NOT NULL,  -- e.g. '2025-2026'
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  phases          JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{phase, start_date, end_date, target_positions, notes}]
  competition_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{date, name, level, taper_days_before_match}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_periodization_organization ON periodization_plans(organization_id);

CREATE TRIGGER periodization_plans_updated_at
  BEFORE UPDATE ON periodization_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
