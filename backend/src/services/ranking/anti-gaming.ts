/**
 * Anti-Gaming Service
 * 
 * 防作弊系统
 * 
 * 功能:
 * - 检测异常行为模式
 * - 识别刷量/刷评行为
 * - 限制可疑用户
 * - 数据清洗
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// Types & Constants
// =============================================================================

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 行为类型 */
export type BehaviorType = 
  | 'click_spam'        // 点击刷量
  | 'review_spam'       // 评价刷量
  | 'rating_manipulation' // 评分操纵
  | 'search_abuse'      // 搜索滥用
  | 'compare_abuse'     // 对比滥用
  | 'bookmark_abuse';   // 收藏滥用

/** 用户风险档案 */
export interface UserRiskProfile {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  behaviors: BehaviorType[];
  flags: string[];
  lastActivity: Date;
  activityCount: number;
}

/** 异常检测结果 */
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  behaviors: BehaviorType[];
  flags: string[];
  recommendation: 'allow' | 'throttle' | 'block' | 'review';
}

/** 防作弊配置 */
export interface AntiGamingConfig {
  /** 点击频率阈值 (每分钟) */
  clickRateThreshold: number;
  /** 搜索频率阈值 (每分钟) */
  searchRateThreshold: number;
  /** 评价频率阈值 (每小时) */
  reviewRateThreshold: number;
  /** 相同评分次数阈值 */
  sameRatingThreshold: number;
  /** 短时间对比次数阈值 */
  compareRateThreshold: number;
  /** IP 限制阈值 */
  ipRateThreshold: number;
  /** 会话时长阈值 (秒) */
  sessionDurationThreshold: number;
  /** 是否启用机器学习检测 */
  enableMlDetection: boolean;
}

/** 默认配置 */
const DEFAULT_CONFIG: AntiGamingConfig = {
  clickRateThreshold: 30,        // 每分钟最多 30 次点击
  searchRateThreshold: 20,       // 每分钟最多 20 次搜索
  reviewRateThreshold: 5,        // 每小时最多 5 条评价
  sameRatingThreshold: 10,       // 相同评分最多 10 次
  compareRateThreshold: 15,      // 每小时最多 15 次对比
  ipRateThreshold: 100,          // 每小时每 IP 最多 100 次请求
  sessionDurationThreshold: 5,   // 会话最短 5 秒
  enableMlDetection: false,      // 暂不启用 ML
};

/** 风险等级阈值 */
const RISK_THRESHOLDS = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
  critical: 0.9,
};

// =============================================================================
// Anti-Gaming Class
// =============================================================================

export class AntiGamingService {
  private prisma: PrismaClient;
  private config: AntiGamingConfig;
  private userProfiles: Map<string, UserRiskProfile> = new Map();
  private ipActivityLog: Map<string, number[]> = new Map();

