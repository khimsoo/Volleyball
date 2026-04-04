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
