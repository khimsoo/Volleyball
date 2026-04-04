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
