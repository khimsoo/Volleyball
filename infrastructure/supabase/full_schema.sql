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
-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'athlete', 'coach', 'physiotherapist', 'nutritionist', 'admin'
);

CREATE TABLE users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role             user_role NOT NULL DEFAULT 'athlete',
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(255) NOT NULL UNIQUE,
  avatar_url       VARCHAR(500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(organization_id, role);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
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
-- ─── Drills ───────────────────────────────────────────────────────────────────

CREATE TYPE skill_type AS ENUM (
  'serving', 'passing', 'setting', 'attacking', 'blocking',
  'defense', 'conditioning', 'strength', 'mobility'
);

CREATE TYPE drill_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');

CREATE TYPE training_phase AS ENUM (
  'hypertrophy', 'strength', 'power', 'peaking',
  'competition_maintenance', 'deload', 'general'
);

CREATE TABLE drills (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global
  created_by            UUID REFERENCES users(id),
  name                  VARCHAR(255) NOT NULL,
  description           TEXT NOT NULL,
  instructions          TEXT NOT NULL,
  skill_type            skill_type NOT NULL,
  positions_relevant    volleyball_position[] NOT NULL DEFAULT '{}',
  difficulty            drill_difficulty NOT NULL DEFAULT 'intermediate',
  training_phase_tags   training_phase[] NOT NULL DEFAULT '{}',
  equipment_required    VARCHAR(100)[] NOT NULL DEFAULT '{}',
  video_url             VARCHAR(500),
  video_thumbnail_url   VARCHAR(500),
  video_duration_seconds SMALLINT,
  coaching_cues         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{timestamp_seconds: int, cue_text: str, cue_type: str}]
  is_public             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_drills_organization ON drills(organization_id);
CREATE INDEX idx_drills_skill_type ON drills(skill_type);
CREATE INDEX idx_drills_difficulty ON drills(difficulty);
CREATE INDEX idx_drills_public ON drills(is_public) WHERE is_public = true;
CREATE INDEX idx_drills_search ON drills USING gin(to_tsvector('english', name || ' ' || description));

CREATE TRIGGER drills_updated_at
  BEFORE UPDATE ON drills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ─── Training Programs ───────────────────────────────────────────────────────

CREATE TYPE session_type AS ENUM (
  'strength', 'power', 'technical', 'conditioning', 'recovery', 'match'
);

CREATE TYPE program_assignment_status AS ENUM (
  'active', 'paused', 'completed', 'cancelled'
);

CREATE TABLE training_programs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES users(id),
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  target_positions volleyball_position[] NOT NULL DEFAULT '{}',
  phase            training_phase NOT NULL DEFAULT 'general',
  duration_weeks   SMALLINT NOT NULL CHECK (duration_weeks BETWEEN 1 AND 52),
  sessions_per_week SMALLINT NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 14),
  is_template      BOOLEAN NOT NULL DEFAULT false,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_training_programs_organization ON training_programs(organization_id);
CREATE INDEX idx_training_programs_template ON training_programs(organization_id, is_template);

CREATE TABLE program_weeks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id         UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  week_number        SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  volume_modifier    NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (volume_modifier BETWEEN 0 AND 2),
  intensity_modifier NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (intensity_modifier BETWEEN 0 AND 2),
  notes              TEXT,
  UNIQUE (program_id, week_number)
);

CREATE TABLE program_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_week_id           UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  day_of_week               SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  session_type              session_type NOT NULL,
  name                      VARCHAR(255) NOT NULL,
  estimated_duration_minutes SMALLINT NOT NULL DEFAULT 60,
  session_rpe_target        SMALLINT CHECK (session_rpe_target BETWEEN 1 AND 10)
);

CREATE TABLE program_session_drills (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_session_id UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  drill_id           UUID NOT NULL REFERENCES drills(id),
  sequence_order     SMALLINT NOT NULL DEFAULT 0,
  sets               SMALLINT,
  reps               SMALLINT,
  duration_seconds   SMALLINT,
  rest_seconds       SMALLINT,
  intensity_notes    VARCHAR(255)
);

-- Athlete ↔ Program assignments
CREATE TABLE athlete_program_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  program_id   UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  assigned_by  UUID NOT NULL REFERENCES users(id),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       program_assignment_status NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_athlete_assignments_athlete ON athlete_program_assignments(athlete_id, status);
CREATE INDEX idx_athlete_assignments_program ON athlete_program_assignments(program_id);

