-- Migration 014: RLS policies for program assignments, training sessions, and drill logs.
-- Migration 009 enabled RLS on these tables but left some policies incomplete:
--   athlete_program_assignments — no policies at all
--   session_drill_logs         — SELECT only, no INSERT/UPDATE/DELETE
--   training_sessions          — SELECT + "Athletes manage own sessions" FOR ALL (no WITH CHECK)

-- ─── Athlete Program Assignments ──────────────────────────────────────────────

CREATE POLICY "Org sees program assignments" ON athlete_program_assignments
  FOR SELECT USING (
    athlete_id IN (
      SELECT id FROM athlete_profiles WHERE organization_id = current_org_id()
    )
  );

CREATE POLICY "Staff manage program assignments" ON athlete_program_assignments
  FOR ALL
  USING (
    athlete_id IN (
      SELECT id FROM athlete_profiles WHERE organization_id = current_org_id()
    )
    AND is_staff()
  )
  WITH CHECK (
    athlete_id IN (
      SELECT id FROM athlete_profiles WHERE organization_id = current_org_id()
    )
    AND is_staff()
  );

-- ─── Session Drill Logs ───────────────────────────────────────────────────────
-- Existing "Org sees drill logs" covers SELECT.
-- Add staff INSERT / UPDATE / DELETE.

CREATE POLICY "Staff manage drill logs" ON session_drill_logs
  FOR ALL
  USING (
    training_session_id IN (
      SELECT id FROM training_sessions WHERE organization_id = current_org_id()
    )
    AND is_staff()
  )
  WITH CHECK (
    training_session_id IN (
      SELECT id FROM training_sessions WHERE organization_id = current_org_id()
    )
    AND is_staff()
  );

-- ─── Training Sessions ────────────────────────────────────────────────────────
-- "Athletes manage own sessions" FOR ALL exists but lacks WITH CHECK.
-- Add an explicit staff policy with WITH CHECK so coaches can log sessions
-- for any athlete in their organisation.

CREATE POLICY "Staff manage training sessions" ON training_sessions
  FOR ALL
  USING (organization_id = current_org_id() AND is_staff())
  WITH CHECK (organization_id = current_org_id() AND is_staff());
