/**
 * Rankings Routes
 * 
 * 排名 API 路由
 * 
 * 端点:
 * - GET /api/aigc/rankings/:type - 获取排名列表
 * - GET /api/aigc/tools/:rid/ranking - 获取工具排名详情
 * - GET /api/aigc/rankings/types - 获取排名类型列表
 * - GET /api/aigc/rankings/perspectives - 获取视角列表
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  RankingCalculator,
  getRankingCalculator,
} from '../services/ranking/ranking-calculator.js';
import {
  CompositeScorer,
  getCompositeScorer,
  PERSPECTIVE_NAMES,
  DIMENSION_NAMES,
  PerspectiveType,
  RankingType,
} from '../services/ranking/composite-scorer.js';

// =============================================================================
// Request Types
// =============================================================================

interface RankingsQuery {
  perspective?: PerspectiveType;
  category?: string;
  limit?: number;
  offset?: number;
}

interface RankingTypeParams {
  type: RankingType;
}

interface ToolRidParams {
  rid: string;
}

// =============================================================================
// Validation Schemas
// =============================================================================

const rankingsQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      perspective: {
        type: 'string',
        enum: ['default', 'performance', 'value', 'community'],
        default: 'default',
      },
      category: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  },
};

const rankingTypeParamSchema = {
  params: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        enum: ['composite', 'price_performance', 'speed', 'quality', 'popularity', 'rising'],
      },
    },
  },
};

// =============================================================================
// Register Routes
// =============================================================================

export async function rankingsRoutes(fastify: FastifyInstance) {
  const calculator = getRankingCalculator(fastify.prisma);
  const scorer = getCompositeScorer(fastify.prisma);

  // ===========================================================================
  // Rankings List
  // ===========================================================================

  /**
   * GET /api/aigc/rankings/:type
   * 获取排名列表
   * 
   * @param type - 排名类型: composite, price_performance, speed, quality, popularity, rising
   * @query perspective - 视角: default, performance, value, community
   * @query category - 分类筛选
   * @query limit - 返回数量
   * @query offset - 偏移量
   */
  fastify.get<{ Params: RankingTypeParams; Querystring: RankingsQuery }>(
    '/rankings/:type',
    {
      schema: {
        ...rankingTypeParamSchema,
        ...rankingsQuerySchema,
        tags: ['AIGC Rankings'],
        summary: '获取排名列表',
        description: '获取指定类型的工具排名列表，支持不同视角和分类筛选',
        params: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['composite', 'price_performance', 'speed', 'quality', 'popularity', 'rising'],
              description: '排名类型',
            },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            perspective: {
              type: 'string',
              enum: ['default', 'performance', 'value', 'community'],
              description: '计算视角',
            },
            category: { type: 'string', description: '分类筛选' },
            limit: { type: 'integer', description: '返回数量' },
            offset: { type: 'integer', description: '偏移量' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  perspective: { type: 'string' },
                  category: { type: 'string' },
                  total: { type: 'integer' },
                  entries: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        rank: { type: 'integer' },
                        rid: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        score: { type: 'number' },
                        pricingModel: { type: 'string' },
                        contextWindow: { type: 'number' },
                        developer: { type: 'string' },
                        capabilities: { type: 'array', items: { type: 'string' } },
                        averageRating: { type: 'number' },
                        previousRank: { type: 'integer', nullable: true },
                        rankChange: { type: 'integer', nullable: true },
                        trend: { type: 'string' },
                        dimensions: { type: 'object' },
                        breakdown: { type: 'object' },
                      },
                    },
                  },
                  updatedAt: { type: 'string' },
                  weights: { type: 'object' },
                  explanation: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { type } = request.params;
      const { perspective = 'default', category, limit = 20, offset = 0 } = request.query;

      try {
        const result = await calculator.getRankings({
          type,
          perspective,
          category,
          limit,
          offset,
        });

        // 转换为前端期望的字段格式
        const formattedEntries = result.entries.map(entry => ({
          rank: entry.rank,
          rid: entry.toolRid,
          name: entry.toolName,
          slug: entry.toolSlug,
          score: entry.score,
          pricingModel: 'unknown', // 从 tool 数据中补充
          contextWindow: entry.scoreResult.dimensions.contextWindow,
          developer: 'unknown', // 从 tool 数据中补充
          capabilities: [], // 从 tool 数据中补充
          averageRating: entry.scoreResult.dimensions.ratingAverage / 20, // 转换回 1-5 分
          previousRank: entry.previousRank ?? undefined,
          rankChange: entry.rankChange ?? undefined,
          trend: entry.trend,
          dimensions: entry.scoreResult.dimensions,
          breakdown: entry.scoreResult.breakdown,
        }));

        return {
          success: true,
          data: {
            ...result,
            updatedAt: result.updatedAt.toISOString(),
            entries: formattedEntries,
          },
        };
      } catch (error) {
        console.error('Error fetching rankings:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch rankings',
        });
      }
    }
  );

  /**
   * GET /api/aigc/rankings
   * 获取综合排名 (默认)
   */
  fastify.get<{ Querystring: RankingsQuery }>(
    '/rankings',
    {
      schema: {
        ...rankingsQuerySchema,
        tags: ['AIGC Rankings'],
        summary: '获取综合排名',
        description: '获取综合排名列表，默认使用综合榜',
      },
    },
    async (request, reply) => {
      const { perspective = 'default', category, limit = 20, offset = 0 } = request.query;

      try {
        const result = await calculator.getRankings({
          type: 'composite',
          perspective,
          category,
          limit,
          offset,
        });

        // 转换为前端期望的字段格式
        const formattedEntries = result.entries.map(entry => ({
          rank: entry.rank,
          rid: entry.toolRid,
          name: entry.toolName,
          slug: entry.toolSlug,
          score: entry.score,
          pricingModel: 'unknown',
          contextWindow: entry.scoreResult.dimensions.contextWindow,
          developer: 'unknown',
          capabilities: [],
          averageRating: entry.scoreResult.dimensions.ratingAverage / 20,
          previousRank: entry.previousRank ?? undefined,
          rankChange: entry.rankChange ?? undefined,
          trend: entry.trend,
          dimensions: entry.scoreResult.dimensions,
          breakdown: entry.scoreResult.breakdown,
        }));

        return {
          success: true,
          data: {
            ...result,
            updatedAt: result.updatedAt.toISOString(),
            entries: formattedEntries,
          },
        };
      } catch (error) {
        console.error('Error fetching rankings:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch rankings',
        });
      }
    }
  );

  // ===========================================================================
  // Tool Ranking Detail
  // ===========================================================================

  /**
   * GET /api/aigc/tools/:rid/ranking
   * 获取工具排名详情
   */
  fastify.get<{ Params: ToolRidParams; Querystring: { perspective?: PerspectiveType } }>(
    '/tools/:rid/ranking',
    {
      schema: {
        tags: ['AIGC Rankings'],
        summary: '获取工具排名详情',
        description: '获取指定工具的排名详情，包括评分分解、百分位、历史排名等',
        params: {
          type: 'object',
          required: ['rid'],
          properties: {
            rid: { type: 'string', description: '工具 RID 或 slug' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            perspective: {
              type: 'string',
              enum: ['default', 'performance', 'value', 'community'],
              description: '计算视角',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { rid } = request.params;
      const { perspective = 'default' } = request.query;

      try {
        const result = await calculator.getToolRanking({
          toolSlug: rid,
          perspective,
        });

        if (!result) {
          return reply.status(404).send({
            success: false,
            error: 'Tool not found',
          });
        }

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error fetching tool ranking:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch tool ranking',
        });
      }
    }
  );

  // ===========================================================================
  // Ranking Types & Perspectives
  // ===========================================================================

  /**
   * GET /api/aigc/rankings/types
   * 获取排名类型列表
   */
  fastify.get('/rankings/types', {
    schema: {
      tags: ['AIGC Rankings'],
      summary: '获取排名类型列表',
      description: '获取所有可用的排名类型及其描述',
    },
  }, async (request, reply) => {
    const types = calculator.getAllRankingTypes();

    return {
      success: true,
      data: types,
    };
  });

  /**
   * GET /api/aigc/rankings/perspectives
   * 获取视角列表
   */
  fastify.get('/rankings/perspectives', {
    schema: {
      tags: ['AIGC Rankings'],
      summary: '获取视角列表',
      description: '获取所有可用的计算视角及其权重配置',
    },
  }, async (request, reply) => {
    const perspectives = scorer.getAllPerspectives();

    return {
      success: true,
      data: perspectives.map(p => ({
        type: p.type,
        name: p.name,
        weights: p.weights,
        description: getPerspectiveDescription(p.type),
      })),
    };
  });

  /**
   * GET /api/aigc/rankings/dimensions
   * 获取评分维度列表
   */
  fastify.get('/rankings/dimensions', {
    schema: {
      tags: ['AIGC Rankings'],
      summary: '获取评分维度列表',
      description: '获取所有评分维度的名称和说明',
    },
  }, async (request, reply) => {
    const dimensions = Object.entries(DIMENSION_NAMES).map(([key, name]) => ({
      key,
      name,
      category: getDimensionCategory(key),
    }));

    return {
      success: true,
      data: dimensions,
    };
  });

  // ===========================================================================
  // Category Rankings
  // ===========================================================================

  /**
   * GET /api/aigc/categories/:slug/rankings
   * 获取分类排名
   */
  fastify.get<{ Params: { slug: string }; Querystring: RankingsQuery }>(
    '/categories/:slug/rankings',
    {
      schema: {
        tags: ['AIGC Rankings'],
        summary: '获取分类排名',
        description: '获取指定分类下的工具排名',
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string', description: '分类 slug' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            perspective: {
              type: 'string',
              enum: ['default', 'performance', 'value', 'community'],
            },
            limit: { type: 'integer' },
          },
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params;
      const { perspective = 'default', limit = 20 } = request.query;

      try {
        const result = await calculator.getCategoryRankings({
          categorySlug: slug,
          perspective,
          limit,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error fetching category rankings:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch category rankings',
        });
      }
    }
  );

  // ===========================================================================
  // Rising Rankings
  // ===========================================================================

  /**
   * GET /api/aigc/rankings/rising
   * 获取新兴榜 (热度上升最快)
   */
  fastify.get<{ Querystring: { perspective?: PerspectiveType; limit?: number; days?: number } }>(
    '/rankings/rising',
    {
      schema: {
        tags: ['AIGC Rankings'],
        summary: '获取新兴榜',
        description: '获取近期热度上升最快的工具排名',
        querystring: {
          type: 'object',
          properties: {
            perspective: {
              type: 'string',
              enum: ['default', 'performance', 'value', 'community'],
            },
            limit: { type: 'integer' },
            days: { type: 'integer', description: '统计天数' },
          },
        },
      },
    },
    async (request, reply) => {
      const { perspective = 'default', limit = 20, days = 7 } = request.query;

      try {
        const result = await calculator.getRisingRankings({
          perspective,
          limit,
          days,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error fetching rising rankings:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch rising rankings',
        });
      }
    }
  );

  // ===========================================================================
  // Score Calculation
  // ===========================================================================

  /**
   * POST /api/aigc/rankings/calculate
   * 计算自定义评分
   */
  fastify.post<{ Body: {
    dimensions: Record<string, number>;
    perspective?: PerspectiveType;
  } }>(
    '/rankings/calculate',
    {
      schema: {
        tags: ['AIGC Rankings'],
        summary: '计算自定义评分',
        description: '根据提供的维度分数计算综合评分',
        body: {
          type: 'object',
          required: ['dimensions'],
          properties: {
            dimensions: {
              type: 'object',
              description: '各维度分数 (0-100)',
            },
            perspective: {
              type: 'string',
              enum: ['default', 'performance', 'value', 'community'],
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { dimensions, perspective = 'default' } = request.body;

      try {
        // 构建评分维度对象
        const scoreDimensions = {
          benchmarkQuality: dimensions.benchmarkQuality ?? 50,
          contextWindow: dimensions.contextWindow ?? 50,
          pricingValue: dimensions.pricingValue ?? 50,
          lmsysElo: dimensions.lmsysElo ?? 50,
          artificialAnalysis: dimensions.artificialAnalysis ?? 50,
          openrouterUsage: dimensions.openrouterUsage ?? 50,
          clickPopularity: dimensions.clickPopularity ?? 50,
          ratingAverage: dimensions.ratingAverage ?? 50,
          engagementDepth: dimensions.engagementDepth ?? 50,
        };

        const result = scorer.calculateScore(scoreDimensions, perspective);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('Error calculating score:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to calculate score',
        });
      }
    }
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getPerspectiveDescription(perspective: PerspectiveType): string {
  const descriptions: Record<PerspectiveType, string> = {
    default: '综合考量所有维度，适合大多数用户',
    performance: '优先考虑性能指标，适合追求极致效果的用户',
    value: '优先考虑性价比，适合注重成本效益的用户',
    community: '优先考虑社区活跃度，适合关注用户口碑的用户',
  };
  return descriptions[perspective];
}

function getDimensionCategory(key: string): string {
  const staticDimensions = ['benchmarkQuality', 'contextWindow', 'pricingValue'];
  const thirdPartyDimensions = ['lmsysElo', 'artificialAnalysis', 'openrouterUsage'];
  const communityDimensions = ['clickPopularity', 'ratingAverage', 'engagementDepth'];

  if (staticDimensions.includes(key)) return '静态指标';
  if (thirdPartyDimensions.includes(key)) return '第三方数据';
  if (communityDimensions.includes(key)) return '社区动态';
  return '其他';
}

// =============================================================================
// Export
// =============================================================================

export default rankingsRoutes;
