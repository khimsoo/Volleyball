import type { FastifyInstance } from 'fastify';
import { computeAthleteMatchStats, buildCourtZoneData } from '@volleyball/utils';
import type { MatchEvent } from '@volleyball/types';

export default async function matchRoutes(fastify: FastifyInstance) {
  // List matches
  fastify.get<{ Querystring: { limit?: string } }>('/matches', async (req, reply) => {
    const limit = parseInt(req.query.limit ?? '20');
    const result = await fastify.db.query(
      `SELECT * FROM matches WHERE organization_id = $1 ORDER BY match_date DESC LIMIT $2`,
      [req.organizationId, limit],
    );
    return reply.send({ matches: result.rows });
  });

  // Get match with stats
  fastify.get<{ Params: { id: string } }>('/matches/:id', async (req, reply) => {
    const [matchResult, eventsResult] = await Promise.all([
      fastify.db.query('SELECT * FROM matches WHERE id = $1 AND organization_id = $2', [
        req.params.id,
        req.organizationId,
      ]),
      fastify.db.query(
        `SELECT me.*, ap.id AS athlete_id,
                u.first_name || ' ' || u.last_name AS athlete_name,
                ap.primary_position
         FROM match_events me
         JOIN athlete_profiles ap ON ap.id = me.athlete_id
         JOIN users u ON u.id = ap.user_id
         WHERE me.match_id = $1`,
        [req.params.id],
      ),
    ]);

    if (matchResult.rows.length === 0) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    const events = eventsResult.rows as MatchEvent[];

    // Compute stats per athlete
    const athleteIds = [...new Set(events.map((e) => e.athleteId))];
    const perAthleteStats = athleteIds.map((athleteId) =>
      computeAthleteMatchStats(athleteId, req.params.id, events),
    );

    const courtZoneData = buildCourtZoneData(events);

    return reply.send({
      match: matchResult.rows[0],
      stats: perAthleteStats,
      courtZones: courtZoneData,
      events,
    });
  });

  // Create match
  fastify.post<{
    Body: {
      matchDate: string;
      opponent: string;
      competitionName: string;
      competitionLevel: string;
      homeAway: string;
      setsWon?: number;
      setsLost?: number;
      result?: string;
      venue?: string;
    };
  }>('/matches', async (req, reply) => {
    if (!['coach', 'admin'].includes(req.userRole)) {
      return reply.status(403).send({ error: 'Staff only' });
    }

    const b = req.body;
    const result = await fastify.db.query(
      `INSERT INTO matches (organization_id, match_date, opponent, competition_name,
         competition_level, home_away, sets_won, sets_lost, result, venue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.organizationId,
        b.matchDate,
        b.opponent,
        b.competitionName,
        b.competitionLevel,
        b.homeAway,
        b.setsWon ?? 0,
        b.setsLost ?? 0,
        b.result ?? null,
        b.venue ?? null,
      ],
    );

    return reply.status(201).send({ match: result.rows[0] });
  });

  // Log match event
  fastify.post<{
    Params: { id: string };
    Body: {
      athleteId: string;
      eventType: string;
      setNumber: number;
      rotationPosition: number;
      courtZone: number;
      timestampInSet?: number;
    };
  }>('/matches/:id/events', async (req, reply) => {
    const b = req.body;
    const result = await fastify.db.query(
      `INSERT INTO match_events (match_id, athlete_id, event_type, set_number,
         rotation_position, court_zone, timestamp_in_set)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.params.id,
        b.athleteId,
        b.eventType,
        b.setNumber,
        b.rotationPosition,
        b.courtZone,
        b.timestampInSet ?? null,
      ],
    );

    return reply.status(201).send({ event: result.rows[0] });
  });
}
