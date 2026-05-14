/**
 * Anti-Spam Service
 * 
 * 防刷服务 - 检测和防止恶意评分行为
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface AntiSpamContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  toolRid: string;
}

export interface AntiSpamResult {
  isAllowed: boolean;
  reason?: string;
  weight: number;  // 评分权重 (0-1, 可疑评分降低权重)
  flags: string[];  // 标记的问题
}

export interface SpamCheckConfig {
  maxRatingsPerHour: number;
  maxRatingsPerDay: number;
  minTimeBetweenRatings: number;  // 最小评分间隔 (毫秒)
  duplicateContentThreshold: number;  // 重复内容相似度阈值 (0-1)
  suspiciousIpPatterns: string[];  // 可疑 IP 模式
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: SpamCheckConfig = {
  maxRatingsPerHour: 10,
  maxRatingsPerDay: 30,
  minTimeBetweenRatings: 5000,  // 5 秒
  duplicateContentThreshold: 0.8,
  suspiciousIpPatterns: [
    // 已知的代理/VPN IP 段可以在这里添加
  ],
};

// =============================================================================
// Anti-Spam Service Class
// =============================================================================

export class AntiSpamService {
  private prisma: PrismaClient;
  private config: SpamCheckConfig;

  constructor(prisma: PrismaClient, config: Partial<SpamCheckConfig> = {}) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检查是否允许评分
   */
  async checkRatingAllowed(context: AntiSpamContext): Promise<AntiSpamResult> {
    const flags: string[] = [];
    let weight = 1.0;

    // 1. 检查重复评分
    const duplicateCheck = await this.checkDuplicateRating(context);
    if (!duplicateCheck.isAllowed) {
      return {
        isAllowed: false,
        reason: duplicateCheck.reason,
        weight: 0,
        flags: ['duplicate_rating'],
      };
    }

    // 2. 检查评分速度
    const speedCheck = await this.checkRatingSpeed(context);
    if (!speedCheck.isAllowed) {
      return {
        isAllowed: false,
        reason: speedCheck.reason,
        weight: 0,
        flags: ['rate_limit_exceeded'],
      };
    }
    if (speedCheck.isWarning) {
      flags.push('high_rating_frequency');
      weight *= 0.8;  // 高频评分降低权重
    }

    // 3. 检查 IP 可疑行为
    const ipCheck = await this.checkIpBehavior(context);
    if (ipCheck.isSuspicious) {
      flags.push('suspicious_ip');
      weight *= 0.5;
    }

    // 4. 检查会话可疑行为
    const sessionCheck = await this.checkSessionBehavior(context);
    if (sessionCheck.isSuspicious) {
      flags.push('suspicious_session');
      weight *= 0.6;
    }

    // 5. 检查用户历史行为
    if (context.userId) {
      const userCheck = await this.checkUserBehavior(context);
      if (userCheck.isSuspicious) {
        flags.push('suspicious_user_pattern');
        weight *= 0.7;
      }
    }

    return {
      isAllowed: true,
      weight: Math.max(weight, 0.1),  // 最低权重 0.1
      flags,
    };
  }

  /**
   * 检查评论内容是否重复
   */
  async checkDuplicateContent(
    toolRid: string,
    content: string,
    title?: string
  ): Promise<{ isDuplicate: boolean; similarRatingId?: string }> {
    if (!content && !title) {
      return { isDuplicate: false };
    }

    // 获取该工具的所有评论
    const existingRatings = await this.prisma.user_ratings.findMany({
      where: {
        toolRid,
        reviewContent: { not: null },
      },
      select: {
        id: true,
        reviewContent: true,
        reviewTitle: true,
      },
    });

    for (const rating of existingRatings) {
      // 检查标题相似度
      if (title && rating.reviewTitle) {
        const titleSimilarity = this.calculateSimilarity(title, rating.reviewTitle);
        if (titleSimilarity > this.config.duplicateContentThreshold) {
          return { isDuplicate: true, similarRatingId: rating.id };
        }
      }

      // 检查内容相似度
      if (content && rating.reviewContent) {
        const contentSimilarity = this.calculateSimilarity(content, rating.reviewContent);
        if (contentSimilarity > this.config.duplicateContentThreshold) {
          return { isDuplicate: true, similarRatingId: rating.id };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * 记录评分活动日志
   */
  async logActivity(
    context: AntiSpamContext,
    actionType: string,
    metadata: Record<string, any> = {},
    isSuspicious: boolean = false
  ): Promise<void> {
    await this.prisma.rating_activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        toolRid: context.toolRid,
        actionType,
        metadata,
        isSuspicious,
      },
    });
  }

  /**
   * 标记可疑评分
   */
  async flagSuspiciousRating(ratingId: string, reason: string): Promise<void> {
    await this.prisma.user_ratings.update({
      where: { id: ratingId },
      data: {
        isFlagged: true,
        flagReason: reason,
        weight: 0.3,  // 可疑评分大幅降低权重
      },
    });
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * 检查重复评分
   */
  private async checkDuplicateRating(
    context: AntiSpamContext
  ): Promise<{ isAllowed: boolean; reason?: string }> {
    // 检查用户是否已评分
    if (context.userId) {
      const existingRating = await this.prisma.user_ratings.findUnique({
        where: {
          toolRid_userId: {
            toolRid: context.toolRid,
            userId: context.userId,
          },
        },
      });

      if (existingRating) {
        return {
          isAllowed: false,
          reason: '您已经对这个工具评分过了',
        };
      }
    }

    // 检查会话是否已评分
    if (context.sessionId) {
      const existingRating = await this.prisma.user_ratings.findUnique({
        where: {
          toolRid_sessionId: {
            toolRid: context.toolRid,
            sessionId: context.sessionId,
          },
        },
      });

      if (existingRating) {
        return {
          isAllowed: false,
          reason: '您已经对这个工具评分过了',
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * 检查评分速度
   */
  private async checkRatingSpeed(
    context: AntiSpamContext
  ): Promise<{ isAllowed: boolean; isWarning: boolean; reason?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 构建查询条件
    const whereConditions: any[] = [];

    if (context.userId) {
      whereConditions.push({ userId: context.userId });
    }
    if (context.sessionId) {
      whereConditions.push({ sessionId: context.sessionId });
    }
    if (context.ipAddress) {
      whereConditions.push({ ipAddress: context.ipAddress });
    }

    if (whereConditions.length === 0) {
      return { isAllowed: true, isWarning: false };
    }

    // 检查每小时评分数量
    const hourlyCount = await this.prisma.user_ratings.count({
      where: {
        OR: whereConditions,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyCount >= this.config.maxRatingsPerHour) {
      return {
        isAllowed: false,
        isWarning: false,
        reason: `评分过于频繁，每小时最多 ${this.config.maxRatingsPerHour} 次评分`,
      };
    }

    // 检查每天评分数量
    const dailyCount = await this.prisma.user_ratings.count({
      where: {
        OR: whereConditions,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (dailyCount >= this.config.maxRatingsPerDay) {
      return {
        isAllowed: false,
        isWarning: false,
        reason: `评分过于频繁，每天最多 ${this.config.maxRatingsPerDay} 次评分`,
      };
    }

    // 检查是否高频评分 (超过阈值的一半)
    const isWarning = hourlyCount >= this.config.maxRatingsPerHour / 2;

    return { isAllowed: true, isWarning };
  }

  /**
   * 检查 IP 可疑行为
   */
  private async checkIpBehavior(
    context: AntiSpamContext
  ): Promise<{ isSuspicious: boolean }> {
    if (!context.ipAddress) {
      return { isSuspicious: false };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // 检查同一 IP 的评分数量
    const ipRatingCount = await this.prisma.user_ratings.count({
      where: {
        ipAddress: context.ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    });

    // 同一 IP 一小时内超过 20 次评分视为可疑
    if (ipRatingCount > 20) {
      return { isSuspicious: true };
    }

    // 检查同一 IP 是否有被标记的可疑评分
    const flaggedCount = await this.prisma.user_ratings.count({
      where: {
        ipAddress: context.ipAddress,
        isFlagged: true,
      },
    });

    if (flaggedCount > 3) {
      return { isSuspicious: true };
    }

    return { isSuspicious: false };
  }

  /**
   * 检查会话可疑行为
   */
  private async checkSessionBehavior(
    context: AntiSpamContext
  ): Promise<{ isSuspicious: boolean }> {
    if (!context.sessionId) {
      return { isSuspicious: false };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // 检查同一会话的评分数量
    const sessionRatingCount = await this.prisma.user_ratings.count({
      where: {
        sessionId: context.sessionId,
        createdAt: { gte: oneHourAgo },
      },
    });

    // 同一会话一小时内超过 15 次评分视为可疑
    if (sessionRatingCount > 15) {
      return { isSuspicious: true };
    }

    return { isSuspicious: false };
  }

  /**
   * 检查用户历史行为
   */
  private async checkUserBehavior(
    context: AntiSpamContext
  ): Promise<{ isSuspicious: boolean }> {
    if (!context.userId) {
      return { isSuspicious: false };
    }

    // 检查用户是否有被标记的可疑评分
    const flaggedCount = await this.prisma.user_ratings.count({
      where: {
        userId: context.userId,
        isFlagged: true,
      },
    });

    if (flaggedCount > 5) {
      return { isSuspicious: true };
    }

    // 检查用户评分是否总是极端评分 (全是 1 星或 5 星)
    const userRatings = await this.prisma.user_ratings.findMany({
      where: { userId: context.userId },
      select: { overallRating: true },
      take: 20,
    });

    if (userRatings.length >= 10) {
      const allExtreme = userRatings.every(
        (r) => r.overallRating === 1 || r.overallRating === 5
      );

      if (allExtreme) {
        return { isSuspicious: true };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * 计算文本相似度 (简单的 Jaccard 相似度)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // 标准化文本
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 1);
    };

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    // Jaccard 相似度
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let antiSpamServiceInstance: AntiSpamService | null = null;

export function getAntiSpamService(prisma: PrismaClient): AntiSpamService {
  if (!antiSpamServiceInstance) {
    antiSpamServiceInstance = new AntiSpamService(prisma);
  }
  return antiSpamServiceInstance;
}
