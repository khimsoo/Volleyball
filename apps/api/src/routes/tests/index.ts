import type { FastifyInstance } from 'fastify';

export default async function performanceTestRoutes(fastify: FastifyInstance) {
  // Record a performance test
  fastify.post<{
    Body: {
      athleteId: string;
      testDate: string;
      testType: string;
      value: number;
      unit: string;
      notes?: string;
      deviceSource?: string;
    };
  }>('/tests', async (req, reply) => {
    const b = req.body;
    const result = await fastify.db.query(
      `INSERT INTO performance_tests (
         athlete_id, organization_id, tested_by, test_date,
         test_type, value, unit, notes, device_source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        b.athleteId,
        req.organizationId,
        req.userId,
        b.testDate,
        b.testType,
        b.value,
        b.unit,
        b.notes ?? null,
        b.deviceSource ?? 'manual',
      ],
    );
    return reply.status(201).send({ test: result.rows[0] });
  });

  // Get test history for an athlete (all or by type)
  fastify.get<{
    Params: { athleteId: string };
    Querystring: { testType?: string; limit?: string };
  }>('/tests/:athleteId', async (req, reply) => {
    const limit = parseInt(req.query.limit ?? '50');
    const { testType } = req.query;

    const result = await fastify.db.query(
      `SELECT * FROM performance_tests
       WHERE athlete_id = $1 AND organization_id = $2
         ${testType ? 'AND test_type = $4' : ''}
       ORDER BY test_date DESC
       LIMIT $3`,
      testType
        ? [req.params.athleteId, req.organizationId, limit, testType]
        : [req.params.athleteId, req.organizationId, limit],
    );

    return reply.send({ tests: result.rows });
  });

  // Latest values per test type for an athlete
  fastify.get<{ Params: { athleteId: string } }>(
    '/tests/:athleteId/latest',
    async (req, reply) => {
      const result = await fastify.db.query(
        `SELECT DISTINCT ON (test_type)
           test_type, value, unit, test_date, device_source
         FROM performance_tests
         WHERE athlete_id = $1 AND organization_id = $2
         ORDER BY test_type, test_date DESC`,
        [req.params.athleteId, req.organizationId],
      );
      return reply.send({ latestTests: result.rows });
    },
  );
}
