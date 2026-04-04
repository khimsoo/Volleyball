import type { FastifyRequest, FastifyReply } from 'fastify';

export async function listAthletes(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await request.server.db.query(
    `SELECT
       ap.id,
       ap.primary_position,
       ap.secondary_positions,
       ap.jersey_number,
       ap.height_cm,
       ap.weight_kg,
       ap.experience_tier,
       ap.onboarding_completed_at,
       u.first_name,
       u.last_name,
       u.email,
       u.avatar_url
     FROM athlete_profiles ap
     JOIN users u ON u.id = ap.user_id
     WHERE ap.organization_id = $1 AND ap.deleted_at IS NULL
     ORDER BY ap.jersey_number NULLS LAST, u.last_name`,
    [request.organizationId],
  );
  return reply.send({ athletes: result.rows });
}

export async function getAthlete(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await request.server.db.query(
    `SELECT
       ap.*,
       u.first_name,
       u.last_name,
       u.email,
       u.avatar_url,
       u.role
     FROM athlete_profiles ap
     JOIN users u ON u.id = ap.user_id
     WHERE ap.id = $1 AND ap.organization_id = $2 AND ap.deleted_at IS NULL`,
    [request.params.id, request.organizationId],
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ error: 'Athlete not found' });
  }

  return reply.send({ athlete: result.rows[0] });
}

export async function updateAthleteProfile(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      primaryPosition?: string;
      jerseyNumber?: number;
      heightCm?: number;
      weightKg?: number;
      experienceTier?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const updates = request.body;

  // Only allow athletes to update their own profile, staff can update any
  const isOwnProfile = await request.server.db.query(
    'SELECT id FROM athlete_profiles WHERE id = $1 AND user_id = $2',
    [id, request.userId],
  );

  const isStaff = ['coach', 'physiotherapist', 'admin'].includes(request.userRole);

  if (isOwnProfile.rows.length === 0 && !isStaff) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.primaryPosition) {
    setClauses.push(`primary_position = $${idx++}`);
    values.push(updates.primaryPosition);
  }
  if (updates.jerseyNumber !== undefined) {
    setClauses.push(`jersey_number = $${idx++}`);
    values.push(updates.jerseyNumber);
  }
  if (updates.heightCm !== undefined) {
    setClauses.push(`height_cm = $${idx++}`);
    values.push(updates.heightCm);
  }
  if (updates.weightKg !== undefined) {
    setClauses.push(`weight_kg = $${idx++}`);
    values.push(updates.weightKg);
  }
  if (updates.experienceTier) {
    setClauses.push(`experience_tier = $${idx++}`);
    values.push(updates.experienceTier);
  }

  if (setClauses.length === 0) {
    return reply.status(400).send({ error: 'No fields to update' });
  }

  values.push(id, request.organizationId);

  const result = await request.server.db.query(
    `UPDATE athlete_profiles
     SET ${setClauses.join(', ')}, updated_at = now()
     WHERE id = $${idx++} AND organization_id = $${idx}
     RETURNING *`,
    values,
  );

  return reply.send({ athlete: result.rows[0] });
}
