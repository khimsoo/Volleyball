import type { FastifyRequest, FastifyReply } from 'fastify';

export async function createAthlete(
  request: FastifyRequest<{
    Body: {
      firstName: string;
      lastName: string;
      email: string;
      primaryPosition: string;
      jerseyNumber?: number;
      heightCm?: number;
      weightKg?: number;
      experienceTier?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const { organizationId, userId, userRole } = request;
  const b = request.body;

  // Only coaches and admins can create athletes
  if (!['coach', 'admin'].includes(userRole)) {
    return reply.status(403).send({ error: 'Only coaches can add athletes' });
  }

  // Create user for athlete
  const userResult = await request.server.db.query(
    `INSERT INTO users (organization_id, role, first_name, last_name, email)
     VALUES ($1, 'athlete', $2, $3, $4)
     RETURNING id`,
    [organizationId, b.firstName, b.lastName, b.email],
  );

  if (userResult.rows.length === 0) {
    return reply.status(400).send({ error: 'Failed to create user' });
  }

  const athleteUserId = userResult.rows[0].id;

  // Create athlete profile
  const athleteResult = await request.server.db.query(
    `INSERT INTO athlete_profiles (
       user_id, organization_id, primary_position, jersey_number,
       height_cm, weight_kg, experience_tier, onboarding_completed_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     RETURNING *`,
    [
      athleteUserId,
      organizationId,
      b.primaryPosition,
      b.jerseyNumber ?? null,
      b.heightCm ?? null,
      b.weightKg ?? null,
      b.experienceTier ?? 'developmental',
    ],
  );

  if (athleteResult.rows.length === 0) {
    return reply.status(400).send({ error: 'Failed to create athlete profile' });
  }

  return reply.status(201).send({ 
    athlete: {
      ...athleteResult.rows[0],
      email: b.email,
      firstName: b.firstName,
      lastName: b.lastName,
    }
  });
}