  constructor(prisma: PrismaClient, config: Partial<AntiGamingConfig> = {}) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 定期清理过期数据
    setInterval(() => this.cleanupExpiredData(), 60 * 60 * 1000); // 每小时清理一次
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 检测用户行为是否异常
   */
  async detectAnomaly(params: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    action: string;
    toolRid?: string;
    metadata?: Record<string, any>;
  }): Promise<AnomalyDetectionResult> {
    const { userId, sessionId, ipAddress, action, toolRid, metadata } = params;
    const key = userId || sessionId || ipAddress || 'unknown';
    
    // 获取或创建用户风险档案
    let profile = this.userProfiles.get(key);
    if (!profile) {
      profile = {
        userId,
        sessionId,
        ipAddress,
        riskLevel: 'low',
        riskScore: 0,
        behaviors: [],
        flags: [],
        lastActivity: new Date(),
        activityCount: 0,
      };
      this.userProfiles.set(key, profile);
    }

    // 更新活动计数
    profile.activityCount++;
    profile.lastActivity = new Date();

    // 检测各种异常行为
    const behaviors: BehaviorType[] = [];
    const flags: string[] = [];
    let riskScore = 0;

    // 1. 检测点击刷量
    const clickSpamResult = await this.detectClickSpam(key, action);
    if (clickSpamResult.isSpam) {
      behaviors.push('click_spam');
      flags.push(...clickSpamResult.flags);
      riskScore += 0.3;
    }

    // 2. 检测评价刷量
    if (action === 'review') {
      const reviewSpamResult = await this.detectReviewSpam(key, userId, toolRid);
      if (reviewSpamResult.isSpam) {
        behaviors.push('review_spam');
        flags.push(...reviewSpamResult.flags);
        riskScore += 0.4;
      }
    }

    // 3. 检测评分操纵
    if (action === 'rating' && metadata?.rating) {
      const ratingResult = await this.detectRatingManipulation(key, metadata.rating);
      if (ratingResult.isManipulation) {
        behaviors.push('rating_manipulation');
        flags.push(...ratingResult.flags);
        riskScore += 0.3;
      }
    }

    // 4. 检测搜索滥用
    if (action === 'search') {
      const searchResult = await this.detectSearchAbuse(key);
      if (searchResult.isAbuse) {
        behaviors.push('search_abuse');
        flags.push(...searchResult.flags);
        riskScore += 0.2;
      }
    }

    // 5. 检测对比滥用
    if (action === 'compare') {
      const compareResult = await this.detectCompareAbuse(key);
      if (compareResult.isAbuse) {
        behaviors.push('compare_abuse');
        flags.push(...compareResult.flags);
        riskScore += 0.2;
      }
    }

    // 6. 检测 IP 限制
    if (ipAddress) {
      const ipResult = await this.checkIpRateLimit(ipAddress);
      if (ipResult.isExceeded) {
        flags.push('ip_rate_exceeded');
        riskScore += 0.3;
      }
    }

    // 7. 检测机器人行为
    const botResult = this.detectBotBehavior(profile);
    if (botResult.isBot) {
      flags.push('bot_detected');
      riskScore += 0.5;
    }

    // 更新风险档案
    profile.riskScore = Math.min(1, riskScore);
    profile.riskLevel = this.calculateRiskLevel(profile.riskScore);
    profile.behaviors = behaviors;
    profile.flags = flags;

    // 确定推荐操作
    const recommendation = this.getRecommendation(profile.riskLevel, behaviors);

    return {
      isAnomaly: riskScore > 0.3,
      riskLevel: profile.riskLevel,
      riskScore: profile.riskScore,
      behaviors,
      flags,
      recommendation,
    };
  }

  /**
   * 记录用户活动
   */
  async recordActivity(params: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    action: string;
    toolRid?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { ipAddress } = params;
    
    // 记录 IP 活动
    if (ipAddress) {
      const now = Date.now();
      let activities = this.ipActivityLog.get(ipAddress) || [];
      activities.push(now);
      
      // 只保留最近 1 小时的活动
      activities = activities.filter(t => now - t < 60 * 60 * 1000);
      this.ipActivityLog.set(ipAddress, activities);
    }
  }

  /**
   * 获取用户风险档案
   */
  getUserRiskProfile(userId: string): UserRiskProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * 获取高风险用户列表
   */
  getHighRiskUsers(): UserRiskProfile[] {
    return Array.from(this.userProfiles.values())
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
  }

  /**
   * 清除用户风险记录
   */
  clearUserRisk(userId: string): void {
    this.userProfiles.delete(userId);
  }

  /**
   * 获取统计数据
   */
  getStatistics(): {
    totalUsers: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
    criticalRisk: number;
  } {
    const profiles = Array.from(this.userProfiles.values());
    
    return {
      totalUsers: profiles.length,
      lowRisk: profiles.filter(p => p.riskLevel === 'low').length,
      mediumRisk: profiles.filter(p => p.riskLevel === 'medium').length,
      highRisk: profiles.filter(p => p.riskLevel === 'high').length,
      criticalRisk: profiles.filter(p => p.riskLevel === 'critical').length,
    };
  }

  // ===========================================================================
  // Private Methods - Detection Algorithms
  // ===========================================================================

  /**
   * 检测点击刷量
   */
  private async detectClickSpam(
    key: string,
    action: string
  ): Promise<{ isSpam: boolean; flags: string[] }> {
    const flags: string[] = [];
    let isSpam = false;

    // 检查点击频率
    const profile = this.userProfiles.get(key);
    if (profile && action === 'click') {
      // 如果短时间内有大量活动
      if (profile.activityCount > this.config.clickRateThreshold) {
        flags.push('high_click_rate');
        isSpam = true;
      }
    }

    return { isSpam, flags };
  }

  /**
   * 检测评价刷量
   */
  private async detectReviewSpam(
    key: string,
    userId?: string,
    toolRid?: string
  ): Promise<{ isSpam: boolean; flags: string[] }> {
    const flags: string[] = [];
    let isSpam = false;

    // 检查同一用户对同一工具的重复评价
    if (userId && toolRid) {
      const existingReviews = await this.prisma.user_events.count({
        where: {
          eventType: 'review',
          toolRid,
          metadata: {
            path: ['userId'],
            equals: userId,
          },
        },
      });

      if (existingReviews > 1) {
        flags.push('duplicate_review');
        isSpam = true;
      }
    }

    // 检查评价频率
    const profile = this.userProfiles.get(key);
    if (profile) {
      const reviewCount = profile.behaviors.filter(b => b === 'review_spam').length;
      if (reviewCount > this.config.reviewRateThreshold) {
        flags.push('high_review_rate');
        isSpam = true;
      }
    }

    return { isSpam, flags };
  }

  /**
   * 检测评分操纵
   */
  private async detectRatingManipulation(
    key: string,
    rating: number
  ): Promise<{ isManipulation: boolean; flags: string[] }> {
    const flags: string[] = [];
    let isManipulation = false;

    const profile = this.userProfiles.get(key);
    if (!profile) return { isManipulation, flags };

    // 检查是否总是给相同评分
    const metadata = profile.flags;
    const sameRatingCount = metadata.filter(f => f === `rating_${rating}`).length;
    
    if (sameRatingCount > this.config.sameRatingThreshold) {
      flags.push('repeated_rating_pattern');
      isManipulation = true;
    }

    // 检查极端评分 (全是 1 星或 5 星)
    if (rating === 1 || rating === 5) {
      flags.push('extreme_rating');
    }

    return { isManipulation, flags };
  }

  /**
   * 检测搜索滥用
   */
  private async detectSearchAbuse(
    key: string
  ): Promise<{ isAbuse: boolean; flags: string[] }> {
    const flags: string[] = [];
    let isAbuse = false;

    const profile = this.userProfiles.get(key);
    if (!profile) return { isAbuse, flags };

    // 检查搜索频率
    const searchCount = profile.behaviors.filter(b => b === 'search_abuse').length;
    if (searchCount > this.config.searchRateThreshold) {
      flags.push('high_search_rate');
      isAbuse = true;
    }

    return { isAbuse, flags };
  }

  /**
   * 检测对比滥用
   */
  private async detectCompareAbuse(
    key: string
  ): Promise<{ isAbuse: boolean; flags: string[] }> {
    const flags: string[] = [];
    let isAbuse = false;

    const profile = this.userProfiles.get(key);
    if (!profile) return { isAbuse, flags };

    // 检查对比频率
    const compareCount = profile.behaviors.filter(b => b === 'compare_abuse').length;
    if (compareCount > this.config.compareRateThreshold) {
      flags.push('high_compare_rate');
      isAbuse = true;
    }

    return { isAbuse, flags };
  }

  /**
   * 检查 IP 速率限制
   */
  private async checkIpRateLimit(
    ipAddress: string
  ): Promise<{ isExceeded: boolean }> {
    const activities = this.ipActivityLog.get(ipAddress) || [];
    return {
      isExceeded: activities.length > this.config.ipRateThreshold,
    };
  }

  /**
   * 检测机器人行为
   */
  private detectBotBehavior(profile: UserRiskProfile): { isBot: boolean } {
    // 机器人特征检测
    const { activityCount, lastActivity } = profile;
    
    // 如果活动非常频繁且时间间隔极短
    if (activityCount > 100) {
      const timeSinceFirstActivity = Date.now() - lastActivity.getTime();
      const avgInterval = timeSinceFirstActivity / activityCount;
      
      // 平均间隔小于 100ms，可能是机器人
      if (avgInterval < 100) {
        return { isBot: true };
      }
    }

    return { isBot: false };
  }

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= RISK_THRESHOLDS.critical) return 'critical';
    if (riskScore >= RISK_THRESHOLDS.high) return 'high';
    if (riskScore >= RISK_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * 获取推荐操作
   */
  private getRecommendation(
    riskLevel: RiskLevel,
    behaviors: BehaviorType[]
  ): 'allow' | 'throttle' | 'block' | 'review' {
    // 关键风险直接阻止
    if (riskLevel === 'critical') return 'block';
    
    // 高风险需要人工审核
    if (riskLevel === 'high') return 'review';
    
    // 中风险限流
    if (riskLevel === 'medium') return 'throttle';
    
    // 检测到特定行为也需要处理
    if (behaviors.includes('review_spam') || behaviors.includes('rating_manipulation')) {
      return 'review';
    }

    return 'allow';
  }

  /**
   * 清理过期数据
   */
  private cleanupExpiredData(): void {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 小时

    // 清理用户档案
    for (const [key, profile] of this.userProfiles.entries()) {
      if (now - profile.lastActivity.getTime() > expirationTime) {
        this.userProfiles.delete(key);
      }
    }

    // 清理 IP 活动日志
    for (const [ip, activities] of this.ipActivityLog.entries()) {
      const filtered = activities.filter(t => now - t < 60 * 60 * 1000);
      if (filtered.length === 0) {
        this.ipActivityLog.delete(ip);
      } else {
        this.ipActivityLog.set(ip, filtered);
      }
    }
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let antiGamingInstance: AntiGamingService | null = null;

export function getAntiGamingService(
  prisma: PrismaClient,
  config?: Partial<AntiGamingConfig>
): AntiGamingService {
  if (!antiGamingInstance) {
    antiGamingInstance = new AntiGamingService(prisma, config);
  }
  return antiGamingInstance;
}

export default AntiGamingService;
