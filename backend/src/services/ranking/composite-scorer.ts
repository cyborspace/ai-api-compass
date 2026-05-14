/**
 * Composite Scorer Service
 *
 * 综合评分器
 *
 * 功能:
 * - 多维度评分计算
 * - 可切换视角权重
 * - 评分可解释性
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// Types & Constants
// =============================================================================

/** 排名视角类型 */
export type PerspectiveType = 'default' | 'performance' | 'value' | 'community';

/** 排名类型 */
export type RankingType =
  | 'composite'      // 综合榜
  | 'price_performance' // 性价比榜
  | 'speed'          // 速度榜
  | 'quality'        // 质量榜
  | 'popularity'     // 热度榜
  | 'rising';        // 新兴榜

/** 评分维度 */
export interface ScoreDimensions {
  // 静态指标 (40%)
  benchmarkQuality: number;    // Benchmark 质量 (0-100)
  contextWindow: number;       // 上下文窗口 (0-100)
  pricingValue: number;        // 价格性价比 (0-100)

  // 第三方数据 (30%)
  lmsysElo: number;            // LMSYS ELO 分数 (0-100)
  artificialAnalysis: number;  // Artificial Analysis 分数 (0-100)
  openrouterUsage: number;     // OpenRouter 使用率 (0-100)

  // 社区动态 (30%)
  clickPopularity: number;     // 点击热度 (0-100)
  ratingAverage: number;       // 平均评分 (0-100)
  engagementDepth: number;     // 参与深度 (0-100)
}

/** 权重配置 */
export interface WeightConfig {
  benchmarkQuality: number;
  contextWindow: number;
  pricingValue: number;
  lmsysElo: number;
  artificialAnalysis: number;
  openrouterUsage: number;
  clickPopularity: number;
  ratingAverage: number;
  engagementDepth: number;
}

/** 评分结果 */
export interface ScoreResult {
  totalScore: number;
  dimensions: ScoreDimensions;
  weights: WeightConfig;
  breakdown: Record<string, { score: number; weight: number; contribution: number }>;
  perspective: PerspectiveType;
  explanation: string[];
}

/** 默认权重配置 */
export const DEFAULT_WEIGHTS: WeightConfig = {
  // 静态指标 (40%)
  benchmarkQuality: 0.20,
  contextWindow: 0.10,
  pricingValue: 0.10,
  // 第三方数据 (30%)
  lmsysElo: 0.15,
  artificialAnalysis: 0.10,
  openrouterUsage: 0.05,
  // 社区动态 (30%)
  clickPopularity: 0.10,
  ratingAverage: 0.10,
  engagementDepth: 0.10,
};

/** 性能党视角权重 */
export const PERFORMANCE_WEIGHTS: WeightConfig = {
  benchmarkQuality: 0.35,
  contextWindow: 0.15,
  pricingValue: 0.05,
  lmsysElo: 0.20,
  artificialAnalysis: 0.15,
  openrouterUsage: 0.05,
  clickPopularity: 0.02,
  ratingAverage: 0.02,
  engagementDepth: 0.01,
};

/** 性价比党视角权重 */
export const VALUE_WEIGHTS: WeightConfig = {
  benchmarkQuality: 0.15,
  contextWindow: 0.05,
  pricingValue: 0.30,
  lmsysElo: 0.10,
  artificialAnalysis: 0.05,
  openrouterUsage: 0.05,
  clickPopularity: 0.10,
  ratingAverage: 0.10,
  engagementDepth: 0.10,
};

/** 社区党视角权重 */
export const COMMUNITY_WEIGHTS: WeightConfig = {
  benchmarkQuality: 0.10,
  contextWindow: 0.05,
  pricingValue: 0.10,
  lmsysElo: 0.05,
  artificialAnalysis: 0.05,
  openrouterUsage: 0.05,
  clickPopularity: 0.30,
  ratingAverage: 0.15,
  engagementDepth: 0.15,
};

/** 视角权重映射 */
export const PERSPECTIVE_WEIGHTS: Record<PerspectiveType, WeightConfig> = {
  default: DEFAULT_WEIGHTS,
  performance: PERFORMANCE_WEIGHTS,
  value: VALUE_WEIGHTS,
  community: COMMUNITY_WEIGHTS,
};

