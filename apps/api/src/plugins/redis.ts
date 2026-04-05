import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: InstanceType<typeof Redis> | null;
  }
}

export default fp(async function redisPlugin(fastify: FastifyInstance) {
  const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    fastify.log.warn({ err }, 'Redis unavailable — caching disabled');
  });

  try {
    await redis.connect();
    await redis.ping();
    fastify.log.info('✅ Redis connected');
  } catch {
    fastify.log.warn('⚠️  Redis not available — continuing without cache');
    await redis.disconnect();
    fastify.decorate('redis', null);
    return;
  }

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});
