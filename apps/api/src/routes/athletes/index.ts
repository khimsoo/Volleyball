import type { FastifyInstance } from 'fastify';
import { listAthletes, getAthlete, updateAthleteProfile } from './handlers.js';

export default async function athleteRoutes(fastify: FastifyInstance) {
  fastify.get('/athletes', listAthletes);
  fastify.get('/athletes/:id', getAthlete);
  fastify.patch('/athletes/:id', updateAthleteProfile);
}
