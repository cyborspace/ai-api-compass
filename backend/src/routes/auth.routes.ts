// ============================================================
// Auth Routes - 认证路由
// ============================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
  // 发送验证码
  fastify.post('/send-code', async (request: FastifyRequest, reply) => {
    const body = request.body as any;
    const { phone } = body;
    const result = await authService.sendSmsCode(phone);
    return { code: 0, ...result };
  });

  // 手机号注册
  fastify.post('/register/phone', async (request: FastifyRequest, reply) => {
    try {
      const body = request.body as any;
      const result = await authService.registerWithPhone(body);
      return { code: 0, data: result };
    } catch (error: any) {
      return reply.status(400).send({ code: 400, error: error.message });
    }
  });

  // 邮箱注册
  fastify.post('/register/email', async (request: FastifyRequest, reply) => {
    try {
      const body = request.body as any;
      const result = await authService.registerWithEmail(body);
      return { code: 0, data: result };
    } catch (error: any) {
      return reply.status(400).send({ code: 400, error: error.message });
    }
  });

  // 登录
  fastify.post('/login', async (request: FastifyRequest, reply) => {
    try {
      const body = request.body as any;
      const result = await authService.login(body);
      return { code: 0, data: result };
    } catch (error: any) {
      return reply.status(401).send({ code: 401, error: error.message });
    }
  });

  // 获取当前用户信息
  fastify.get('/me', async (request: FastifyRequest, reply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ code: 401, error: 'Unauthorized' });
    }

    const user = await authService.getUserById(userId);
    if (!user) {
      return reply.status(404).send({ code: 404, error: 'User not found' });
    }
    return { code: 0, data: user };
  });

  // 更新用户信息
  fastify.put('/me', async (request: FastifyRequest, reply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ code: 401, error: 'Unauthorized' });
    }

    const body = request.body as any;
    const user = await authService.updateUser(userId, body);
    return { code: 0, data: user };
  });

  // 修改密码
  fastify.put('/password', async (request: FastifyRequest, reply) => {
    const userId = (request as any).userId;
    if (!userId) {
      return reply.status(401).send({ code: 401, error: 'Unauthorized' });
    }

    try {
      const body = request.body as any;
      const { oldPassword, newPassword } = body;
      await authService.changePassword(userId, oldPassword, newPassword);
      return { code: 0, message: 'Password changed' };
    } catch (error: any) {
      return reply.status(400).send({ code: 400, error: error.message });
    }
  });
}
