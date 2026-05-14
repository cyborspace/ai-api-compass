/**
 * Functions API Routes
 * 
 * 所有 Ontology Functions 的 REST API 端点
 */

import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { FunctionExecutor } from '../ontology/function-executor.js';
import {
  rankingFunctions,
  heatFunctions,
  scoringFunctions,
  recommendationFunctions,
  antiGamingFunctions,
  scenarioFunctions,
  aigcFunctions,
} from '../ontology/aigc-schema/ontology-manifest.js';

interface FunctionQuery {
  limit?: string;
  offset?: string;
  [key: string]: any;
}

export const registerFunctionsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;
  const executor = new FunctionExecutor(prisma);

  // Get all available functions
  fastify.get(
    '/functions',
    {
      schema: {
        tags: ['Functions'],
        description: 'Get all available Ontology Functions',
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  categories: { type: 'object' },
                  total: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const allFunctions = [
        ...aigcFunctions,
        ...rankingFunctions,
        ...heatFunctions,
        ...scoringFunctions,
        ...recommendationFunctions,
        ...antiGamingFunctions,
        ...scenarioFunctions,
      ];

      const categories: Record<string, any[]> = {
        ranking: rankingFunctions,
        heat: heatFunctions,
        scoring: scoringFunctions,
        recommendation: recommendationFunctions,
        antiGaming: antiGamingFunctions,
        scenario: scenarioFunctions,
        default: aigcFunctions,
      };

      return reply.send({
        data: {
          categories,
          total: allFunctions.length,
        },
      });
    }
  );

  // Execute a specific function
  fastify.post<{
    Params: { functionName: string };
    Body: Record<string, any>;
  }>(
    '/functions/:functionName',
    {
      schema: {
        tags: ['Functions'],
        description: 'Execute an Ontology Function',
        params: {
          type: 'object',
          properties: {
            functionName: { type: 'string' },
          },
          required: ['functionName'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              metadata: {
                type: 'object',
                properties: {
                  executionTime: { type: 'number' },
                  cacheHit: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { functionName } = req.params;
      const parameters = req.body || {};

      // Find the function definition
      const allFunctions = [
        ...aigcFunctions,
        ...rankingFunctions,
        ...heatFunctions,
        ...scoringFunctions,
        ...recommendationFunctions,
        ...antiGamingFunctions,
        ...scenarioFunctions,
      ];

      const func = allFunctions.find((f) => f.apiName === functionName);

      if (!func) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'FUNCTION_NOT_FOUND',
            message: `Function '${functionName}' not found`,
          },
        });
      }

      const result = await executor.execute(func, parameters, {
        userId: req.headers['x-user-id'] as string,
        sessionId: req.headers['x-session-id'] as string,
      });

      return reply.send(result);
    }
  );

  // ==================== Ranking Functions ====================

  // GET /functions/ranking/composite
  fastify.get(
    '/functions/ranking/composite',
    {
      schema: {
        tags: ['Ranking'],
        description: 'Get composite rankings',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = rankingFunctions.find((f) => f.apiName === 'getCompositeRankings')!;
      const result = await executor.execute(func, {
        perspective: query.perspective,
        category: query.category,
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      });
      return reply.send(result);
    }
  );

  // GET /functions/ranking/performance
  fastify.get(
    '/functions/ranking/performance',
    {
      schema: {
        tags: ['Ranking'],
        description: 'Get performance rankings',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = rankingFunctions.find((f) => f.apiName === 'getPerformanceRankings')!;
      const result = await executor.execute(func, {
        category: query.category,
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      });
      return reply.send(result);
    }
  );

  // GET /functions/ranking/value
  fastify.get(
    '/functions/ranking/value',
    {
      schema: {
        tags: ['Ranking'],
        description: 'Get value rankings',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = rankingFunctions.find((f) => f.apiName === 'getValueRankings')!;
      const result = await executor.execute(func, {
        category: query.category,
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      });
      return reply.send(result);
    }
  );

  // GET /functions/ranking/rising
  fastify.get(
    '/functions/ranking/rising',
    {
      schema: {
        tags: ['Ranking'],
        description: 'Get rising rankings',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = rankingFunctions.find((f) => f.apiName === 'getRisingRankings')!;
      const result = await executor.execute(func, {
        perspective: query.perspective,
        limit: query.limit ? parseInt(query.limit) : 20,
        days: query.days ? parseInt(query.days) : 7,
      });
      return reply.send(result);
    }
  );

  // GET /functions/ranking/types
  fastify.get(
    '/functions/ranking/types',
    {
      schema: {
        tags: ['Ranking'],
        description: 'Get all ranking types',
      },
    },
    async (req, reply) => {
      const func = rankingFunctions.find((f) => f.apiName === 'getRankingCategories')!;
      const result = await executor.execute(func, {});
      return reply.send(result);
    }
  );

  // ==================== Heat Functions ====================

  // GET /functions/heat/hot
  fastify.get(
    '/functions/heat/hot',
    {
      schema: {
        tags: ['Heat'],
        description: 'Get hot tools',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = heatFunctions.find((f) => f.apiName === 'getHotTools')!;
      const result = await executor.execute(func, {
        period: query.period || '24h',
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      });
      return reply.send(result);
    }
  );

  // GET /functions/heat/rising
  fastify.get(
    '/functions/heat/rising',
    {
      schema: {
        tags: ['Heat'],
        description: 'Get rising tools',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = heatFunctions.find((f) => f.apiName === 'getRisingTools')!;
      const result = await executor.execute(func, {
        period: query.period || '7d',
        limit: query.limit ? parseInt(query.limit) : 20,
      });
      return reply.send(result);
    }
  );

  // POST /functions/heat/record
  fastify.post(
    '/functions/heat/record',
    {
      schema: {
        tags: ['Heat'],
        description: 'Record user event',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const func = heatFunctions.find((f) => f.apiName === 'recordUserEvent')!;
      const result = await executor.execute(func, body, {
        userId: req.headers['x-user-id'] as string,
        sessionId: req.headers['x-session-id'] as string,
      });
      return reply.send(result);
    }
  );

  // ==================== Scoring Functions ====================

  // POST /functions/scoring/calculate
  fastify.post<{
    Body: { toolSlug: string; perspective?: string };
  }>(
    '/functions/scoring/calculate',
    {
      schema: {
        tags: ['Scoring'],
        description: 'Calculate tool score',
      },
    },
    async (req, reply) => {
      const body = req.body;
      const func = scoringFunctions.find((f) => f.apiName === 'calculateToolScore')!;
      const result = await executor.execute(func, {
        toolSlug: body.toolSlug,
        perspective: body.perspective || 'default',
      });
      return reply.send(result);
    }
  );

  // GET /functions/scoring/perspectives
  fastify.get(
    '/functions/scoring/perspectives',
    {
      schema: {
        tags: ['Scoring'],
        description: 'Get all scoring perspectives',
      },
    },
    async (req, reply) => {
      const func = scoringFunctions.find((f) => f.apiName === 'getAllPerspectives')!;
      const result = await executor.execute(func, {});
      return reply.send(result);
    }
  );

  // ==================== Recommendation Functions ====================

  // GET /functions/recommendation/home
  fastify.get(
    '/functions/recommendation/home',
    {
      schema: {
        tags: ['Recommendation'],
        description: 'Get home recommendations',
      },
    },
    async (req, reply) => {
      const query = req.query as FunctionQuery;
      const func = recommendationFunctions.find((f) => f.apiName === 'getHomeRecommendations')!;
      const result = await executor.execute(func, {
        limit: query.limit ? parseInt(query.limit) : 20,
        offset: query.offset ? parseInt(query.offset) : 0,
      });
      return reply.send(result);
    }
  );

  // POST /functions/recommendation/search
  fastify.post(
    '/functions/recommendation/search',
    {
      schema: {
        tags: ['Recommendation'],
        description: 'Get search recommendations',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const func = recommendationFunctions.find((f) => f.apiName === 'getSearchRecommendations')!;
      const result = await executor.execute(func, {
        query: body.query,
        category: body.category,
        limit: body.limit || 20,
        relevanceWeight: body.relevanceWeight,
        heatWeight: body.heatWeight,
      });
      return reply.send(result);
    }
  );

  // POST /functions/recommendation/scenario
  fastify.post(
    '/functions/recommendation/scenario',
    {
      schema: {
        tags: ['Recommendation'],
        description: 'Get scenario recommendations',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const func = recommendationFunctions.find((f) => f.apiName === 'getScenarioRecommendations')!;
      const result = await executor.execute(func, {
        scenario: body.scenario,
        description: body.description,
        constraints: body.constraints,
        limit: body.limit || 10,
      });
      return reply.send(result);
    }
  );

  // POST /functions/recommendation/similar
  fastify.post<{
    Body: { toolRid: string; limit?: number };
  }>(
    '/functions/recommendation/similar',
    {
      schema: {
        tags: ['Recommendation'],
        description: 'Get similar tools',
      },
    },
    async (req, reply) => {
      const body = req.body;
      const func = recommendationFunctions.find((f) => f.apiName === 'getSimilarTools')!;
      const result = await executor.execute(func, {
        toolRid: body.toolRid,
        limit: body.limit || 5,
        includeReasons: true,
      });
      return reply.send(result);
    }
  );

  // ==================== Scenario Functions ====================

  // GET /functions/scenario/presets
  fastify.get(
    '/functions/scenario/presets',
    {
      schema: {
        tags: ['Scenario'],
        description: 'Get preset scenarios',
      },
    },
    async (req, reply) => {
      const func = scenarioFunctions.find((f) => f.apiName === 'getPresetScenarios')!;
      const result = await executor.execute(func, {});
      return reply.send(result);
    }
  );

  // POST /functions/scenario/match
  fastify.post<{
    Body: { query: string; description?: string };
  }>(
    '/functions/scenario/match',
    {
      schema: {
        tags: ['Scenario'],
        description: 'Match scenario',
      },
    },
    async (req, reply) => {
      const body = req.body;
      const func = scenarioFunctions.find((f) => f.apiName === 'matchScenario')!;
      const result = await executor.execute(func, {
        query: body.query,
        description: body.description,
      });
      return reply.send(result);
    }
  );

  // ==================== Anti-Gaming Functions ====================

  // POST /functions/security/detect-risk
  fastify.post(
    '/functions/security/detect-risk',
    {
      schema: {
        tags: ['Security'],
        description: 'Detect user risk',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const func = antiGamingFunctions.find((f) => f.apiName === 'detectUserRisk')!;
      const result = await executor.execute(func, {
        userId: body.userId,
        sessionId: body.sessionId,
        ipAddress: body.ipAddress,
        action: body.action,
        toolRid: body.toolRid,
      });
      return reply.send(result);
    }
  );

  // GET /functions/security/statistics
  fastify.get(
    '/functions/security/statistics',
    {
      schema: {
        tags: ['Security'],
        description: 'Get risk statistics',
      },
    },
    async (req, reply) => {
      const func = antiGamingFunctions.find((f) => f.apiName === 'getRiskStatistics')!;
      const result = await executor.execute(func, {});
      return reply.send(result);
    }
  );
};
