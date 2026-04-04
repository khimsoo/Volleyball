import type { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../../services/analytics.service.js';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  const svc = new AnalyticsService(fastify.db);

  // Team overview for today (or given date)
  fastify.get<{ Querystring: { date?: string } }>('/analytics/team', async (req, reply) => {
    const date = req.query.date ?? new Date().toISOString().split('T')[0];
    const overview = await svc.getTeamReadinessOverview(req.organizationId, date);
    return reply.send(overview);
  });

  // Per-athlete ACWR
  fastify.get<{ Params: { athleteId: string } }>(
    '/analytics/acwr/:athleteId',
    async (req, reply) => {
      const acwr = await svc.getAthleteACWR(req.params.athleteId);
      return reply.send(acwr);
    },
  );

  // Per-athlete readiness score
  fastify.get<{ Params: { athleteId: string }; Querystring: { date?: string } }>(
    '/analytics/readiness/:athleteId',
    async (req, reply) => {
      const date = req.query.date ?? new Date().toISOString().split('T')[0];
      const score = await svc.getAthleteReadinessScore(req.params.athleteId, date);
      return reply.send(score);
    },
  );

  // Performance drop alerts
  fastify.get<{ Params: { athleteId: string } }>(
    '/analytics/alerts/:athleteId',
    async (req, reply) => {
      const alerts = await svc.getPerformanceAlerts(req.params.athleteId);
      return reply.send({ alerts });
    },
  );
}
