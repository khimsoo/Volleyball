-- Fix RLS INSERT policies for program sub-tables.
-- The original "FOR ALL USING (...)" policies don't include an explicit
-- WITH CHECK clause for INSERT. PostgreSQL treats USING as WITH CHECK
-- for INSERT but in some Supabase/PostgREST versions this isn't evaluated
-- correctly for nested sub-table rows. Adding explicit WITH CHECK fixes it.

-- ─── program_weeks ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Staff manage program weeks" ON program_weeks;

CREATE POLICY "Staff manage program weeks" ON program_weeks
  FOR ALL
  USING (
    program_id IN (
      SELECT id FROM training_programs WHERE organization_id = current_org_id()
    )
    AND is_staff()
  )
  WITH CHECK (
    program_id IN (
      SELECT id FROM training_programs WHERE organization_id = current_org_id()
    )
    AND is_staff()
  );

-- ─── program_sessions ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Staff manage program sessions" ON program_sessions;

CREATE POLICY "Staff manage program sessions" ON program_sessions
  FOR ALL
  USING (
    program_week_id IN (
      SELECT pw.id FROM program_weeks pw
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
    AND is_staff()
  )
  WITH CHECK (
    program_week_id IN (
      SELECT pw.id FROM program_weeks pw
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
    AND is_staff()
  );

-- ─── program_session_drills ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Staff manage program session drills" ON program_session_drills;

CREATE POLICY "Staff manage program session drills" ON program_session_drills
  FOR ALL
  USING (
    program_session_id IN (
      SELECT ps.id FROM program_sessions ps
      JOIN program_weeks pw ON pw.id = ps.program_week_id
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
    AND is_staff()
  )
  WITH CHECK (
    program_session_id IN (
      SELECT ps.id FROM program_sessions ps
      JOIN program_weeks pw ON pw.id = ps.program_week_id
      JOIN training_programs tp ON tp.id = pw.program_id
      WHERE tp.organization_id = current_org_id()
    )
    AND is_staff()
  );
