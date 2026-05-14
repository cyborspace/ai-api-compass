/**
 * Webhook Management Routes
 * 
 * Webhook 配置管理和执行 API
 */

import type { FastifyPluginAsync } from 'fastify';
import { webhookRegistry, writebackEngine } from '../ontology/writeback-webhook.js';

export const registerWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/webhooks - List all webhooks
  fastify.get(
    '/webhooks',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'List all registered webhooks',
      },
    },
    async (req, reply) => {
      const webhooks = webhookRegistry.getAllWebhooks();
      const writebacks = webhookRegistry.getAllWritebackConfigs();

      return reply.send({
        data: {
          webhooks,
          writebacks,
          total: webhooks.length + writebacks.length,
        },
      });
    }
  );

  // POST /api/webhooks - Register a new webhook
  fastify.post<{
    Body: {
      id: string;
      name: string;
      url: string;
      method?: string;
      headers?: Record<string, string>;
      retryConfig?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
      };
      timeout?: number;
      enabled?: boolean;
    };
  }>(
    '/webhooks',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Register a new webhook',
      },
    },
    async (req, reply) => {
      const config = req.body;

      webhookRegistry.registerWebhook({
        id: config.id,
        name: config.name,
        url: config.url,
        method: (config.method as any) || 'POST',
        headers: config.headers,
        retryConfig: config.retryConfig,
        timeout: config.timeout,
        enabled: config.enabled ?? true,
      });

      return reply.send({
        success: true,
        message: `Webhook '${config.id}' registered`,
      });
    }
  );

  // GET /api/webhooks/:id - Get webhook details
  fastify.get<{ Params: { id: string } }>(
    '/webhooks/:id',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Get webhook details',
      },
    },
    async (req, reply) => {
      const webhook = webhookRegistry.getWebhook(req.params.id);

      if (!webhook) {
        return reply.code(404).send({
          success: false,
          error: 'Webhook not found',
        });
      }

      return reply.send({ data: webhook });
    }
  );

  // POST /api/webhooks/:id/test - Test webhook
  fastify.post<{ Params: { id: string }; Body: { payload?: any } }>(
    '/webhooks/:id/test',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Test a webhook',
      },
    },
    async (req, reply) => {
      const webhook = webhookRegistry.getWebhook(req.params.id);

      if (!webhook) {
        return reply.code(404).send({
          success: false,
          error: 'Webhook not found',
        });
      }

      const payload = req.body?.payload || {
        eventType: 'test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook execution',
      };

      const { WebhookExecutor } = await import('../ontology/writeback-webhook.js');
      const executor = new WebhookExecutor(webhookRegistry);
      const result = await executor.execute(webhook, payload as any);

      return reply.send({
        success: result.success,
        webhookId: webhook.id,
        statusCode: result.statusCode,
        duration: result.duration,
        response: result.data,
        error: result.error,
      });
    }
  );

  // POST /api/webhooks/:id/validate - Validate webhook URL
  fastify.post<{ Params: { id: string } }>(
    '/webhooks/:id/validate',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Validate webhook URL',
      },
    },
    async (req, reply) => {
      const webhook = webhookRegistry.getWebhook(req.params.id);

      if (!webhook) {
        return reply.code(404).send({
          success: false,
          error: 'Webhook not found',
        });
      }

      if (!webhook.url) {
        return reply.send({
          valid: false,
          error: 'Webhook URL is empty',
        });
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(webhook.url, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        return reply.send({
          valid: response.ok,
          statusCode: response.status,
          statusText: response.statusText,
        });
      } catch (error) {
        return reply.send({
          valid: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    }
  );

  // GET /api/writebacks - List writeback configurations
  fastify.get(
    '/writebacks',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'List writeback configurations',
      },
    },
    async (req, reply) => {
      const writebacks = webhookRegistry.getAllWritebackConfigs();

      return reply.send({
        data: writebacks,
      });
    }
  );

  // POST /api/writebacks - Register writeback config
  fastify.post<{ Body: any }>(
    '/writebacks',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Register a writeback configuration',
      },
    },
    async (req, reply) => {
      const config = req.body as any;
      webhookRegistry.registerWriteback(config);

      return reply.send({
        success: true,
        message: `Writeback '${config.id}' registered`,
      });
    }
  );

  // POST /api/writebacks/execute - Execute a writeback
  fastify.post<{
    Body: {
      objectType: string;
      actionType: string;
      parameters: Record<string, any>;
      context?: {
        userId?: string;
        sessionId?: string;
      };
    };
  }>(
    '/writebacks/execute',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Execute a writeback with transaction support',
      },
    },
    async (req, reply) => {
      const { objectType, actionType, parameters, context } = req.body;

      const result = await writebackEngine.executeWriteback(
        objectType,
        actionType,
        parameters,
        context || {},
        {
          execute: async () => {
            return { success: true };
          },
        }
      );

      return reply.send(result);
    }
  );

  // GET /api/webhooks/config - Get webhook environment config
  fastify.get(
    '/webhooks/config',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Get webhook environment configuration',
      },
    },
    async (req, reply) => {
      const envConfig = {
        slack: !!process.env.SLACK_WEBHOOK_URL,
        email: !!process.env.EMAIL_WEBHOOK_URL,
        analytics: !!process.env.ANALYTICS_WEBHOOK_URL,
        validation: !!process.env.VALIDATION_WEBHOOK_URL,
        adminAlert: !!process.env.ADMIN_ALERT_WEBHOOK_URL,
      };

      return reply.send({
        data: envConfig,
        configured: Object.values(envConfig).some(v => v),
      });
    }
  );

  // POST /api/webhooks/config - Update webhook environment config
  fastify.post<{
    Body: {
      key: string;
      value: string;
    };
  }>(
    '/webhooks/config',
    {
      schema: {
        tags: ['Webhooks'],
        description: 'Update webhook environment variable (runtime only)',
      },
    },
    async (req, reply) => {
      const { key, value } = req.body;

      process.env[key] = value;

      return reply.send({
        success: true,
        message: `Environment variable ${key} updated`,
      });
    }
  );
};