CREATE TRIGGER training_programs_updated_at
  BEFORE UPDATE ON training_programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER athlete_assignments_updated_at
  BEFORE UPDATE ON athlete_program_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ─── Training Sessions ───────────────────────────────────────────────────────

CREATE TABLE training_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id               UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_session_id       UUID REFERENCES program_sessions(id),
  scheduled_date           DATE NOT NULL,
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  session_type             session_type NOT NULL DEFAULT 'technical',
  location                 VARCHAR(255),
  -- Pre-session readiness
  pre_session_sleep_hours  NUMERIC(4,1) CHECK (pre_session_sleep_hours BETWEEN 0 AND 24),
  pre_session_sleep_quality SMALLINT CHECK (pre_session_sleep_quality BETWEEN 1 AND 5),
  pre_session_soreness     SMALLINT CHECK (pre_session_soreness BETWEEN 1 AND 10),
  pre_session_hrv          NUMERIC(6,2),
  pre_session_readiness_score NUMERIC(5,2) CHECK (pre_session_readiness_score BETWEEN 0 AND 100),
  -- Post-session
  session_rpe              SMALLINT CHECK (session_rpe BETWEEN 1 AND 10),
  coach_notes              TEXT,
  athlete_notes            TEXT,
  total_volume_load        NUMERIC(10,2),  -- computed: sum(sets × reps × kg)
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_sessions_athlete ON training_sessions(athlete_id, scheduled_date DESC);
CREATE INDEX idx_training_sessions_organization ON training_sessions(organization_id, scheduled_date DESC);
CREATE INDEX idx_training_sessions_date ON training_sessions(scheduled_date);

-- ─── Session Drill Logs ──────────────────────────────────────────────────────

CREATE TABLE session_drill_logs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id    UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  drill_id               UUID NOT NULL REFERENCES drills(id),
  sequence_order         SMALLINT NOT NULL DEFAULT 0,
  sets_completed         SMALLINT,
  reps_completed         SMALLINT,
  duration_completed_seconds SMALLINT,
  load_kg                NUMERIC(6,2),
  distance_m             NUMERIC(7,2),
  notes                  VARCHAR(500),
  completed_at           TIMESTAMPTZ
);

CREATE INDEX idx_drill_logs_session ON session_drill_logs(training_session_id);

CREATE TRIGGER training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Injuries ────────────────────────────────────────────────────────────────

CREATE TYPE body_part AS ENUM (
  'ankle', 'knee', 'shoulder', 'back', 'hip', 'wrist', 'finger', 'hamstring', 'calf', 'other'
);

CREATE TYPE body_side AS ENUM ('left', 'right', 'bilateral');

CREATE TYPE injury_mechanism AS ENUM (
  'overuse', 'acute_contact', 'acute_non_contact', 'unknown'
);

CREATE TYPE injury_severity AS ENUM ('minor', 'moderate', 'severe');

CREATE TYPE rtp_stage AS ENUM (
  'acute', 'subacute', 'functional_rehab', 'sport_specific', 'full_clearance'
);

CREATE TABLE injuries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id          UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reported_by         UUID NOT NULL REFERENCES users(id),
  injury_date         DATE NOT NULL,
  body_part           body_part NOT NULL,
  body_side           body_side NOT NULL,
  mechanism           injury_mechanism NOT NULL DEFAULT 'unknown',
  severity            injury_severity NOT NULL,
  diagnosis           VARCHAR(255),
  return_to_play_date DATE,
  actual_return_date  DATE,
  clearance_by        UUID REFERENCES users(id),
  current_stage       rtp_stage NOT NULL DEFAULT 'acute',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_injuries_athlete ON injuries(athlete_id, injury_date DESC);
CREATE INDEX idx_injuries_active ON injuries(organization_id, actual_return_date)
  WHERE actual_return_date IS NULL;

CREATE TRIGGER injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ─── Matches ─────────────────────────────────────────────────────────────────

CREATE TYPE competition_level AS ENUM (
  'practice', 'scrimmage', 'league', 'cup', 'national', 'international'
);

CREATE TYPE match_result AS ENUM ('win', 'loss', 'draw');

CREATE TYPE home_away AS ENUM ('home', 'away', 'neutral');

CREATE TABLE matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  match_date        DATE NOT NULL,
  opponent          VARCHAR(255) NOT NULL,
  competition_name  VARCHAR(255) NOT NULL,
  competition_level competition_level NOT NULL,
  venue             VARCHAR(255),
  home_away         home_away NOT NULL DEFAULT 'home',
  sets_won          SMALLINT NOT NULL DEFAULT 0 CHECK (sets_won BETWEEN 0 AND 5),
  sets_lost         SMALLINT NOT NULL DEFAULT 0 CHECK (sets_lost BETWEEN 0 AND 5),
  result            match_result,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_organization ON matches(organization_id, match_date DESC);

