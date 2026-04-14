-- Allow coaches to manage athletes who don't have app accounts.
-- Drops NOT NULL on user_id and adds name/email columns directly on the profile row.

ALTER TABLE athlete_profiles ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE athlete_profiles
  ADD COLUMN IF NOT EXISTS first_name  VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name   VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email       VARCHAR(255);

-- Refresh the insert policy so it no longer needs user_id to be set.
DROP POLICY IF EXISTS "Staff insert athlete profiles" ON athlete_profiles;
CREATE POLICY "Staff insert athlete profiles" ON athlete_profiles
  FOR INSERT WITH CHECK (organization_id = current_org_id() AND is_staff());
