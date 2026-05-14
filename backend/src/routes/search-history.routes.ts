// ============================================================
// Search History Routes - 搜索历史路由
// ============================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchHistoryService } from '../services/search-history.service.js';

export async function searchHistoryRoutes(fastify: FastifyInstance) {
  // 获取搜索历史
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const query = request.query as any;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const history = await searchHistoryService.getByUser(userId, limit);
    return { code: 0, data: history };
  });

  // 创建搜索历史记录
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { query, resultsCount } = body;

    if (!query) {
      return reply.status(400).send({ error: 'Query is required' });
    }

    const history = await searchHistoryService.create(userId, query, resultsCount);
    return { code: 0, data: history };
  });

  // 删除单条搜索历史
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params;
    await searchHistoryService.delete(id, userId);
    return { code: 0, message: 'Search history deleted' };
  });

  // 清除所有搜索历史
  fastify.delete('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    await searchHistoryService.clearAll(userId);
    return { code: 0, message: 'All search history cleared' };
  });

  // 获取搜索历史总数
  fastify.get('/count', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const count = await searchHistoryService.getTotalCount(userId);
    return { code: 0, data: { count } };
  });
}
