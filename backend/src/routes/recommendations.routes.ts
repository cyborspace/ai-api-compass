/**
 * Recommendations Routes
 * 
 * 推荐 API 路由
 * 
 * 端点:
 * - GET /api/aigc/recommendations/home - 首页推荐
 * - POST /api/aigc/recommendations/scenario - 场景推荐
 * - GET /api/aigc/tools/:rid/similar - 相似工具
 * - GET /api/aigc/recommendations/preset-scenarios - 获取预设场景列表
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  RecommendationEngine,
  getRecommendationEngine,
  HomeRecommendationParams,
  ScenarioRecommendationParams,
} from '../services/recommendation/rec-engine.js';
import {
  ScenarioMatcher,
  getScenarioMatcher,
  PRESET_SCENARIOS,
  PresetScenario,
} from '../services/recommendation/scenario-match.js';
import {
  enhanceRecommendationsWithLLM,
  analyzeScenarioWithLLM,
} from '../services/llm/enhanced-recommendation.js';

// =============================================================================
// Types
// =============================================================================

/** 首页推荐请求 */
interface HomeRecommendationRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    hotRatio?: number;
    risingRatio?: number;
    featuredRatio?: number;
  };
}

/** 场景推荐请求 */
interface ScenarioRecommendationRequest {
  Body: {
    scenario: string;
    description?: string;
    constraints?: {
      maxPrice?: number;
      modalities?: string[];
      platform?: string;
      region?: string;
    };
    limit?: number;
    enhanceWithLLM?: boolean;
  };
}

/** 搜索推荐请求 */
interface SearchRecommendationRequest {
  Querystring: {
    query: string;
    category?: string;
    limit?: number;
    relevanceWeight?: number;
    heatWeight?: number;
  };
}

// =============================================================================
// Routes
// =============================================================================

let prisma: PrismaClient;
let recommendationEngine: RecommendationEngine;
let scenarioMatcher: ScenarioMatcher;

/**
 * 注册推荐路由
 */
