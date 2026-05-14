/**
 * Data Quality Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDataQualityChecker } from '../services/quality/data-quality-checker.js';

export async function registerQualityRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;
  const checker = getDataQualityChecker(prisma);

  fastify.get('/quality/check', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await checker.checkAllDataQuality();
    return reply.send({
      success: true,
      data: result,
    });
  });

  fastify.get('/quality/tools', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await checker.checkToolDataQuality();
    return reply.send({
      success: true,
      data: result,
    });
  });

  fastify.get('/quality/reviews', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await checker.checkReviewDataQuality();
    return reply.send({
      success: true,
      data: result,
    });
  });
}
