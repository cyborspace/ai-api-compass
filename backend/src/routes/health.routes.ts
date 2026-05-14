/**
 * Ontology Health Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getOntologyHealthChecker } from '../services/ontology/health-checker.js';

export async function registerOntologyHealthRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;
  const checker = getOntologyHealthChecker(prisma);

  fastify.get('/health/check', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await checker.check();
    return reply.send({
      success: true,
      data: result,
    });
  });
}

export default registerOntologyHealthRoutes;