-- ─── Match Events ────────────────────────────────────────────────────────────

CREATE TYPE match_event_type AS ENUM (
  'attack_attempt', 'attack_kill', 'attack_error', 'attack_blocked',
  'serve_attempt', 'serve_ace', 'serve_error', 'serve_in',
  'reception_0', 'reception_1', 'reception_2', 'reception_3',
  'dig_success', 'dig_error',
  'block_touch', 'block_kill', 'block_error',
  'set_assist'
);

CREATE TABLE match_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  athlete_id        UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  event_type        match_event_type NOT NULL,
  set_number        SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 5),
  rotation_position SMALLINT NOT NULL CHECK (rotation_position BETWEEN 1 AND 6),
  court_zone        SMALLINT NOT NULL CHECK (court_zone BETWEEN 1 AND 9),
  timestamp_in_set  SMALLINT,  -- seconds from set start
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_match_events_athlete ON match_events(athlete_id);
CREATE INDEX idx_match_events_type ON match_events(match_id, event_type);

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Recovery Logs ───────────────────────────────────────────────────────────

CREATE TABLE recovery_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  log_date         DATE NOT NULL,
  sleep_hours      NUMERIC(4,1) CHECK (sleep_hours BETWEEN 0 AND 24),
  sleep_quality    SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  hrv_ms           NUMERIC(6,2),
  resting_hr       SMALLINT CHECK (resting_hr BETWEEN 20 AND 220),
  soreness_overall SMALLINT CHECK (soreness_overall BETWEEN 1 AND 10),
  soreness_zones   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {ankle_left: 3, knee_right: 7, ...}
  modalities       JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{type: 'ice_bath', duration_min: 15, notes: '...'}]
  body_weight_kg   NUMERIC(5,1),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, log_date)
);

CREATE INDEX idx_recovery_logs_athlete ON recovery_logs(athlete_id, log_date DESC);

-- ─── Nutrition Logs ──────────────────────────────────────────────────────────

CREATE TABLE nutrition_logs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id             UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  log_date               DATE NOT NULL,
  meal_entries           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{meal_name, calories, protein_g, carbs_g, fat_g, time}]
  total_calories         NUMERIC(7,1),
  total_protein_g        NUMERIC(6,1),
  total_carbs_g          NUMERIC(6,1),
  total_fat_g            NUMERIC(6,1),
  water_ml               INTEGER,
  supplement_entries     JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{name, dose_mg, time}]
  daily_target_calories  NUMERIC(7,1),
  daily_target_protein_g NUMERIC(6,1),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, log_date)
);

CREATE INDEX idx_nutrition_logs_athlete ON nutrition_logs(athlete_id, log_date DESC);
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
-- ─── Row-Level Security Policies ─────────────────────────────────────────────
-- All tables are isolated by organization_id.
-- Users can only see data belonging to their own organization.
-- Coaches and admins can modify any athlete's data within their org.
-- Athletes can only modify their own records.

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is current user a staff member (not just an athlete)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT role IN ('coach', 'physiotherapist', 'nutritionist', 'admin')
  FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_session_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_program_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_drill_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodization_plans ENABLE ROW LEVEL SECURITY;

-- ─── Organizations ────────────────────────────────────────────────────────────

CREATE POLICY "Users see own org" ON organizations
  FOR SELECT USING (id = current_org_id());

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE POLICY "Users see org members" ON users
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- ─── Athlete Profiles ────────────────────────────────────────────────────────

CREATE POLICY "Org members see athlete profiles" ON athlete_profiles
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Athletes update own profile" ON athlete_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Staff update any profile" ON athlete_profiles
  FOR UPDATE USING (organization_id = current_org_id() AND is_staff());

CREATE POLICY "Staff insert athlete profiles" ON athlete_profiles
  FOR INSERT WITH CHECK (organization_id = current_org_id() AND is_staff());

-- ─── Performance Tests ───────────────────────────────────────────────────────

CREATE POLICY "Org sees tests" ON performance_tests
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Staff insert/update tests" ON performance_tests
  FOR ALL USING (organization_id = current_org_id() AND is_staff());

-- ─── Drills ──────────────────────────────────────────────────────────────────

CREATE POLICY "See public drills or own org drills" ON drills
  FOR SELECT USING (is_public = true OR organization_id = current_org_id());

