/**
 * Datasource Management API Routes
 *
 * Backing Datasource 映射管理端点
 * 对齐 Palantir Ontology Datasource API
 */

import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { DatasourceSyncEngine } from '../ontology/datasource-sync.js';
import type { BackingDatasource } from '../ontology/types';

export const registerDatasourceRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;
  const syncEngine = new DatasourceSyncEngine(prisma);

  // ---------------------------------------------------------------------------
  // GET /api/ontology/object-types/:objectTypeId/datasources
  // 获取 Object Type 的所有 Datasource 映射
  // ---------------------------------------------------------------------------
  fastify.get(
    '/ontology/object-types/:objectTypeId/datasources',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'Get all datasource mappings for an Object Type',
        params: {
          type: 'object',
          properties: {
            objectTypeId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    datasource: { type: 'object' },
                    objectTypeApiName: { type: 'string' },
                    objectTypeId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { objectTypeId } = request.params as { objectTypeId: string };

      const objectType = await prisma.object_types.findUnique({
        where: { id: objectTypeId },
      });

      if (!objectType) {
        return reply.status(404).send({
          success: false,
          error: 'Object Type not found',
        });
      }

      const datasources = await syncEngine.getObjectTypeDatasources(objectTypeId);

      return reply.send({
        success: true,
        data: datasources,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/ontology/object-types/:objectTypeId/datasources
  // 创建或更新 Datasource 映射
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/object-types/:objectTypeId/datasources',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'Sync datasource mappings for an Object Type',
        body: {
          type: 'object',
          properties: {
            datasources: {
              type: 'array',
              items: { type: 'object' },
            },
          },
          required: ['datasources'],
        },
      },
    },
    async (request, reply) => {
      const { objectTypeId } = request.params as { objectTypeId: string };
      const { datasources } = request.body as { datasources: BackingDatasource[] };

      const objectType = await prisma.object_types.findUnique({
        where: { id: objectTypeId },
      });

      if (!objectType) {
        return reply.status(404).send({
          success: false,
          error: 'Object Type not found',
        });
      }

      const results = await syncEngine.syncObjectTypeDatasources(objectTypeId, datasources);

      const allSuccess = results.every((r) => r.success);

      return reply.status(allSuccess ? 200 : 207).send({
        success: allSuccess,
        data: results,
        errors: results.flatMap((r) => r.errors),
        warnings: results.flatMap((r) => r.warnings),
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/ontology/object-types/:objectTypeId/datasources/auto-sync
  // 从 Prisma Model 自动同步 Datasource
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/object-types/:objectTypeId/datasources/auto-sync',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'Auto-generate datasource mapping from Prisma model',
        body: {
          type: 'object',
          properties: {
            prismaModelName: { type: 'string' },
          },
          required: ['prismaModelName'],
        },
      },
    },
    async (request, reply) => {
      const { objectTypeId } = request.params as { objectTypeId: string };
      const { prismaModelName } = request.body as { prismaModelName: string };

      const result = await syncEngine.autoSyncFromPrismaModel(objectTypeId, prismaModelName);

      return reply.status(result.success ? 200 : 400).send({
        success: result.success,
        data: result,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/ontology/object-types/:objectTypeId/datasources/:datasourceApiName/validate
  // 验证 Datasource 映射
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/object-types/:objectTypeId/datasources/:datasourceApiName/validate',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'Validate a datasource mapping',
      },
    },
    async (request, reply) => {
      const { objectTypeId, datasourceApiName } = request.params as {
        objectTypeId: string;
        datasourceApiName: string;
      };

      const mapping = await prisma.datasource_mappings.findFirst({
        where: { objectTypeId, apiName: datasourceApiName },
      });

      if (!mapping) {
        return reply.status(404).send({
          success: false,
          error: 'Datasource mapping not found',
        });
      }

      const datasource: BackingDatasource = {
        rid: mapping.rid ?? undefined,
        apiName: mapping.apiName,
        displayName: mapping.displayName,
        description: mapping.description ?? undefined,
        datasourceType: mapping.datasourceType as any,
        sourceIdentifier: mapping.sourceIdentifier,
        schemaName: mapping.schemaName ?? undefined,
        isPrimary: mapping.isPrimary,
        propertyMappings: (mapping.propertyMappings as Record<string, string>) ?? undefined,
        supportsWrites: mapping.supportsWrites,
        syncConfig: (mapping.syncConfig as any) ?? undefined,
        status: (mapping.status as any) ?? 'ACTIVE',
      };

      const validation = await syncEngine.validateDatasource(objectTypeId, datasource);

      return reply.send({
        success: validation.valid,
        data: validation,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/ontology/object-types/:objectTypeId/datasources/:datasourceApiName
  // 删除 Datasource 映射
  // ---------------------------------------------------------------------------
  fastify.delete(
    '/ontology/object-types/:objectTypeId/datasources/:datasourceApiName',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'Delete a datasource mapping',
      },
    },
    async (request, reply) => {
      const { objectTypeId, datasourceApiName } = request.params as {
        objectTypeId: string;
        datasourceApiName: string;
      };

      const mapping = await prisma.datasource_mappings.findFirst({
        where: { objectTypeId, apiName: datasourceApiName },
      });

      if (!mapping) {
        return reply.status(404).send({
          success: false,
          error: 'Datasource mapping not found',
        });
      }

      await prisma.datasource_mappings.delete({
        where: { id: mapping.id },
      });

      return reply.send({
        success: true,
        data: { deleted: true, datasourceId: mapping.id },
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/ontology/datasources
  // 列出所有 Datasource 映射
  // ---------------------------------------------------------------------------
  fastify.get(
    '/ontology/datasources',
    {
      schema: {
        tags: ['Ontology', 'Datasource'],
        description: 'List all datasource mappings',
      },
    },
    async (_request, reply) => {
      const mappings = await prisma.datasource_mappings.findMany({
        include: { object_types: { select: { apiName: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: mappings.map((m) => ({
          id: m.id,
          rid: m.rid,
          apiName: m.apiName,
          displayName: m.displayName,
          objectTypeId: m.objectTypeId,
          objectTypeApiName: m.object_types.apiName,
          objectTypeDisplayName: m.object_types.displayName,
          datasourceType: m.datasourceType,
          sourceIdentifier: m.sourceIdentifier,
          isPrimary: m.isPrimary,
          supportsWrites: m.supportsWrites,
          status: m.status,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
      });
    }
  );
};

export default registerDatasourceRoutes;
