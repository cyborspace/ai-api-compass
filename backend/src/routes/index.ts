// ============================================================
// Routes - 统一导出
// ============================================================

import { FastifyInstance } from 'fastify';
import { productRoutes } from './product.routes.js';
import { favoriteRoutes } from './favorite.routes.js';
import { authRoutes } from './auth.routes.js';
import { searchHistoryRoutes } from './search-history.routes.js';
import { compareHistoryRoutes } from './compare-history.routes.js';

export function registerRoutes(fastify: FastifyInstance) {
  fastify.register(productRoutes, { prefix: '/api/products' });
  fastify.register(favoriteRoutes, { prefix: '/api/favorites' });
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(searchHistoryRoutes, { prefix: '/api/search-history' });
  fastify.register(compareHistoryRoutes, { prefix: '/api/compare-history' });
}

export { productRoutes } from './product.routes.js';
export { favoriteRoutes } from './favorite.routes.js';
export { authRoutes } from './auth.routes.js';
export { searchHistoryRoutes } from './search-history.routes.js';
export { compareHistoryRoutes } from './compare-history.routes.js';
export { eventsRoutes } from './events.routes.js';
