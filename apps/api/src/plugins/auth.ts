import fp from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

// Extend FastifyRequest to include authenticated user context
declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    organizationId: string;
    userRole: string;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // Decorate all requests with auth context
  fastify.decorateRequest('userId', '');
  fastify.decorateRequest('organizationId', '');
  fastify.decorateRequest('userRole', '');

  // preHandler hook: verify JWT and inject user context
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health check and docs
    if (
      request.routeOptions?.url === '/health' ||
      request.routeOptions?.url?.startsWith('/documentation')
    ) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }

    // Fetch user record to get organizationId and role
    const result = await fastify.db.query<{
      organization_id: string;
      role: string;
    }>(
      'SELECT organization_id, role FROM users WHERE id = $1',
      [user.id],
    );

    if (result.rows.length === 0) {
      return reply.status(401).send({ error: 'User profile not found' });
    }

    request.userId = user.id;
    request.organizationId = result.rows[0].organization_id;
    request.userRole = result.rows[0].role;
  });
});
