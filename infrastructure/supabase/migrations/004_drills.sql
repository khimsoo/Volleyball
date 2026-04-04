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
