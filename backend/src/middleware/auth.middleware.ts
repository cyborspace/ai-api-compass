// ============================================================
// Auth Middleware - 认证中间件
// ============================================================

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { authService } from '../services/auth.service.js';

export async function authMiddleware(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized', code: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await authService.verifyToken(token);

    if (!userId) {
      return reply.status(401).send({ error: 'Invalid token', code: 401 });
    }

    (request as any).userId = userId;
  });
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}
