/**
 * Object Sets API Routes
 * 
 * 实现 Palantir Foundry 风格的 Object Sets 查询 API
 */

import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ObjectSetsAPI } from '../ontology/object-sets-api.js';

interface ObjectSetQueryParams {
  Params: { objectType: string };
  Querystring: {
    limit?: string;
    offset?: string;
    search?: string;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    select?: string;
  };
  Body: {
    filter?: any;
    include?: any;
  };
}

interface AggregationParams {
  Body: {
    objectType: string;
    field: string;
    operation: string;
    groupBy?: string[];
    filter?: any;
  };
}

interface SetOperationParams {
  Body: {
    queries: any[];
    limit?: number;
    offset?: number;
  };
}

export const registerObjectSetsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;
  const objectSetsAPI = new ObjectSetsAPI(prisma);

  // GET /api/object-sets/:objectType - Query Object Set
  fastify.get<ObjectSetQueryParams>(
    '/object-sets/:objectType',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Query an Object Set with filtering and pagination',
        params: {
          type: 'object',
          properties: {
            objectType: { type: 'string' },
          },
          required: ['objectType'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
            offset: { type: 'string' },
            search: { type: 'string' },
            orderBy: { type: 'string' },
            orderDir: { type: 'string', enum: ['asc', 'desc'] },
            select: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { objectType } = req.params;
      const { limit, offset, search, orderBy, orderDir, select } = req.query;

      const query = {
        objectType,
        search: search || undefined,
        filter: req.body?.filter,
        include: req.body?.include,
        orderBy: orderBy ? { field: orderBy, direction: orderDir } : undefined,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        select: select ? select.split(',') : undefined,
      };

      const result = await objectSetsAPI.query(query);
      return reply.send(result);
    }
  );

  // POST /api/object-sets/search - Search Objects
  fastify.post<{ Body: { objectType: string; query: string; options?: any } }>(
    '/object-sets/search',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Search objects in an Object Set',
      },
    },
    async (req, reply) => {
      const { objectType, query, options } = req.body;
      const result = await objectSetsAPI.search(objectType, query, options);
      return reply.send(result);
    }
  );

  // POST /api/object-sets/filter - Filter Objects
  fastify.post<{ Body: { objectType: string; filter: any; options?: any } }>(
    '/object-sets/filter',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Filter objects in an Object Set',
      },
    },
    async (req, reply) => {
      const { objectType, filter, options } = req.body;
      const result = await objectSetsAPI.filter(objectType, filter, options);
      return reply.send(result);
    }
  );

  // POST /api/object-sets/aggregate - Aggregate Objects
  fastify.post<AggregationParams>(
    '/object-sets/aggregate',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Aggregate objects in an Object Set',
      },
    },
    async (req, reply) => {
      const { objectType, field, operation, groupBy, filter } = req.body;
      const result = await objectSetsAPI.aggregate({
        objectType,
        field,
        operation: operation as any,
        groupBy,
        filter,
      });
      return reply.send(result);
    }
  );

  // POST /api/object-sets/union - Union of Object Sets
  fastify.post<SetOperationParams>(
    '/object-sets/union',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Union of multiple Object Sets',
      },
    },
    async (req, reply) => {
      const { queries, limit, offset } = req.body;
      const result = await objectSetsAPI.union(queries, { limit, offset });
      return reply.send(result);
    }
  );

  // POST /api/object-sets/intersect - Intersection of Object Sets
  fastify.post<SetOperationParams>(
    '/object-sets/intersect',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Intersection of multiple Object Sets',
      },
    },
    async (req, reply) => {
      const { queries, limit, offset } = req.body;
      const result = await objectSetsAPI.intersect(queries, { limit, offset });
      return reply.send(result);
    }
  );

  // POST /api/object-sets/subtract - Subtract Object Sets
  fastify.post<{
    Body: {
      baseQuery: any;
      subtractQueries: any[];
      limit?: number;
      offset?: number;
    };
  }>(
    '/object-sets/subtract',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Subtract Object Sets',
      },
    },
    async (req, reply) => {
      const { baseQuery, subtractQueries, limit, offset } = req.body;
      const result = await objectSetsAPI.subtract(baseQuery, subtractQueries, { limit, offset });
      return reply.send(result);
    }
  );

  // GET /api/object-sets/:objectType/filter-examples - Get filter examples
  fastify.get<{ Params: { objectType: string } }>(
    '/object-sets/:objectType/filter-examples',
    {
      schema: {
        tags: ['Object Sets'],
        description: 'Get filter examples for an Object Type',
      },
    },
    async (req, reply) => {
      const { objectType } = req.params;
      const examples: Record<string, any[]> = {
        AIGCTool: [
          {
            description: '过滤活跃的工具',
            filter: {
              conditions: [
                { field: 'status', operator: 'eq', value: 'active' },
              ],
            },
          },
          {
            description: '过滤免费工具',
            filter: {
              conditions: [
                { field: 'isFree', operator: 'eq', value: true },
              ],
            },
          },
          {
            description: '过滤有API的工具',
            filter: {
              conditions: [
                { field: 'hasApi', operator: 'eq', value: true },
              ],
            },
          },
          {
            description: '过滤高评分工具',
            filter: {
              conditions: [
                { field: 'averageRating', operator: 'gte', value: 4.0 },
              ],
            },
          },
          {
            description: '组合条件过滤',
            filter: {
              and: [
                { conditions: [{ field: 'status', operator: 'eq', value: 'active' }] },
                { conditions: [{ field: 'isFree', operator: 'eq', value: false }] },
              ],
            },
          },
        ],
        ToolCategory: [
          {
            description: '按父分类过滤',
            filter: {
              conditions: [
                { field: 'parentSlug', operator: 'isNull', value: null },
              ],
            },
          },
        ],
      };

      const result = examples[objectType] || [];
      return reply.send({ objectType, examples: result });
    }
  );
};