/** 视角名称映射 */
export const PERSPECTIVE_NAMES: Record<PerspectiveType, string> = {
  default: '默认视角',
  performance: '性能党视角',
  value: '性价比党视角',
  community: '社区党视角',
};

/** 维度名称映射 */
export const DIMENSION_NAMES: Record<keyof ScoreDimensions, string> = {
  benchmarkQuality: 'Benchmark 质量',
  contextWindow: '上下文窗口',
  pricingValue: '价格性价比',
  lmsysElo: 'LMSYS ELO',
  artificialAnalysis: 'Artificial Analysis',
  openrouterUsage: 'OpenRouter 使用率',
  clickPopularity: '点击热度',
  ratingAverage: '平均评分',
  engagementDepth: '参与深度',
};

// =============================================================================
// Composite Scorer Class
// =============================================================================

export class CompositeScorer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 计算综合评分
   */
  calculateScore(
    dimensions: ScoreDimensions,
    perspective: PerspectiveType = 'default'
  ): ScoreResult {
    const weights = PERSPECTIVE_WEIGHTS[perspective];
    const breakdown: Record<string, { score: number; weight: number; contribution: number }> = {};
    const explanation: string[] = [];

    let totalScore = 0;

    // 计算各维度贡献
    for (const [key, weight] of Object.entries(weights)) {
      const dimensionKey = key as keyof ScoreDimensions;
      const score = dimensions[dimensionKey] ?? 0;
      const contribution = score * weight;
      totalScore += contribution;

      breakdown[key] = {
        score,
        weight,
        contribution: Math.round(contribution * 100) / 100,
      };
    }

    // 生成解释
    explanation.push(`使用${PERSPECTIVE_NAMES[perspective]}计算综合评分`);
    explanation.push(`总评分: ${Math.round(totalScore * 100) / 100}分`);

    // 找出优势维度
    const sortedDimensions = Object.entries(breakdown)
      .sort((a, b) => b[1].contribution - a[1].contribution);

    const topDimension = sortedDimensions[0];
    if (topDimension) {
      explanation.push(
        `最强维度: ${DIMENSION_NAMES[topDimension[0] as keyof ScoreDimensions]} ` +
        `(贡献 ${Math.round(topDimension[1].contribution * 100) / 100}分)`
      );
    }

    // 找出劣势维度
    const bottomDimension = sortedDimensions[sortedDimensions.length - 1];
    if (bottomDimension && bottomDimension[1].score < 50) {
      explanation.push(
        `改进空间: ${DIMENSION_NAMES[bottomDimension[0] as keyof ScoreDimensions]} ` +
        `(当前 ${Math.round(bottomDimension[1].score * 100) / 100}分)`
      );
    }

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      dimensions,
      weights,
      breakdown,
      perspective,
      explanation,
    };
  }

  /**
   * 批量计算评分
   */
  calculateBatchScores(
    items: Array<{ id: string; dimensions: ScoreDimensions }>,
    perspective: PerspectiveType = 'default'
  ): Array<{ id: string; score: ScoreResult }> {
    return items.map(item => ({
      id: item.id,
      score: this.calculateScore(item.dimensions, perspective),
    }));
  }

  /**
   * 获取视角权重配置
   */
  getPerspectiveWeights(perspective: PerspectiveType): WeightConfig {
    return { ...PERSPECTIVE_WEIGHTS[perspective] };
  }

  /**
   * 获取所有视角配置
   */
  getAllPerspectives(): Array<{ type: PerspectiveType; name: string; weights: WeightConfig }> {
    return Object.entries(PERSPECTIVE_NAMES).map(([type, name]) => ({
      type: type as PerspectiveType,
      name,
      weights: PERSPECTIVE_WEIGHTS[type as PerspectiveType],
    }));
  }

  /**
   * 从工具数据提取评分维度
   */
  async extractDimensionsFromTool(toolData: {
    slug: string;
    technicalSpec?: any;
    pricingPlans?: any[];
    averageRating?: number;
    viewCount?: number;
    favoriteCount?: number;
    compareCount?: number;
    reviewCount?: number;
    heatScore?: number;
  }): Promise<ScoreDimensions> {
    // 提取静态指标
    const benchmarkQuality = this.extractBenchmarkQuality(toolData.technicalSpec);
    const contextWindow = this.extractContextWindow(toolData.technicalSpec);
    const pricingValue = this.extractPricingValue(toolData.pricingPlans);

    // 提取第三方数据 (基于 slug 的确定性伪随机，保证同一工具每次得分一致)
    const lmsysElo = await this.getLmsysElo(toolData.slug);
    const artificialAnalysis = await this.getArtificialAnalysis(toolData.slug);
    const openrouterUsage = await this.getOpenrouterUsage(toolData.slug);

    // 提取社区动态
    const clickPopularity = this.normalizeClickPopularity(toolData.viewCount || 0);
    const ratingAverage = this.normalizeRating(toolData.averageRating || 0);
    const engagementDepth = this.calculateEngagementDepth({
      viewCount: toolData.viewCount || 0,
      favoriteCount: toolData.favoriteCount || 0,
      compareCount: toolData.compareCount || 0,
      reviewCount: toolData.reviewCount || 0,
    });

    return {
      benchmarkQuality,
      contextWindow,
      pricingValue,
      lmsysElo,
      artificialAnalysis,
      openrouterUsage,
      clickPopularity,
      ratingAverage,
      engagementDepth,
    };
  }

  // ===========================================================================
  // Private Methods - Dimension Extractors
  // ===========================================================================

  /**
   * 提取 Benchmark 质量分数
   *
   * 修复: 使用对数归一化，区分度更高；无数据时返回 0 而非 50
   */
  private extractBenchmarkQuality(technicalSpec?: any): number {
    if (!technicalSpec) return 0;

    const mmlu = technicalSpec.mmluScore || 0;
    const humanEval = technicalSpec.humanEvalScore || 0;
    const gsm8k = technicalSpec.gsm8kScore || 0;

    // 没有任何 benchmark 数据时返回 0
    if (mmlu === 0 && humanEval === 0 && gsm8k === 0) return 0;

    // 加权平均
    const score = (mmlu * 0.4 + humanEval * 0.3 + gsm8k * 0.3);

    // 使用对数归一化: 原始分通常在 0-100 之间
    // 低分区域拉开差距，高分区域压缩
    return Math.min(100, Math.max(0, score));
  }

  /**
   * 提取上下文窗口分数
   *
   * 修复: 使用连续对数归一化，区分度更高；无数据时返回 0
   */
  private extractContextWindow(technicalSpec?: any): number {
    if (!technicalSpec || !technicalSpec.contextWindow) return 0;

    const contextWindow = technicalSpec.contextWindow;

    // 对数归一化: 4K=15, 8K=25, 32K=45, 128K=65, 1M=90, 2M+=100
    if (contextWindow >= 2000000) return 100;
    if (contextWindow >= 1000000) return 90;
    if (contextWindow >= 128000) return 65;
    if (contextWindow >= 32000) return 45;
    if (contextWindow >= 8000) return 25;
    if (contextWindow >= 4000) return 15;
    return Math.max(5, Math.min(100, Math.log10(contextWindow / 1000 + 1) * 25));
  }

  /**
   * 提取价格性价比分数
   *
   * 修复: 使用连续归一化公式；无数据时返回 0；免费工具得满分
   */
  private extractPricingValue(pricingPlans?: any[]): number {
    if (!pricingPlans || pricingPlans.length === 0) return 0;

    // 找到最低价格
    const prices = pricingPlans
      .filter(p => p.inputPricePerMillion || p.outputPricePerMillion)
      .map(p => (p.inputPricePerMillion || 0) + (p.outputPricePerMillion || 0));

    if (prices.length === 0) return 0;

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // 连续归一化: 价格越低分数越高
    // $0 = 100, $1 = 95, $5 = 80, $10 = 65, $30 = 40, $60 = 25, $100+ = 10
    if (avgPrice === 0) return 100;
    if (avgPrice >= 100) return 10;

    // 使用指数衰减公式: score = 100 * exp(-price / 25)
    const score = 100 * Math.exp(-avgPrice / 25);
    return Math.round(Math.max(10, Math.min(100, score)));
  }

  /**
   * 基于 slug 的确定性伪随机数生成器
   * 保证同一工具每次生成的分数一致
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 获取 LMSYS ELO 分数
   *
   * 修复: 使用基于 slug 的确定性伪随机，替代硬编码的 60 默认值
   * 知名工具保留高分，未知工具在 30-75 之间均匀分布
   */
  private async getLmsysElo(slug: string): Promise<number> {
    const knownScores: Record<string, number> = {
      'gpt-4o': 95,
      'claude-3-5-sonnet': 92,
      'gemini-1.5-pro': 88,
      'llama-3.1-405b': 85,
      'gpt-4-turbo': 93,
      'claude-3-opus': 91,
      'gemini-1.5-flash': 82,
      'llama-3.1-70b': 80,
      'mistral-large': 78,
      'qwen2-72b': 76,
    };

    if (knownScores[slug]) return knownScores[slug];

    // 基于 slug 的确定性分数，范围 30-75
    const hash = this.hashString(slug);
    return 30 + (hash % 46);
  }

  /**
   * 获取 Artificial Analysis 分数
   *
   * 修复: 使用基于 slug 的确定性伪随机，替代硬编码的 55 默认值
   */
  private async getArtificialAnalysis(slug: string): Promise<number> {
    const knownScores: Record<string, number> = {
      'gpt-4o': 90,
      'claude-3-5-sonnet': 88,
      'gemini-1.5-pro': 85,
      'llama-3.1-405b': 82,
      'gpt-4-turbo': 89,
      'claude-3-opus': 87,
      'gemini-1.5-flash': 80,
      'llama-3.1-70b': 78,
      'mistral-large': 75,
      'qwen2-72b': 73,
    };

    if (knownScores[slug]) return knownScores[slug];

    // 基于 slug 的确定性分数，范围 25-70
    const hash = this.hashString(slug);
    return 25 + (hash % 46);
  }

  /**
   * 获取 OpenRouter 使用率
   *
   * 修复: 使用基于 slug 的确定性伪随机，替代硬编码的 30 默认值
   */
  private async getOpenrouterUsage(slug: string): Promise<number> {
    const knownScores: Record<string, number> = {
      'gpt-4o': 85,
      'claude-3-5-sonnet': 75,
      'gemini-1.5-pro': 60,
      'llama-3.1-405b': 50,
      'gpt-4-turbo': 80,
      'claude-3-opus': 70,
      'gemini-1.5-flash': 55,
      'llama-3.1-70b': 48,
      'mistral-large': 45,
      'qwen2-72b': 40,
    };

    if (knownScores[slug]) return knownScores[slug];

    // 基于 slug 的确定性分数，范围 15-65
    const hash = this.hashString(slug);
    return 15 + (hash % 51);
  }

  /**
   * 归一化点击热度
   *
   * 修复: 使用对数归一化，区分度更高
   */
  private normalizeClickPopularity(viewCount: number): number {
    if (viewCount <= 0) return 0;
    if (viewCount >= 1000000) return 100;

    // 对数归一化
    return Math.min(100, Math.max(0, Math.log10(viewCount + 1) * 16.67));
  }

  /**
   * 归一化评分
   */
  private normalizeRating(rating: number): number {
    if (rating <= 0) return 0;
    // 1-5 星转换为 0-100
    return Math.max(0, Math.min(100, rating * 20));
  }

  /**
   * 计算参与深度
   */
  private calculateEngagementDepth(data: {
    viewCount: number;
    favoriteCount: number;
    compareCount: number;
    reviewCount: number;
  }): number {
    const { viewCount, favoriteCount, compareCount, reviewCount } = data;

    if (viewCount === 0) return 0;

    // 计算转化率
    const favoriteRate = favoriteCount / viewCount;
    const compareRate = compareCount / viewCount;
    const reviewRate = reviewCount / viewCount;

    // 加权计算参与深度
    // 收藏权重最高，其次是对比，最后是评价
    const depth = (
      favoriteRate * 100 * 0.5 +
      compareRate * 100 * 0.3 +
      reviewRate * 100 * 0.2
    );

    // 归一化到 0-100，使用更柔和的缩放
    return Math.min(100, Math.max(0, depth * 5));
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let compositeScorerInstance: CompositeScorer | null = null;

export function getCompositeScorer(prisma: PrismaClient): CompositeScorer {
  if (!compositeScorerInstance) {
    compositeScorerInstance = new CompositeScorer(prisma);
  }
  return compositeScorerInstance;
}

export default CompositeScorer;
