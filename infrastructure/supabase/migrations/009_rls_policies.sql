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

-- Allow bootstrap function to insert organizations
CREATE POLICY "Bootstrap can insert org" ON organizations
  FOR INSERT WITH CHECK (true);

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE POLICY "Users see org members" ON users
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Allow bootstrap function to insert users (happens during signup before user exists)
CREATE POLICY "Bootstrap can insert user" ON users
  FOR INSERT WITH CHECK (true);

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
