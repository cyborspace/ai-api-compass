import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { compareHistoryService } from '../services/compare-history.service.js';

interface CompareHistoryQuery {
  limit?: string;
}

export async function compareHistoryRoutes(fastify: FastifyInstance) {
  // 创建比较历史
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { modelIds, compareType } = request.body as any;

      if (!modelIds || !Array.isArray(modelIds) || modelIds.length < 2) {
        return reply.code(400).send({ error: 'modelIds must be an array with at least 2 items' });
      }

      const history = await compareHistoryService.create(userId, modelIds, compareType || 'products');
      return reply.send({ data: history });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // 获取用户的比较历史
  fastify.get('/', {
    preHandler: (fastify as any).authenticate ? [(fastify as any).authenticate] : [],
  }, async (request: FastifyRequest<{ Querystring: CompareHistoryQuery }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;
      const histories = await compareHistoryService.findByUser(userId, limit);

      return reply.send({ data: histories });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // 删除单条比较历史
  fastify.delete('/:id', {
    preHandler: (fastify as any).authenticate ? [(fastify as any).authenticate] : [],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      await compareHistoryService.delete(request.params.id, userId);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // 清空用户所有比较历史
  fastify.delete('/', {
    preHandler: (fastify as any).authenticate ? [(fastify as any).authenticate] : [],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      await compareHistoryService.clearAll(userId);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}