export async function recommendationsRoutes(fastify: FastifyInstance) {
  // 初始化服务
  prisma = new PrismaClient();
  recommendationEngine = getRecommendationEngine(prisma);
  scenarioMatcher = getScenarioMatcher();

  // ===========================================================================
  // GET /api/aigc/recommendations/home - 首页推荐
  // ===========================================================================
  fastify.get<HomeRecommendationRequest>(
    '/recommendations/home',
    {
      schema: {
        description: '获取首页推荐工具列表',
        tags: ['recommendations'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 20, description: '返回数量限制' },
            offset: { type: 'integer', default: 0, description: '偏移量' },
            hotRatio: { type: 'number', default: 0.5, description: '热门工具比例' },
            risingRatio: { type: 'number', default: 0.3, description: '新兴工具比例' },
            featuredRatio: { type: 'number', default: 0.2, description: '精选工具比例' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              scene: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tool: { type: 'object', additionalProperties: true },
                    score: { type: 'number' },
                    reasons: { type: 'array', items: { type: 'string' } },
                    matchDetails: { type: 'object', additionalProperties: true },
                  },
                },
              },
              metadata: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<HomeRecommendationRequest>, reply: FastifyReply) => {
      const { limit = 20, offset = 0, hotRatio, risingRatio, featuredRatio } = request.query;

      // 构建混合比例
      const mixRatio = hotRatio || risingRatio || featuredRatio
        ? {
            hot: hotRatio ?? 0.5,
            rising: risingRatio ?? 0.3,
            featured: featuredRatio ?? 0.2,
          }
        : undefined;

      const result = await recommendationEngine.getHomeRecommendations({
        limit,
        offset,
        mixRatio,
      });

      return reply.send(result);
    }
  );

  // ===========================================================================
  // POST /api/aigc/recommendations/scenario - 场景推荐
  // ===========================================================================
  fastify.post<ScenarioRecommendationRequest>(
    '/recommendations/scenario',
    {
      schema: {
        description: '根据场景描述推荐工具',
        tags: ['recommendations'],
        body: {
          type: 'object',
          required: ['scenario'],
          properties: {
            scenario: { type: 'string', description: '场景描述或预设场景ID' },
            description: { type: 'string', description: '详细描述' },
            constraints: {
              type: 'object',
              properties: {
                maxPrice: { type: 'number', description: '最高价格' },
                modalities: { type: 'array', items: { type: 'string' }, description: '所需模态' },
                platform: { type: 'string', description: '平台要求' },
                region: { type: 'string', description: '地区要求' },
              },
            },
            limit: { type: 'integer', default: 10, description: '返回数量限制' },
            enhanceWithLLM: { type: 'boolean', default: false, description: '是否使用 LLM 增强推荐' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              scene: { type: 'string' },
              items: { type: 'array' },
              metadata: { type: 'object' },
              enhanced: { type: 'boolean' },
              llmUsed: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<ScenarioRecommendationRequest>, reply: FastifyReply) => {
      const { scenario, description, constraints, limit = 10, enhanceWithLLM = false } = request.body;

      // 1. 获取基础推荐
      const result = await recommendationEngine.getScenarioRecommendations({
        scenario,
        description,
        constraints,
        limit,
      });

      // 2. 如果启用 LLM 增强
      if (enhanceWithLLM && result.success && result.items.length > 0) {
        try {
          const enhanced = await enhanceRecommendationsWithLLM(result, scenario);
          return reply.send({
            ...result,
            items: enhanced.items,
            enhanced: enhanced.enhanced,
            llmUsed: enhanced.llmUsed,
            llmError: enhanced.error,
          });
        } catch (error: any) {
          console.error('LLM enhancement error:', error);
          // LLM 失败时返回基础推荐
          return reply.send({
            ...result,
            enhanced: false,
            llmUsed: false,
            llmError: error.message,
          });
        }
      }

      return reply.send({
        ...result,
        enhanced: false,
        llmUsed: false,
      });
    }
  );

  // ===========================================================================
  // GET /api/aigc/recommendations/search - 搜索推荐
  // ===========================================================================
  fastify.get<SearchRecommendationRequest>(
    '/recommendations/search',
    {
      schema: {
        description: '搜索推荐工具',
        tags: ['recommendations'],
        querystring: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: '搜索关键词' },
            category: { type: 'string', description: '分类筛选' },
            limit: { type: 'integer', default: 20, description: '返回数量限制' },
            relevanceWeight: { type: 'number', default: 0.6, description: '相关度权重' },
            heatWeight: { type: 'number', default: 0.4, description: '热度权重' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              scene: { type: 'string' },
              items: { type: 'array' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<SearchRecommendationRequest>, reply: FastifyReply) => {
      const { query, category, limit = 20, relevanceWeight = 0.6, heatWeight = 0.4 } = request.query;

      const result = await recommendationEngine.getSearchRecommendations({
        query,
        category,
        limit,
        relevanceWeight,
        heatWeight,
      });

      return reply.send(result);
    }
  );

  // ===========================================================================
  // GET /api/aigc/recommendations/preset-scenarios - 获取预设场景列表
  // ===========================================================================
  fastify.get(
    '/recommendations/preset-scenarios',
    {
      schema: {
        description: '获取所有预设场景配置',
        tags: ['recommendations'],
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
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    keywords: { type: 'array', items: { type: 'string' } },
                    examples: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const scenarios = scenarioMatcher.getPresetScenarios();

      return reply.send({
        success: true,
        data: scenarios.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          keywords: s.keywords,
          examples: s.examples,
          requiredCapabilities: s.requiredCapabilities,
          priceSensitive: s.priceSensitive,
        })),
      });
    }
  );

  // ===========================================================================
  // GET /api/aigc/recommendations/preset-scenarios/:id - 获取单个预设场景
  // ===========================================================================
  fastify.get<{ Params: { id: string } }>(
    '/recommendations/preset-scenarios/:id',
    {
      schema: {
        description: '获取指定预设场景详情',
        tags: ['recommendations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: '场景ID' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const scenario = scenarioMatcher.getPresetScenario(id);

      if (!scenario) {
        return reply.status(404).send({
          success: false,
          error: 'Scenario not found',
        });
      }

      return reply.send({
        success: true,
        data: scenario,
      });
    }
  );

  // ===========================================================================
  // POST /api/aigc/recommendations/analyze - 分析场景需求
  // ===========================================================================
  fastify.post<{ Body: { text: string; description?: string; useLLM?: boolean } }>(
    '/recommendations/analyze',
    {
      schema: {
        description: '分析用户场景需求',
        tags: ['recommendations'],
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', description: '用户输入的场景描述' },
            description: { type: 'string', description: '补充描述' },
            useLLM: { type: 'boolean', default: false, description: '是否使用 LLM 分析' },
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
                  scenarioId: { type: 'string' },
                  scenarioName: { type: 'string' },
                  confidence: { type: 'number' },
                  requiredCapabilities: { type: 'array', items: { type: 'string' } },
                  extractedKeywords: { type: 'array', items: { type: 'string' } },
                  matchReasons: { type: 'array', items: { type: 'string' } },
                  llmAnalysis: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { text, description, useLLM = false } = request.body;

      // 1. 基础场景匹配
      const result = await scenarioMatcher.matchScenario(text, description);

      // 2. 如果启用 LLM 分析
      if (useLLM) {
        try {
          const llmAnalysis = await analyzeScenarioWithLLM(text);
          return reply.send({
            success: true,
            data: {
              ...result,
              llmAnalysis,
            },
          });
        } catch (error: any) {
          console.error('LLM analysis error:', error);
          // LLM 失败时返回基础分析
          return reply.send({
            success: true,
            data: result,
            llmError: error.message,
          });
        }
      }

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}

// =============================================================================
// Export
// =============================================================================

export default recommendationsRoutes;
