import type { FastifyRequest, FastifyReply } from 'fastify';

interface StartSessionBody {
  scheduledDate: string;
  sessionType: string;
  location?: string;
  programSessionId?: string;
  preSessionSleepHours?: number;
  preSessionSleepQuality?: number;
  preSessionSoreness?: number;
  preSessionHrv?: number;
}

interface LogDrillBody {
  drillId: string;
  sequenceOrder: number;
  setsCompleted?: number;
  repsCompleted?: number;
  durationCompletedSeconds?: number;
  loadKg?: number;
  notes?: string;
}

interface CompleteSessionBody {
  sessionRpe: number;
  athleteNotes?: string;
  coachNotes?: string;
}

export async function startSession(
  request: FastifyRequest<{ Body: StartSessionBody }>,
  reply: FastifyReply,
) {
  const { organizationId } = request;
  const body = request.body;

  // Resolve athleteId from userId
  const athleteResult = await request.server.db.query(
    'SELECT id FROM athlete_profiles WHERE user_id = $1 AND organization_id = $2',
    [request.userId, organizationId],
  );

  if (athleteResult.rows.length === 0) {
    return reply.status(400).send({ error: 'No athlete profile found for this user' });
  }

  const athleteId = athleteResult.rows[0].id as string;

  const result = await request.server.db.query(
    `INSERT INTO training_sessions (
       athlete_id, organization_id, program_session_id, scheduled_date,
       started_at, session_type, location,
       pre_session_sleep_hours, pre_session_sleep_quality, pre_session_soreness,
       pre_session_hrv
     ) VALUES ($1,$2,$3,$4,now(),$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      athleteId,
      organizationId,
      body.programSessionId ?? null,
      body.scheduledDate,
      body.sessionType,
      body.location ?? null,
      body.preSessionSleepHours ?? null,
      body.preSessionSleepQuality ?? null,
      body.preSessionSoreness ?? null,
      body.preSessionHrv ?? null,
    ],
  );

  return reply.status(201).send({ session: result.rows[0] });
}

export async function logDrill(
  request: FastifyRequest<{
    Params: { sessionId: string };
    Body: LogDrillBody;
  }>,
  reply: FastifyReply,
) {
  const { sessionId } = request.params;

  const result = await request.server.db.query(
    `INSERT INTO session_drill_logs (
       training_session_id, drill_id, sequence_order,
       sets_completed, reps_completed, duration_completed_seconds, load_kg, notes,
       completed_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
     RETURNING *`,
    [
      sessionId,
      request.body.drillId,
      request.body.sequenceOrder,
      request.body.setsCompleted ?? null,
      request.body.repsCompleted ?? null,
      request.body.durationCompletedSeconds ?? null,
      request.body.loadKg ?? null,
      request.body.notes ?? null,
    ],
  );

  return reply.status(201).send({ drillLog: result.rows[0] });
}

export async function completeSession(
  request: FastifyRequest<{
    Params: { sessionId: string };
    Body: CompleteSessionBody;
  }>,
  reply: FastifyReply,
) {
  const { sessionId } = request.params;

  // Compute total volume load from drill logs
  const volumeResult = await request.server.db.query<{ total: number }>(
    `SELECT COALESCE(SUM(sets_completed * reps_completed * COALESCE(load_kg, 0)), 0) AS total
     FROM session_drill_logs
     WHERE training_session_id = $1`,
    [sessionId],
  );

  const totalVolumeLoad = volumeResult.rows[0].total;

  const result = await request.server.db.query(
    `UPDATE training_sessions
     SET completed_at = now(),
         session_rpe = $1,
         athlete_notes = $2,
         coach_notes = $3,
         total_volume_load = $4
     WHERE id = $5 AND organization_id = $6
     RETURNING *`,
    [
      request.body.sessionRpe,
      request.body.athleteNotes ?? null,
      request.body.coachNotes ?? null,
      totalVolumeLoad,
      sessionId,
      request.organizationId,
    ],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ error: 'Session not found' });
  }

  return reply.send({ session: result.rows[0] });
}

export async function getSessionHistory(
  request: FastifyRequest<{
    Querystring: { athleteId?: string; limit?: string; offset?: string };
  }>,
  reply: FastifyReply,
) {
  const limit = parseInt(request.query.limit ?? '20');
  const offset = parseInt(request.query.offset ?? '0');
  const athleteId = request.query.athleteId;

  const result = await request.server.db.query(
    `SELECT
       ts.*,
       COUNT(sdl.id) AS drill_count
     FROM training_sessions ts
     LEFT JOIN session_drill_logs sdl ON sdl.training_session_id = ts.id
     WHERE ts.organization_id = $1
       ${athleteId ? 'AND ts.athlete_id = $4' : ''}
     GROUP BY ts.id
     ORDER BY ts.scheduled_date DESC
     LIMIT $2 OFFSET $3`,
    athleteId
      ? [request.organizationId, limit, offset, athleteId]
      : [request.organizationId, limit, offset],
  );

  return reply.send({ sessions: result.rows });
}
