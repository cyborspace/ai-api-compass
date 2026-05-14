/**
 * Rating Service
 * 
 * 社区评分服务 - 处理评分的提交、查询和统计
 */

import { PrismaClient } from '@prisma/client';
import { AntiSpamService, getAntiSpamService, AntiSpamContext } from './anti-spam.js';

// =============================================================================
// Types
// =============================================================================

export interface SubmitRatingParams {
  toolRid: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  overallRating: number;  // 1-5
  easeOfUseRating?: number;  // 1-5
  performanceRating?: number;  // 1-5
  valueRating?: number;  // 1-5
  reviewTitle?: string;
  reviewContent?: string;
  pros?: string[];
  cons?: string[];
}

export interface RatingResult {
  success: boolean;
  ratingId?: string;
  error?: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface ToolRatingStats {
  toolRid: string;
  totalRatings: number;
  averageRating: number;
  weightedAverageRating: number;
  ratingDistribution: {
    rating5: number;
    rating4: number;
    rating3: number;
    rating2: number;
    rating1: number;
  };
  categoryRatings: {
    easeOfUse: number | null;
    performance: number | null;
    value: number | null;
  };
  reviewCount: number;
}

export interface RatingListItem {
  id: string;
  overallRating: number;
  easeOfUseRating: number | null;
  performanceRating: number | null;
  valueRating: number | null;
  reviewTitle: string | null;
  reviewContent: string | null;
  pros: string[];
  cons: string[];
  helpfulCount: number;
  createdAt: Date;
  isVerified: boolean;
  // 用户信息 (匿名化)
  userName?: string;
}

export interface PaginatedRatings {
  ratings: RatingListItem[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// Rating Service Class
// =============================================================================

export class RatingService {
  private prisma: PrismaClient;
  private antiSpamService: AntiSpamService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.antiSpamService = getAntiSpamService(prisma);
  }

  /**
   * 提交评分
   */
  async submitRating(params: SubmitRatingParams): Promise<RatingResult> {
    // 验证评分范围
    if (params.overallRating < 1 || params.overallRating > 5) {
      return {
        success: false,
        error: '评分必须在 1-5 之间',
      };
    }

    // 验证分项评分
    const categoryRatings = [
      params.easeOfUseRating,
      params.performanceRating,
      params.valueRating,
    ];

    for (const rating of categoryRatings) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        return {
          success: false,
          error: '分项评分必须在 1-5 之间',
        };
      }
    }

    // 验证评测内容长度
    if (params.reviewTitle && params.reviewTitle.length > 100) {
      return {
        success: false,
        error: '评测标题不能超过 100 个字符',
      };
    }

    if (params.reviewContent && params.reviewContent.length > 2000) {
      return {
        success: false,
        error: '评测内容不能超过 2000 个字符',
      };
    }

    // 防刷检查
    const antiSpamContext: AntiSpamContext = {
      userId: params.userId,
      sessionId: params.sessionId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      toolRid: params.toolRid,
    };

    const spamCheck = await this.antiSpamService.checkRatingAllowed(antiSpamContext);
    if (!spamCheck.isAllowed) {
      return {
        success: false,
        error: spamCheck.reason,
      };
    }