CREATE POLICY "Staff manage org drills" ON drills
  FOR ALL USING (organization_id = current_org_id() AND is_staff());

-- ─── Training Programs ───────────────────────────────────────────────────────

CREATE POLICY "Org sees programs" ON training_programs
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Staff manage programs" ON training_programs
  FOR ALL USING (organization_id = current_org_id() AND is_staff());

-- ─── Program Weeks / Sessions / Drills (inherit via join) ─────────────────────

CREATE POLICY "Org sees program weeks" ON program_weeks
  FOR SELECT USING (
    program_id IN (SELECT id FROM training_programs WHERE organization_id = current_org_id())
  );

CREATE POLICY "Org sees program sessions" ON program_sessions
  FOR SELECT USING (
    program_week_id IN (
      SELECT pw.id FROM program_weeks pw
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
  );

CREATE POLICY "Org sees program session drills" ON program_session_drills
  FOR SELECT USING (
    program_session_id IN (
      SELECT ps.id FROM program_sessions ps
      JOIN program_weeks pw ON pw.id = ps.program_week_id
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
  );

-- ─── Training Sessions ───────────────────────────────────────────────────────

CREATE POLICY "Org sees training sessions" ON training_sessions
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Athletes manage own sessions" ON training_sessions
  FOR ALL USING (
    organization_id = current_org_id() AND
    (athlete_id IN (SELECT id FROM athlete_profiles WHERE user_id = auth.uid()) OR is_staff())
  );

-- ─── Drill Logs ──────────────────────────────────────────────────────────────

CREATE POLICY "Org sees drill logs" ON session_drill_logs
  FOR SELECT USING (
    training_session_id IN (
      SELECT id FROM training_sessions WHERE organization_id = current_org_id()
    )
  );

-- ─── Injuries ────────────────────────────────────────────────────────────────

CREATE POLICY "Org sees injuries" ON injuries
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Staff manage injuries" ON injuries
  FOR ALL USING (organization_id = current_org_id() AND is_staff());

-- ─── Matches ─────────────────────────────────────────────────────────────────

CREATE POLICY "Org sees matches" ON matches
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Staff manage matches" ON matches
  FOR ALL USING (organization_id = current_org_id() AND is_staff());

CREATE POLICY "Org sees match events" ON match_events
  FOR SELECT USING (
    match_id IN (SELECT id FROM matches WHERE organization_id = current_org_id())
  );

-- ─── Recovery / Nutrition ────────────────────────────────────────────────────

CREATE POLICY "Org sees recovery logs" ON recovery_logs
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE organization_id = current_org_id())
  );

CREATE POLICY "Athletes manage own recovery" ON recovery_logs
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE user_id = auth.uid()) OR is_staff()
  );

CREATE POLICY "Org sees nutrition logs" ON nutrition_logs
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE organization_id = current_org_id())
  );

CREATE POLICY "Athletes manage own nutrition" ON nutrition_logs
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE user_id = auth.uid()) OR is_staff()
  );

-- ─── Periodization ───────────────────────────────────────────────────────────

CREATE POLICY "Org sees periodization plans" ON periodization_plans
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Staff manage periodization" ON periodization_plans
  FOR ALL USING (organization_id = current_org_id() AND is_staff());
-- ─── Bootstrap Coach Organization ────────────────────────────────────────────
-- Called on first sign-in to create the coach's org and user profile atomically.

CREATE OR REPLACE FUNCTION public.bootstrap_coach_organization(
  p_first_name TEXT,
  p_last_name  TEXT,
  p_org_name   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID;
  v_org_id        UUID;
  v_user_email    TEXT;
BEGIN
  -- Get the calling user's id and email from auth.users
  v_user_id    := auth.uid();
  v_user_email := (SELECT email FROM auth.users WHERE id = v_user_id);

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotent: if user already has a profile, return existing org
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    SELECT organization_id INTO v_org_id FROM public.users WHERE id = v_user_id;
    RETURN jsonb_build_object('organization_id', v_org_id, 'created', false);
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO v_org_id;

  -- Create user profile linked to auth.users
  INSERT INTO public.users (id, organization_id, role, first_name, last_name, email)
  VALUES (v_user_id, v_org_id, 'coach', p_first_name, p_last_name, v_user_email);

  RETURN jsonb_build_object('organization_id', v_org_id, 'created', true);
END;
$$;

-- Only the authenticated user themselves can call this
REVOKE ALL ON FUNCTION public.bootstrap_coach_organization(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_coach_organization(TEXT, TEXT, TEXT) TO authenticated;
