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
