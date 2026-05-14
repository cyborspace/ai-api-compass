/**
 * Actions API Routes
 * 
 * 处理 Action 类型的执行请求
 */

import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const registerActionsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // POST /api/actions/execute - Execute an Action
  fastify.post<{
    Body: {
      actionApiName: string;
      objectTypeApiName?: string;
      objectId?: string;
      parameters: Record<string, unknown>;
    };
  }>(
    '/actions/execute',
    {
      schema: {
        tags: ['Actions'],
        description: 'Execute an ActionType with parameters',
      },
    },
    async (req, reply) => {
      const { actionApiName, objectTypeApiName, objectId, parameters } = req.body;

      // 查找 ActionType
      const actionType = await prisma.action_types.findFirst({
        where: { apiName: actionApiName },
      });

      if (!actionType) {
        return reply.code(404).send({
          success: false,
          error: `ActionType '${actionApiName}' not found`,
        });
      }

      const startTime = Date.now();

      try {
        // 查找对象（如果提供了 objectId）
        let targetObject = null;
        if (objectTypeApiName && objectId) {
          const objectType = await prisma.object_types.findUnique({
            where: { apiName: objectTypeApiName },
          });
          
          if (objectType) {
            targetObject = await prisma.objects.findFirst({
              where: {
                objectTypeId: objectType.id,
                rid: objectId,
              },
            });
          }
        }

        // 模拟 Action 执行
        // 在实际实现中，这里会调用 ActionExecutor
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 构建返回结果
        const result = {
          success: true,
          data: {
            actionType: actionApiName,
            objectType: objectTypeApiName,
            objectId: objectId,
            executedAt: new Date().toISOString(),
            result: {
              message: `Action '${actionApiName}' executed successfully`,
              affectedFields: Object.keys(parameters),
            },
          },
          executionTime: Date.now() - startTime,
        };

        // 检查是否需要触发 Writeback
        // 这里检查是否有与该 Action 关联的 Writeback 配置
        const writebackConfig = await checkWritebackConfig(prisma, actionApiName);

        if (writebackConfig) {
          // 返回 Writeback 信息
          (result as any).writeback = {
            objectType: objectTypeApiName || 'unknown',
            objectId: objectId || 'unknown',
            changes: buildChangeSet(parameters),
          };
        }

        return reply.send(result);
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Action execution failed',
          executionTime: Date.now() - startTime,
        });
      }
    }
  );

  // GET /api/actions - List all ActionTypes
  fastify.get(
    '/actions',
    {
      schema: {
        tags: ['Actions'],
        description: 'List all ActionTypes',
      },
    },
    async (req, reply) => {
      const actionTypes = await prisma.action_types.findMany({
        where: { status: { not: 'deprecated' } },
        orderBy: { displayName: 'asc' },
      });

      return reply.send({
        success: true,
        data: actionTypes.map((at) => ({
          id: at.id,
          apiName: at.apiName,
          displayName: at.displayName,
          description: at.description,
          status: at.status,
        })),
      });
    }
  );

  // GET /api/actions/:apiName - Get ActionType details
  fastify.get<{
    Params: { apiName: string };
  }>(
    '/actions/:apiName',
    {
      schema: {
        tags: ['Actions'],
        description: 'Get ActionType details',
      },
    },
    async (req, reply) => {
      const actionType = await prisma.action_types.findFirst({
        where: { apiName: req.params.apiName },
      });

      if (!actionType) {
        return reply.code(404).send({
          success: false,
          error: 'ActionType not found',
        });
      }

      return reply.send({
        success: true,
        data: actionType,
      });
    }
  );
};

// 辅助函数：检查 Writeback 配置
async function checkWritebackConfig(
  prisma: PrismaClient,
  actionApiName: string
) {
  // 在实际实现中，这里会查询数据库中的 writeback 配置
  // 目前返回一个模拟值，表示是否有 Writeback
  const writebackActions = [
    'updateToolRating',
    'submitReview',
    'addToFavorites',
    'updateToolInfo',
  ];

  return writebackActions.includes(actionApiName);
}

// 辅助函数：构建变更集
function buildChangeSet(parameters: Record<string, unknown>) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  for (const [key, value] of Object.entries(parameters)) {
    changes[key] = {
      before: null, // 在实际实现中，这里会查询数据库获取旧值
      after: value,
    };
  }

  return changes;
}

export default registerActionsRoutes;
