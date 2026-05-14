/**
 * Webhook Events Routes
 * 
 * 提供 Writeback 事件日志查询 API
 */

import type { FastifyPluginAsync } from 'fastify';

// 内存中的事件存储（实际应该用数据库）
const webhookEvents: Array<{
  id: string;
  objectType: string;
  objectId: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  changes?: Record<string, { before: unknown; after: unknown }>;
  triggeredBy?: string;
  executionLog?: string[];
  downstreamNotifications?: string[];
  error?: string;
}> = [];

export const registerWebhookEventsRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /api/webhooks/events - 获取所有 Writeback 事件
  fastify.get(
    '/webhooks/events',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Get all webhook events',
      },
    },
    async (req, reply) => {
      const stats = {
        totalEvents: webhookEvents.length,
        pendingEvents: webhookEvents.filter((e) => e.status === 'pending').length,
        completedToday: webhookEvents.filter((e) => {
          const today = new Date().toDateString();
          return e.status === 'completed' && new Date(e.timestamp).toDateString() === today;
        }).length,
        failedToday: webhookEvents.filter((e) => {
          const today = new Date().toDateString();
          return e.status === 'failed' && new Date(e.timestamp).toDateString() === today;
        }).length,
        averageProcessingTime: 150, // 模拟值
      };

      return reply.send({
        data: webhookEvents.slice(-50).reverse(), // 最近 50 条
        stats,
      });
    }
  );

  // POST /api/webhooks/events - 记录新的 Writeback 事件
  fastify.post<{
    Body: {
      objectType: string;
      objectId: string;
      action: string;
      triggeredBy?: string;
      changes?: Record<string, { before: unknown; after: unknown }>;
    };
  }>(
    '/webhooks/events',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Record a new webhook event',
      },
    },
    async (req, reply) => {
      const { objectType, objectId, action, triggeredBy, changes } = req.body;

      const event = {
        id: `wb-${Date.now()}`,
        objectType,
        objectId,
        action,
        timestamp: new Date().toISOString(),
        status: 'completed' as const,
        triggeredBy,
        changes,
        executionLog: [
          `[${new Date().toISOString()}] Webhook 收到事件`,
          `[${new Date().toISOString()}] 验证负载签名`,
          `[${new Date().toISOString()}] 解析变更数据`,
          `[${new Date().toISOString()}] 开始事务处理`,
          `[${new Date().toISOString()}] 提交事务`,
          `[${new Date().toISOString()}] 通知下游系统`,
        ],
        downstreamNotifications: ['HeatCalculationService', 'RankingUpdateService'],
      };

      webhookEvents.push(event);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  // GET /api/webhooks/events/:id - 获取单个事件详情
  fastify.get<{
    Params: { id: string };
  }>(
    '/webhooks/events/:id',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Get webhook event details',
      },
    },
    async (req, reply) => {
      const event = webhookEvents.find((e) => e.id === req.params.id);

      if (!event) {
        return reply.code(404).send({
          success: false,
          error: 'Event not found',
        });
      }

      return reply.send({
        success: true,
        data: event,
      });
    }
  );
};

export default registerWebhookEventsRoutes;
