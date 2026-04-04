-- ─── Organizations ───────────────────────────────────────────────────────────

CREATE TYPE subscription_tier AS ENUM ('trial', 'professional', 'enterprise');

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  subscription_tier subscription_tier NOT NULL DEFAULT 'trial',
  settings    JSONB NOT NULL DEFAULT '{
    "timezone": "UTC",
    "displayUnits": "metric",
    "features": {
      "matchAnalytics": true,
      "nutritionTracking": true,
      "wearableIntegration": false,
      "videoLibrary": true
    }
  }'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- Updated_at trigger (reused across all tables)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
