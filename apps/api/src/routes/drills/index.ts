import type { FastifyInstance } from 'fastify';

export default async function drillRoutes(fastify: FastifyInstance) {
  // List drills (public + org drills)
  fastify.get<{
    Querystring: {
      skillType?: string;
      position?: string;
      difficulty?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>('/drills', async (req, reply) => {
    const { skillType, position, difficulty, search, limit = '50', offset = '0' } = req.query;

    const conditions: string[] = [
      `(d.is_public = true OR d.organization_id = $1)`,
      `d.deleted_at IS NULL`,
    ];
    const values: unknown[] = [req.organizationId];
    let idx = 2;

    if (skillType) {
      conditions.push(`d.skill_type = $${idx++}`);
      values.push(skillType);
    }
    if (position) {
      conditions.push(`$${idx++}::volleyball_position = ANY(d.positions_relevant)`);
      values.push(position);
    }
    if (difficulty) {
      conditions.push(`d.difficulty = $${idx++}`);
      values.push(difficulty);
    }
    if (search) {
      conditions.push(
        `to_tsvector('english', d.name || ' ' || d.description) @@ plainto_tsquery('english', $${idx++})`,
      );
      values.push(search);
    }

    values.push(parseInt(limit), parseInt(offset));

    const result = await fastify.db.query(
      `SELECT d.*, u.first_name || ' ' || u.last_name AS created_by_name
       FROM drills d
       LEFT JOIN users u ON u.id = d.created_by
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.is_public DESC, d.name
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    );

    return reply.send({ drills: result.rows });
  });

  // Get single drill
  fastify.get<{ Params: { id: string } }>('/drills/:id', async (req, reply) => {
    const result = await fastify.db.query(
      `SELECT d.*, u.first_name || ' ' || u.last_name AS created_by_name
       FROM drills d
       LEFT JOIN users u ON u.id = d.created_by
       WHERE d.id = $1
         AND (d.is_public = true OR d.organization_id = $2)
         AND d.deleted_at IS NULL`,
      [req.params.id, req.organizationId],
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Drill not found' });
    }

    return reply.send({ drill: result.rows[0] });
  });

  // Create org drill (staff only)
  fastify.post<{
    Body: {
      name: string;
      description: string;
      instructions: string;
      skillType: string;
      positionsRelevant: string[];
      difficulty: string;
      trainingPhaseTags: string[];
      equipmentRequired: string[];
      isPublic?: boolean;
    };
  }>('/drills', async (req, reply) => {
    if (!['coach', 'admin'].includes(req.userRole)) {
      return reply.status(403).send({ error: 'Staff only' });
    }

    const b = req.body;
    const result = await fastify.db.query(
      `INSERT INTO drills (
         organization_id, created_by, name, description, instructions,
         skill_type, positions_relevant, difficulty, training_phase_tags,
         equipment_required, is_public
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::volleyball_position[],$8,$9::training_phase[],$10,$11)
       RETURNING *`,
      [
        req.organizationId,
        req.userId,
        b.name,
        b.description,
        b.instructions,
        b.skillType,
        b.positionsRelevant,
        b.difficulty,
        b.trainingPhaseTags,
        b.equipmentRequired,
        b.isPublic ?? false,
      ],
    );

    return reply.status(201).send({ drill: result.rows[0] });
  });
}
