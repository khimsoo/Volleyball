-- ─── Multi-school support ──────────────────────────────────────────────────────
-- Coaches can be affiliated with multiple schools/organisations.
-- Primary organisation stays on users.organization_id (for RLS).
-- Additional affiliations go in coach_school_affiliations.

CREATE TYPE affiliation_role AS ENUM ('head_coach', 'assistant_coach', 'volunteer');

CREATE TABLE coach_school_affiliations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            affiliation_role NOT NULL DEFAULT 'assistant_coach',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, organization_id)
);

CREATE INDEX idx_affiliations_coach ON coach_school_affiliations(coach_id) WHERE active;
CREATE INDEX idx_affiliations_org   ON coach_school_affiliations(organization_id) WHERE active;

-- ─── Teams ────────────────────────────────────────────────────────────────────
-- Teams belong to an organisation and are coached by a user.

CREATE TYPE team_level AS ENUM (
  'u12', 'u14', 'u16', 'u18', 'u21', 'open', 'masters'
);

CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  coach_id        UUID REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  level           team_level NOT NULL DEFAULT 'open',
  gender          VARCHAR(10) CHECK (gender IN ('male','female','mixed')),
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_organization ON teams(organization_id) WHERE active;
CREATE INDEX idx_teams_coach        ON teams(coach_id) WHERE active;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Team members ─────────────────────────────────────────────────────────────

CREATE TABLE team_members (
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  joined_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (team_id, athlete_id)
);

-- ─── Team program assignments ──────────────────────────────────────────────────
-- Assign an entire program to a team (all members get it).

CREATE TABLE team_program_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  program_id  UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);

CREATE INDEX idx_team_program_assignments_team    ON team_program_assignments(team_id);
CREATE INDEX idx_team_program_assignments_program ON team_program_assignments(program_id);

-- ─── RLS for new tables ────────────────────────────────────────────────────────

ALTER TABLE coach_school_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_program_assignments  ENABLE ROW LEVEL SECURITY;

-- Coach affiliations: visible to coaches of same org
CREATE POLICY "org_members_see_affiliations" ON coach_school_affiliations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "coach_manage_own_affiliations" ON coach_school_affiliations
  FOR ALL USING (coach_id = auth.uid());

-- Teams: coaches in same org can see/manage
CREATE POLICY "org_members_see_teams" ON teams
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "coaches_manage_teams" ON teams
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
        AND role IN ('coach','admin')
    )
  );

-- Team members / assignments: same org visibility
CREATE POLICY "org_members_see_team_members" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "coaches_manage_team_members" ON team_members
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
        AND role IN ('coach','admin')
    ))
  );

CREATE POLICY "org_members_see_team_programs" ON team_program_assignments
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "coaches_manage_team_programs" ON team_program_assignments
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
        AND role IN ('coach','admin')
    ))
  );
