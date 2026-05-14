// ============================================================
// Product Routes - 产品路由
// ============================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { productService } from '../services/product.service.js';

interface ProductParams {
  id: string;
}

interface SlugParams {
  slug: string;
}

interface CategoryParams {
  categoryId: string;
}

interface IdsBody {
  ids: string[];
}

export async function productRoutes(fastify: FastifyInstance) {
  // 获取产品列表
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const { category, query: searchQuery, page, pageSize, sortBy, order } = query;

    const result = await productService.getProducts({
      category,
      query: searchQuery,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      sortBy,
      order,
    });

    return { code: 0, data: result };
  });

  // 获取精选产品
  fastify.get('/featured', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const products = await productService.getFeaturedProducts(limit);
    return { code: 0, data: products };
  });

  // 根据 slug 获取产品
  fastify.get<{ Params: SlugParams }>('/by-slug/:slug', async (request, reply) => {
    const { slug } = request.params;
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    return { code: 0, data: product };
  });

  // 获取单个产品
  fastify.get<{ Params: ProductParams }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const product = await productService.getProductById(id);

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    return { code: 0, data: product };
  });

  // 获取产品的属性
  fastify.get<{ Params: ProductParams }>('/:id/attributes', async (request, reply) => {
    const { id } = request.params;
    const attributes = await productService.getProductAttributes(id);
    return { code: 0, data: attributes };
  });

  // 根据 ID 列表获取产品
  fastify.post('/by-ids', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as IdsBody;
    const { ids } = body;
    const products = await productService.getProductsByIds(ids);
    return { code: 0, data: products };
  });

  // ========== 分类 ==========

  // 获取所有分类
  fastify.get('/categories/all', async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await productService.getCategories();
    return { code: 0, data: categories };
  });

  // 根据 apiName 获取分类
  fastify.get<{ Params: { apiName: string } }>('/categories/by-api-name/:apiName', async (request, reply) => {
    const { apiName } = request.params;
    const category = await productService.getCategoryByApiName(apiName);

    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }
    return { code: 0, data: category };
  });

  // 获取分类下的产品
  fastify.get<{ Params: CategoryParams }>('/categories/:categoryId/products', async (request, reply) => {
    const { categoryId } = request.params;
    const query = request.query as any;
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize) : 20;

    const result = await productService.getProductsByCategory(categoryId, page, pageSize);
    return { code: 0, data: result };
  });
}