    // 检查重复内容
    if (params.reviewContent || params.reviewTitle) {
      const duplicateCheck = await this.antiSpamService.checkDuplicateContent(
        params.toolRid,
        params.reviewContent || '',
        params.reviewTitle
      );

      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          error: '检测到重复的评测内容',
        };
      }
    }

    try {
      // 创建评分记录
      const rating = await this.prisma.user_ratings.create({
        data: {
          id: crypto.randomUUID(),
          toolRid: params.toolRid,
          userId: params.userId,
          sessionId: params.sessionId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          overallRating: params.overallRating,
          easeOfUseRating: params.easeOfUseRating,
          performanceRating: params.performanceRating,
          valueRating: params.valueRating,
          reviewTitle: params.reviewTitle,
          reviewContent: params.reviewContent,
          pros: params.pros || [],
          cons: params.cons || [],
          weight: spamCheck.weight,
          isFlagged: spamCheck.flags.length > 0,
          flagReason: spamCheck.flags.length > 0 ? spamCheck.flags.join(', ') : null,
          updatedAt: new Date(),
        },
      });

      // 记录活动日志
      await this.antiSpamService.logActivity(
        antiSpamContext,
        'rate',
        {
          ratingId: rating.id,
          overallRating: params.overallRating,
          flags: spamCheck.flags,
        },
        spamCheck.flags.length > 0
      );

      // 更新工具聚合评分
      await this.updateToolRatingStats(params.toolRid);

      return {
        success: true,
        ratingId: rating.id,
        isFlagged: spamCheck.flags.length > 0,
        flagReason: spamCheck.flags.length > 0 ? spamCheck.flags.join(', ') : undefined,
      };
    } catch (error) {
      console.error('Failed to submit rating:', error);
      return {
        success: false,
        error: '提交评分失败，请稍后重试',
      };
    }
  }

  /**
   * 获取工具评分统计
   */
  async getToolRatingStats(toolRid: string): Promise<ToolRatingStats | null> {
    const toolRating = await this.prisma.tool_ratings.findUnique({
      where: { toolRid },
    });

    if (!toolRating) {
      // 如果没有统计记录，返回默认值
      return {
        toolRid,
        totalRatings: 0,
        averageRating: 0,
        weightedAverageRating: 0,
        ratingDistribution: {
          rating5: 0,
          rating4: 0,
          rating3: 0,
          rating2: 0,
          rating1: 0,
        },
        categoryRatings: {
          easeOfUse: null,
          performance: null,
          value: null,
        },
        reviewCount: 0,
      };
    }

    return {
      toolRid: toolRating.toolRid,
      totalRatings: toolRating.totalRatings,
      averageRating: toolRating.averageRating,
      weightedAverageRating: toolRating.weightedAverageRating,
      ratingDistribution: {
        rating5: toolRating.rating5Count,
        rating4: toolRating.rating4Count,
        rating3: toolRating.rating3Count,
        rating2: toolRating.rating2Count,
        rating1: toolRating.rating1Count,
      },
      categoryRatings: {
        easeOfUse: toolRating.averageEaseOfUse,
        performance: toolRating.averagePerformance,
        value: toolRating.averageValue,
      },
      reviewCount: toolRating.reviewCount,
    };
  }

  /**
   * 获取工具评分列表
   */
  async getToolRatings(
    toolRid: string,
    params: {
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
    } = {}
  ): Promise<PaginatedRatings> {
    const { limit = 10, offset = 0, sortBy = 'recent' } = params;

    // 构建排序条件
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'rating_high':
        orderBy = { overallRating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { overallRating: 'asc' };
        break;
    }

    // 获取总数
    const total = await this.prisma.user_ratings.count({
      where: {
        toolRid,
        isFlagged: false,  // 不显示被标记的评分
      },
    });

    // 获取评分列表
    const ratings = await this.prisma.user_ratings.findMany({
      where: {
        toolRid,
        isFlagged: false,
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    return {
      ratings: ratings.map((r) => ({
        id: r.id,
        overallRating: r.overallRating,
        easeOfUseRating: r.easeOfUseRating,
        performanceRating: r.performanceRating,
        valueRating: r.valueRating,
        reviewTitle: r.reviewTitle,
        reviewContent: r.reviewContent,
        pros: r.pros,
        cons: r.cons,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        isVerified: r.isVerified,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * 检查用户是否已评分
   */
  async checkUserRating(
    toolRid: string,
    userId?: string,
    sessionId?: string
  ): Promise<{ hasRated: boolean; rating?: RatingListItem }> {
    let rating = null;

    if (userId) {
      rating = await this.prisma.user_ratings.findUnique({
        where: {
          toolRid_userId: { toolRid, userId },
        },
      });
    }

    if (!rating && sessionId) {
      rating = await this.prisma.user_ratings.findUnique({
        where: {
          toolRid_sessionId: { toolRid, sessionId },
        },
      });
    }

    if (!rating) {
      return { hasRated: false };
    }

    return {
      hasRated: true,
      rating: {
        id: rating.id,
        overallRating: rating.overallRating,
        easeOfUseRating: rating.easeOfUseRating,
        performanceRating: rating.performanceRating,
        valueRating: rating.valueRating,
        reviewTitle: rating.reviewTitle,
        reviewContent: rating.reviewContent,
        pros: rating.pros,
        cons: rating.cons,
        helpfulCount: rating.helpfulCount,
        createdAt: rating.createdAt,
        isVerified: rating.isVerified,
      },
    };
  }

  /**
   * 标记评分有帮助
   */
  async markRatingHelpful(ratingId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.user_ratings.update({
        where: { id: ratingId },
        data: {
          helpfulCount: { increment: 1 },
        },
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * 更新工具聚合评分统计
   */
  private async updateToolRatingStats(toolRid: string): Promise<void> {
    // 获取所有评分
    const ratings = await this.prisma.user_ratings.findMany({
      where: { toolRid },
    });

    if (ratings.length === 0) {
      return;
    }

    // 计算统计值
    const totalRatings = ratings.length;
    const sumRating = ratings.reduce((sum, r) => sum + r.overallRating * r.weight, 0);
    const sumWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;
    const weightedAverageRating = sumWeight > 0 ? sumRating / sumWeight : averageRating;

    // 计算评分分布
    const rating5Count = ratings.filter((r) => r.overallRating === 5).length;
    const rating4Count = ratings.filter((r) => r.overallRating === 4).length;
    const rating3Count = ratings.filter((r) => r.overallRating === 3).length;
    const rating2Count = ratings.filter((r) => r.overallRating === 2).length;
    const rating1Count = ratings.filter((r) => r.overallRating === 1).length;

    // 计算分项评分
    const easeOfUseRatings = ratings.filter((r) => r.easeOfUseRating !== null);
    const performanceRatings = ratings.filter((r) => r.performanceRating !== null);
    const valueRatings = ratings.filter((r) => r.valueRating !== null);

    const averageEaseOfUse = easeOfUseRatings.length > 0
      ? easeOfUseRatings.reduce((sum, r) => sum + (r.easeOfUseRating || 0), 0) / easeOfUseRatings.length
      : null;

    const averagePerformance = performanceRatings.length > 0
      ? performanceRatings.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / performanceRatings.length
      : null;

    const averageValue = valueRatings.length > 0
      ? valueRatings.reduce((sum, r) => sum + (r.valueRating || 0), 0) / valueRatings.length
      : null;

    // 计算有评论的评分数
    const reviewCount = ratings.filter((r) => r.reviewContent).length;

    // 更新或创建统计记录
    await this.prisma.tool_ratings.upsert({
      where: { toolRid },
      create: {
        id: crypto.randomUUID(),
        toolRid,
        totalRatings,
        averageRating,
        weightedAverageRating,
        rating5Count,
        rating4Count,
        rating3Count,
        rating2Count,
        rating1Count,
        averageEaseOfUse,
        averagePerformance,
        averageValue,
        reviewCount,
        updatedAt: new Date(),
      },
      update: {
        totalRatings,
        averageRating,
        weightedAverageRating,
        rating5Count,
        rating4Count,
        rating3Count,
        rating2Count,
        rating1Count,
        averageEaseOfUse,
        averagePerformance,
        averageValue,
        reviewCount,
      },
    });
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let ratingServiceInstance: RatingService | null = null;

export function getRatingService(prisma: PrismaClient): RatingService {
  if (!ratingServiceInstance) {
    ratingServiceInstance = new RatingService(prisma);
  }
  return ratingServiceInstance;
}
