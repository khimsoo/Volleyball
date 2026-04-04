import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { config } from './config.js';
import databasePlugin from './plugins/database.js';
import authPlugin from './plugins/auth.js';
import redisPlugin from './plugins/redis.js';

import athleteRoutes from './routes/athletes/index.js';
import sessionRoutes from './routes/sessions/index.js';
import drillRoutes from './routes/drills/index.js';
import analyticsRoutes from './routes/analytics/index.js';
import matchRoutes from './routes/matches/index.js';
import recoveryRoutes from './routes/recovery/index.js';
import performanceTestRoutes from './routes/tests/index.js';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      config.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await fastify.register(cors, {
  origin: config.NODE_ENV === 'production' ? ['https://app.volleytrainer.com'] : true,
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 200,
  timeWindow: '1 minute',
  redis: undefined, // Set to redis instance in production for distributed rate limiting
});

await fastify.register(databasePlugin);
await fastify.register(redisPlugin);
await fastify.register(authPlugin);

// ─── Health check (no auth required) ─────────────────────────────────────────

fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '0.1.0',
}));

// ─── API routes (all under /api/v1) ──────────────────────────────────────────

await fastify.register(
  async (app) => {
    await app.register(athleteRoutes);
    await app.register(sessionRoutes);
    await app.register(drillRoutes);
    await app.register(analyticsRoutes);
    await app.register(matchRoutes);
    await app.register(recoveryRoutes);
    await app.register(performanceTestRoutes);
  },
  { prefix: '/api/v1' },
);

// ─── Start server ─────────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: config.PORT, host: config.HOST });
  fastify.log.info(`🏐 Volleyball API listening on port ${config.PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export default fastify;
