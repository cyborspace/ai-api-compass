/**
 * Ratings Routes
 * 
 * 社区评分 API 路由
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRatingService, SubmitRatingParams } from '../services/rating-service.js';

// =============================================================================
// Request Types
// =============================================================================

interface SubmitRatingBody {
  toolRid: string;
  overallRating: number;
  easeOfUseRating?: number;
  performanceRating?: number;
  valueRating?: number;
  reviewTitle?: string;
  reviewContent?: string;
  pros?: string[];
  cons?: string[];
}

interface GetRatingsQuery {
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
}

interface ToolRidParams {
  rid: string;
}

interface MarkHelpfulParams {
  ratingId: string;
}

// =============================================================================
// Schemas
// =============================================================================

const submitRatingSchema = {
  body: {
    type: 'object',
    required: ['toolRid', 'overallRating'],
    properties: {
      toolRid: { type: 'string' },
      overallRating: { type: 'integer', minimum: 1, maximum: 5 },
      easeOfUseRating: { type: 'integer', minimum: 1, maximum: 5 },
      performanceRating: { type: 'integer', minimum: 1, maximum: 5 },
      valueRating: { type: 'integer', minimum: 1, maximum: 5 },
      reviewTitle: { type: 'string', maxLength: 100 },
      reviewContent: { type: 'string', maxLength: 2000 },
      pros: { type: 'array', items: { type: 'string' } },
      cons: { type: 'array', items: { type: 'string' } },
    },
  },
};

const getRatingsSchema = {
  params: {
    type: 'object',
    required: ['rid'],
    properties: {
      rid: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
      offset: { type: 'integer', default: 0, minimum: 0 },
      sortBy: {
        type: 'string',
        enum: ['recent', 'helpful', 'rating_high', 'rating_low'],
        default: 'recent',
      },
    },
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 获取客户端 IP 地址
 */
function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return request.ip;
}

/**
 * 获取或创建会话 ID
 */
function getSessionId(request: FastifyRequest): string {
  // 从 cookie 或 header 获取会话 ID
  const sessionId = request.headers['x-session-id'] as string;
  if (sessionId) {
    return sessionId;
  }

  // 从 cookie 获取
  const cookies = request.headers.cookie;
  if (cookies) {
    const match = cookies.match(/session_id=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  // 生成临时会话 ID (基于 IP 和 User-Agent)
  const ip = getClientIp(request);
  const ua = request.headers['user-agent'] || '';
  return `temp_${Buffer.from(`${ip}:${ua}`).toString('base64').slice(0, 16)}`;
}

// =============================================================================
// Register Routes
// =============================================================================

export async function ratingsRoutes(fastify: FastifyInstance) {
  const ratingService = getRatingService(fastify.prisma);

  // =============================================================================
  // POST /api/aigc/ratings - 提交评分
  // =============================================================================

  fastify.post<{ Body: SubmitRatingBody }>(
    '/ratings',
    {
      schema: submitRatingSchema,
    },
    async (request, reply) => {
      const body = request.body;

      // 获取用户信息 (如果已登录)
      const userId = (request as any).user?.id;

      // 构建评分参数
      const params: SubmitRatingParams = {
        toolRid: body.toolRid,
        userId,
        sessionId: getSessionId(request),
        ipAddress: getClientIp(request),
        userAgent: request.headers['user-agent'],
        overallRating: body.overallRating,
        easeOfUseRating: body.easeOfUseRating,
        performanceRating: body.performanceRating,
        valueRating: body.valueRating,
        reviewTitle: body.reviewTitle,
        reviewContent: body.reviewContent,
        pros: body.pros,
        cons: body.cons,
      };

      const result = await ratingService.submitRating(params);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          error: result.error,
        });
      }

      return {
        success: true,
        ratingId: result.ratingId,
        isFlagged: result.isFlagged,
        flagReason: result.flagReason,
      };
    }
  );

  // =============================================================================
  // GET /api/aigc/tools/:rid/ratings - 获取工具评分列表
  // =============================================================================

  fastify.get<{ Params: ToolRidParams; Querystring: GetRatingsQuery }>(
    '/tools/:rid/ratings',
    {
      schema: getRatingsSchema,
    },
    async (request, reply) => {
      const { rid } = request.params;
      const { limit, offset, sortBy } = request.query;

      const result = await ratingService.getToolRatings(rid, {
        limit,
        offset,
        sortBy,
      });

      return {
        success: true,
        ...result,
      };
    }
  );

  // =============================================================================
  // GET /api/aigc/tools/:rid/ratings/stats - 获取工具评分统计
  // =============================================================================

  fastify.get<{ Params: ToolRidParams }>(
    '/tools/:rid/ratings/stats',
    async (request, reply) => {
      const { rid } = request.params;

      const stats = await ratingService.getToolRatingStats(rid);

      if (!stats) {
        return reply.status(404).send({
          success: false,
          error: '工具不存在',
        });
      }

      return {
        success: true,
        ...stats,
      };
    }
  );

  // =============================================================================
  // GET /api/aigc/tools/:rid/ratings/my - 检查用户是否已评分
  // =============================================================================

  fastify.get<{ Params: ToolRidParams }>(
    '/tools/:rid/ratings/my',
    async (request, reply) => {
      const { rid } = request.params;

      // 获取用户信息 (如果已登录)
      const userId = (request as any).user?.id;
      const sessionId = getSessionId(request);

      const result = await ratingService.checkUserRating(rid, userId, sessionId);

      return {
        success: true,
        hasRated: result.hasRated,
        rating: result.rating,
      };
    }
  );

  // =============================================================================
  // POST /api/aigc/ratings/:ratingId/helpful - 标记评分有帮助
  // =============================================================================

  fastify.post<{ Params: MarkHelpfulParams }>(
    '/ratings/:ratingId/helpful',
    async (request, reply) => {
      const { ratingId } = request.params;

      const result = await ratingService.markRatingHelpful(ratingId);

      if (!result.success) {
        return reply.status(404).send({
          success: false,
          error: '评分不存在',
        });
      }

      return {
        success: true,
        message: '感谢您的反馈',
      };
    }
  );
}

// =============================================================================
// Export
// =============================================================================

export default ratingsRoutes;
