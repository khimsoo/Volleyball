import type { FastifyInstance } from 'fastify';

export default async function recoveryRoutes(fastify: FastifyInstance) {
  // Log today's recovery data
  fastify.post<{
    Body: {
      athleteId: string;
      logDate: string;
      sleepHours?: number;
      sleepQuality?: number;
      hrvMs?: number;
      restingHr?: number;
      sorenessOverall?: number;
      sorenessZones?: Record<string, number>;
      modalities?: Array<{ type: string; durationMin: number; notes?: string }>;
      bodyWeightKg?: number;
    };
  }>('/recovery', async (req, reply) => {
    const b = req.body;

    const result = await fastify.db.query(
      `INSERT INTO recovery_logs (
         athlete_id, log_date, sleep_hours, sleep_quality, hrv_ms, resting_hr,
         soreness_overall, soreness_zones, modalities, body_weight_kg
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (athlete_id, log_date) DO UPDATE SET
         sleep_hours = EXCLUDED.sleep_hours,
         sleep_quality = EXCLUDED.sleep_quality,
         hrv_ms = EXCLUDED.hrv_ms,
         resting_hr = EXCLUDED.resting_hr,
         soreness_overall = EXCLUDED.soreness_overall,
         soreness_zones = EXCLUDED.soreness_zones,
         modalities = EXCLUDED.modalities,
         body_weight_kg = EXCLUDED.body_weight_kg
       RETURNING *`,
      [
        b.athleteId,
        b.logDate,
        b.sleepHours ?? null,
        b.sleepQuality ?? null,
        b.hrvMs ?? null,
        b.restingHr ?? null,
        b.sorenessOverall ?? null,
        JSON.stringify(b.sorenessZones ?? {}),
        JSON.stringify(b.modalities ?? []),
        b.bodyWeightKg ?? null,
      ],
    );

    return reply.status(201).send({ recoveryLog: result.rows[0] });
  });

  // Get recovery history
  fastify.get<{
    Params: { athleteId: string };
    Querystring: { days?: string };
  }>('/recovery/:athleteId', async (req, reply) => {
    const days = parseInt(req.query.days ?? '30');
    const result = await fastify.db.query(
      `SELECT * FROM recovery_logs
       WHERE athlete_id = $1
         AND log_date >= NOW() - INTERVAL '${days} days'
       ORDER BY log_date DESC`,
      [req.params.athleteId],
    );
    return reply.send({ recoveryLogs: result.rows });
  });
}
