-- ─── Athlete Profiles ────────────────────────────────────────────────────────

CREATE TYPE volleyball_position AS ENUM (
  'setter', 'libero', 'outside_hitter', 'opposite', 'middle_blocker', 'defensive_specialist'
);

CREATE TYPE experience_tier AS ENUM (
  'developmental', 'collegiate', 'national', 'professional'
);

CREATE TABLE athlete_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  primary_position          volleyball_position NOT NULL,
  secondary_positions       volleyball_position[] NOT NULL DEFAULT '{}',
  jersey_number             SMALLINT CHECK (jersey_number BETWEEN 1 AND 99),
  height_cm                 NUMERIC(5,1) CHECK (height_cm BETWEEN 100 AND 250),
  weight_kg                 NUMERIC(5,1) CHECK (weight_kg BETWEEN 30 AND 200),
  wingspan_cm               NUMERIC(5,1),
  standing_reach_cm         NUMERIC(5,1),
  dominant_hand             VARCHAR(5) NOT NULL DEFAULT 'right' CHECK (dominant_hand IN ('left', 'right')),
  training_age_years        SMALLINT CHECK (training_age_years BETWEEN 0 AND 50),
  experience_tier           experience_tier NOT NULL DEFAULT 'developmental',
  date_of_birth             DATE,
  nationality               VARCHAR(100),
  onboarding_completed_at   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX idx_athlete_profiles_organization ON athlete_profiles(organization_id);
CREATE INDEX idx_athlete_profiles_position ON athlete_profiles(organization_id, primary_position);
CREATE INDEX idx_athlete_profiles_user ON athlete_profiles(user_id);

CREATE TRIGGER athlete_profiles_updated_at
  BEFORE UPDATE ON athlete_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Performance Tests ───────────────────────────────────────────────────────

CREATE TYPE test_type AS ENUM (
  'vertical_jump_standing', 'vertical_jump_approach', 'block_jump',
  'sprint_505', 'shuttle_535',
  'squat_1rm', 'hang_clean_1rm', 'rdl_1rm', 'bench_1rm', 'overhead_press_1rm',
  'rsi', 'rfd', 'serve_velocity', 'custom'
);

CREATE TYPE device_source AS ENUM (
  'manual', 'force_plate', 'gps_vest', 'phone_accel', 'radar_gun'
);

CREATE TABLE performance_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tested_by       UUID NOT NULL REFERENCES users(id),
  test_date       DATE NOT NULL,
  test_type       test_type NOT NULL,
  value           NUMERIC(10,3) NOT NULL,
  unit            VARCHAR(20) NOT NULL,
  notes           TEXT,
  device_source   device_source NOT NULL DEFAULT 'manual',
  raw_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_tests_athlete ON performance_tests(athlete_id, test_date DESC);
CREATE INDEX idx_performance_tests_type ON performance_tests(athlete_id, test_type, test_date DESC);
CREATE INDEX idx_performance_tests_organization ON performance_tests(organization_id);
