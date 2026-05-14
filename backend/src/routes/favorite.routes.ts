// ============================================================
// Favorite Routes - 收藏路由
// ============================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { favoriteService } from '../services/favorite.service.js';
import { favoriteItemRepository } from '../repositories/favorite-item.repository.js';

export async function favoriteRoutes(fastify: FastifyInstance) {
  // ========== 收藏分类 ==========

  // 获取用户的收藏分类
  fastify.get('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const categories = await favoriteService.getCategories(userId);
    return { code: 0, data: categories };
  });

  // 获取单个分类
  fastify.get<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    const { id } = request.params;
    const category = await favoriteService.getCategoryById(id);

    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    return { code: 0, data: category };
  });

  // 创建分类
  fastify.post('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { name, icon, color } = body;
    const category = await favoriteService.createCategory(userId, { name, icon, color });
    return { code: 0, data: category };
  });

  // 更新分类
  fastify.put<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as any;
    const category = await favoriteService.updateCategory(id, body);
    return { code: 0, data: category };
  });

  // 删除分类
  fastify.delete<{ Params: { id: string } }>('/categories/:id', async (request, reply) => {
    const { id } = request.params;
    await favoriteService.deleteCategory(id);
    return { code: 0, message: 'Category deleted' };
  });

  // 排序分类
  fastify.put('/categories/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { ids } = body;
    await favoriteService.reorderCategories(userId, ids);
    return { code: 0, message: 'Categories reordered' };
  });

  // 初始化默认分类
  fastify.post('/categories/init', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const categories = await favoriteService.initDefaultCategories(userId);
    return { code: 0, data: categories };
  });

  // ========== 收藏项 ==========

  // 获取用户的所有收藏项
  fastify.get('/items', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const query = request.query as any;
    const categoryId = query.categoryId;
    const items = await favoriteService.getItems(userId, categoryId);
    return { code: 0, data: items };
  });

  // 获取单个收藏项
  fastify.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const { id } = request.params;
    const item = await favoriteItemRepository.findById(id);

    if (!item) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    return { code: 0, data: item };
  });

  // 添加产品到收藏
  fastify.post('/items/product', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { productId, categoryId } = body;
    const item = await favoriteService.addProductToFavorites(userId, productId, categoryId);
    return { code: 0, data: item };
  });

  // 添加自定义链接
  fastify.post('/items/custom', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { categoryId, customTitle, customUrl, customDescription, customIcon, note } = body;
    const item = await favoriteService.addCustomLink(userId, categoryId, { customTitle, customUrl, customDescription, customIcon, note });
    return { code: 0, data: item };
  });

  // 更新收藏项
  fastify.put<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as any;
    const item = await favoriteService.updateItem(id, body);
    return { code: 0, data: item };
  });

  // 删除收藏项
  fastify.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const { id } = request.params;
    await favoriteService.removeItem(id);
    return { code: 0, message: 'Item removed' };
  });

  // 切换收藏状态（添加/移除）
  fastify.post('/items/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as any;
    const { productId, categoryId } = body;
    const result = await favoriteService.toggleFavorite(userId, productId, categoryId);
    return { code: 0, data: result };
  });

  // 移动收藏项到其他分类
  fastify.put<{ Params: { id: string } }>('/items/:id/move', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as any;
    const { newCategoryId } = body;
    const item = await favoriteService.moveItem(id, newCategoryId);
    return { code: 0, data: item };
  });

  // 排序分类内的收藏项
  fastify.put('/items/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { categoryId, ids } = body;
    await favoriteService.reorderItems(categoryId, ids);
    return { code: 0, message: 'Items reordered' };
  });

  // 获取收藏总数
  fastify.get('/count', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const count = await favoriteService.getTotalCount(userId);
    return { code: 0, data: { count } };
  });
}
