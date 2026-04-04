import type { FastifyInstance } from 'fastify';
import { startSession, logDrill, completeSession, getSessionHistory } from './handlers.js';

export default async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get('/sessions', getSessionHistory);
  fastify.post('/sessions', startSession);
  fastify.post('/sessions/:sessionId/drills', logDrill);
  fastify.patch('/sessions/:sessionId/complete', completeSession);
}
