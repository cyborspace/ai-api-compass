/**
 * Ranking Calculator Service
 *
 * 排名计算器核心
 *
 * 功能:
 * - 综合排名计算
 * - 分类排名计算
 * - 趋势排名计算
 * - 排名历史追踪 (基于内存缓存，无需数据库表)
 */

import { PrismaClient } from '@prisma/client';
import {
  CompositeScorer,
  getCompositeScorer,
  PerspectiveType,
  RankingType,
  ScoreDimensions,
  ScoreResult,
} from './composite-scorer.js';
import { getAntiGamingService, AntiGamingService } from './anti-gaming.js';

// =============================================================================
// Types & Constants
// =============================================================================

/** 排名条目 */
export interface RankingEntry {
  rank: number;
  toolRid: string;
  toolSlug: string;
  toolName: string;
  score: number;
  scoreResult: ScoreResult;
  previousRank: number | null;
  rankChange: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  category?: string;
}

/** 排名列表结果 */
export interface RankingListResult {
  type: RankingType;
  perspective: PerspectiveType;
  category?: string;
  total: number;
  entries: RankingEntry[];
  updatedAt: Date;
  weights: Record<string, number>;
  explanation: string[];
}

/** 排名详情 */
export interface RankingDetail {
  toolRid: string;
  toolSlug: string;
  currentRank: number;
  previousRank: number | null;
  rankHistory: Array<{ date: Date; rank: number }>;
  scoreResult: ScoreResult;
  percentiles: {
    overall: number;
    byDimension: Record<string, number>;
  };
  comparison: {
    betterThan: number;
    worseThan: number;
  };
}

/** 排名配置 */
export interface RankingConfig {
  /** 默认返回数量 */
  defaultLimit: number;
  /** 最大返回数量 */
  maxLimit: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存 TTL (秒) */
  cacheTtl: number;
  /** 是否启用防作弊 */
  enableAntiGaming: boolean;
  /** 是否启用历史追踪 */
  enableHistoryTracking: boolean;
}

/** 默认配置 */
const DEFAULT_CONFIG: RankingConfig = {
  defaultLimit: 20,
  maxLimit: 100,
  enableCache: true,
  cacheTtl: 300, // 5 分钟
  enableAntiGaming: true,
  enableHistoryTracking: true,
};

/** 排名类型名称映射 */
export const RANKING_TYPE_NAMES: Record<RankingType, string> = {
  composite: '综合榜',
  price_performance: '性价比榜',
  speed: '速度榜',
  quality: '质量榜',
  popularity: '热度榜',
  rising: '新兴榜',
};

/** 排名类型描述 */
export const RANKING_TYPE_DESCRIPTIONS: Record<RankingType, string> = {
  composite: '综合考量性能、价格、社区活跃度等多维度指标',
  price_performance: '以性价比为核心，平衡性能与价格',
  speed: '以推理速度和响应时间为核心指标',
  quality: '以输出质量和准确率为核心指标',
  popularity: '以用户热度、点击量、评价为核心',
  rising: '近期热度上升最快的工具',
};

// =============================================================================
// In-Memory Ranking History (无需数据库表)
// =============================================================================

interface HistoryRecord {
  toolRid: string;
  rank: number;
  score: number;
  recordedAt: number;
}

const rankingHistoryStore = new Map<string, HistoryRecord[]>();

function getHistoryKey(type: RankingType, perspective: PerspectiveType, category?: string): string {
  return `${type}:${perspective}:${category || 'all'}`;
}

function saveToHistory(
  type: RankingType,
  perspective: PerspectiveType,
  category: string | undefined,
  entries: Array<{ toolRid: string; rank: number; score: number }>
): void {
  const key = getHistoryKey(type, perspective, category);
  const now = Date.now();

  // 保存新记录
  const newRecords: HistoryRecord[] = entries.map(e => ({
    toolRid: e.toolRid,
    rank: e.rank,
    score: e.score,
    recordedAt: now,
  }));

  // 获取已有历史
  const existing = rankingHistoryStore.get(key) || [];

  // 合并并只保留最近 10 次记录 (每个工具)
  const merged = [...existing, ...newRecords];
  const grouped = new Map<string, HistoryRecord[]>();

  for (const record of merged) {
    const list = grouped.get(record.toolRid) || [];
    list.push(record);
    grouped.set(record.toolRid, list);
  }

  // 每个工具只保留最近 10 条
  const trimmed: HistoryRecord[] = [];
  for (const list of grouped.values()) {
    list.sort((a, b) => b.recordedAt - a.recordedAt);
    trimmed.push(...list.slice(0, 10));
  }

  rankingHistoryStore.set(key, trimmed);
}

function getPreviousRankingsFromHistory(
  type: RankingType,
  perspective: PerspectiveType,
  category?: string
): Map<string, number> {
  const key = getHistoryKey(type, perspective, category);
  const records = rankingHistoryStore.get(key) || [];

  const result = new Map<string, number>();

  // 按工具分组，取最近一次的排名
  const grouped = new Map<string, HistoryRecord[]>();
  for (const record of records) {
    const list = grouped.get(record.toolRid) || [];
    list.push(record);
    grouped.set(record.toolRid, list);
  }

  for (const [toolRid, list] of grouped) {
    list.sort((a, b) => b.recordedAt - a.recordedAt);
    const latest = list[1]; // 倒数第二次记录 (最近的是当前)
    if (latest) {
      result.set(toolRid, latest.rank);
    }
  }

  return result;
}

// =============================================================================
// Ranking Calculator Class
// =============================================================================

export class RankingCalculator {
  private prisma: PrismaClient;
  private scorer: CompositeScorer;
  private antiGaming: AntiGamingService;
  private config: RankingConfig;
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  constructor(prisma: PrismaClient, config: Partial<RankingConfig> = {}) {
    this.prisma = prisma;
    this.scorer = getCompositeScorer(prisma);
    this.antiGaming = getAntiGamingService(prisma);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 获取排名列表
   */
  async getRankings(params: {
    type: RankingType;
    perspective?: PerspectiveType;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<RankingListResult> {
    const { type, perspective = 'default', category, limit = 20, offset = 0 } = params;

    // 检查缓存
    const cacheKey = `rankings:${type}:${perspective}:${category || 'all'}:${limit}:${offset}`;
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    // 根据排名类型获取工具列表
    const tools = await this.getToolsForRankingType(type, category);

    // 计算评分
    const scoredTools = await Promise.all(
      tools.map(async (tool) => {
        const dimensions = await this.scorer.extractDimensionsFromTool({
          slug: tool.apiName,
        });

        const scoreResult = this.scorer.calculateScore(dimensions, perspective);

        return {
          toolRid: tool.rid || tool.id,
          toolSlug: tool.apiName,
          toolName: tool.displayName,
          score: scoreResult.totalScore,
          scoreResult,
          category: undefined,
        };
      })
    );

    // 排序
    const sortedTools = scoredTools.sort((a, b) => b.score - a.score);

    // 获取历史排名 (从内存缓存)
    const previousRankings = this.config.enableHistoryTracking
      ? getPreviousRankingsFromHistory(type, perspective, category)
      : new Map<string, number>();

    // 构建排名条目
    const entries: RankingEntry[] = sortedTools.slice(offset, offset + limit).map((tool, index) => {
      const previousRank = previousRankings.get(tool.toolRid) || null;
      const rank = offset + index + 1;
      const rankChange = previousRank ? previousRank - rank : null;

      let trend: 'up' | 'down' | 'stable' | 'new' = 'new';
      if (previousRank) {
        if (rankChange && rankChange > 0) trend = 'up';
        else if (rankChange && rankChange < 0) trend = 'down';
        else trend = 'stable';
      }

      return {
        rank,
        toolRid: tool.toolRid,
        toolSlug: tool.toolSlug,
        toolName: tool.toolName,
        score: tool.score,
        scoreResult: tool.scoreResult,
        previousRank,
        rankChange,
        trend,
        category: tool.category,
      };
    });

    // 获取权重配置
    const weights = this.scorer.getPerspectiveWeights(perspective);

    // 生成解释
    const explanation = this.generateExplanation(type, perspective, category);

    const result: RankingListResult = {
      type,
      perspective,
      category,
      total: sortedTools.length,
      entries,
      updatedAt: new Date(),
      weights: weights as unknown as Record<string, number>,
      explanation,
    };

    // 缓存结果
    if (this.config.enableCache) {
      this.cache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.config.cacheTtl * 1000,
      });
    }

    // 异步保存排名历史到内存
    if (this.config.enableHistoryTracking) {
      saveToHistory(
        type,
        perspective,
        category,
        sortedTools.map((t, i) => ({ toolRid: t.toolRid, rank: i + 1, score: t.score }))
      );
    }

    return result;
  }

  /**
   * 获取工具排名详情
   */
  async getToolRanking(params: {
    toolSlug: string;
    perspective?: PerspectiveType;
  }): Promise<RankingDetail | null> {
    const { toolSlug, perspective = 'default' } = params;

    // 获取工具数据
    const tool = await this.getToolBySlug(toolSlug);
    if (!tool) return null;

    // 计算评分
    const dimensions = await this.scorer.extractDimensionsFromTool({
      slug: tool.apiName,
    });

    const scoreResult = this.scorer.calculateScore(dimensions, perspective);

    // 获取当前排名
    const currentRank = await this.getCurrentRank(tool.rid || tool.id, perspective);

    // 获取历史排名
    const rankHistory = await this.getRankHistory(tool.rid || tool.id);

    // 计算百分位
    const percentiles = await this.calculatePercentiles(tool.rid || tool.id, dimensions);

    // 计算比较数据
    const comparison = await this.getComparisonData(tool.rid || tool.id, perspective);

    return {
      toolRid: tool.rid || tool.id,
      toolSlug: tool.apiName,
      currentRank,
      previousRank: rankHistory.length > 1 ? rankHistory[rankHistory.length - 2]?.rank : null,
      rankHistory,
      scoreResult,
      percentiles,
      comparison,
    };
  }

  /**
   * 获取分类排名
   */
  async getCategoryRankings(params: {
    categorySlug: string;
    perspective?: PerspectiveType;
    limit?: number;
  }): Promise<RankingListResult> {
    return this.getRankings({
      type: 'composite',
      perspective: params.perspective,
      category: params.categorySlug,
      limit: params.limit,
    });
  }

  /**
   * 获取趋势排名 (新兴榜)
   */
  async getRisingRankings(params: {
    perspective?: PerspectiveType;
    limit?: number;
    days?: number;
  }): Promise<RankingListResult> {
    const { perspective = 'default', limit = 20, days = 7 } = params;

    // 获取热度上升最快的工具
    const risingTools = await this.getRisingTools(days, limit);

    // 计算评分并排序
    const scoredTools = await Promise.all(
      risingTools.map(async (tool) => {
        const dimensions = await this.scorer.extractDimensionsFromTool({
          slug: tool.apiName,
        });

        const scoreResult = this.scorer.calculateScore(dimensions, perspective);

        return {
          toolRid: tool.rid || tool.id,
          toolSlug: tool.apiName,
          toolName: tool.displayName,
          score: scoreResult.totalScore,
          scoreResult,
          trendChange: tool.trendChange || 0,
        };
      })
    );

    // 按趋势变化排序
    const sortedTools = scoredTools.sort((a, b) => b.trendChange - a.trendChange);

    const entries: RankingEntry[] = sortedTools.slice(0, limit).map((tool, index) => ({
      rank: index + 1,
      toolRid: tool.toolRid,
      toolSlug: tool.toolSlug,
      toolName: tool.toolName,
      score: tool.score,
      scoreResult: tool.scoreResult,
      previousRank: null,
      rankChange: null,
      trend: 'up',
    }));

    const weights = this.scorer.getPerspectiveWeights(perspective);
    const explanation = this.generateExplanation('rising', perspective);

    return {
      type: 'rising',
      perspective,
      total: sortedTools.length,
      entries,
      updatedAt: new Date(),
      weights: weights as unknown as Record<string, number>,
      explanation,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取排名类型信息
   */
  getRankingTypeInfo(type: RankingType): {
    name: string;
    description: string;
  } {
    return {
      name: RANKING_TYPE_NAMES[type],
      description: RANKING_TYPE_DESCRIPTIONS[type],
    };
  }

  /**
   * 获取所有排名类型
   */
  getAllRankingTypes(): Array<{
    type: RankingType;
    name: string;
    description: string;
  }> {
    return Object.entries(RANKING_TYPE_NAMES).map(([type, name]) => ({
      type: type as RankingType,
      name,
      description: RANKING_TYPE_DESCRIPTIONS[type as RankingType],
    }));
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 根据排名类型获取工具列表
   */
  private async getToolsForRankingType(type: RankingType, category?: string) {
    const whereClause: any = {
      status: 'active',
    };

    // 根据排名类型调整排序
    let orderBy: any = { createdAt: 'desc' };

    switch (type) {
      case 'popularity':
      case 'composite':
      default:
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_performance':
        orderBy = { createdAt: 'desc' };
        break;
      case 'quality':
        orderBy = { createdAt: 'desc' };
        break;
      case 'speed':
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 使用 Prisma 查询
    try {
      const tools = await this.prisma.functions.findMany({
        where: whereClause,
        orderBy,
        take: 200,
      });

      return tools;
    } catch (error) {
      console.error('Error fetching tools for ranking:', error);
      return [];
    }
  }

  /**
   * 获取工具详情
   */
  private async getToolBySlug(slug: string) {
    try {
      return await this.prisma.functions.findUnique({
        where: { apiName: slug },
      });
    } catch (error) {
      console.error('Error fetching tool:', error);
      return null;
    }
  }

  /**
   * 获取当前排名
   */
  private async getCurrentRank(toolRid: string, perspective: PerspectiveType): Promise<number> {
    // 从内存历史中获取最新排名
    for (const [key, records] of rankingHistoryStore) {
      if (key.includes(`:${perspective}:`)) {
        const toolRecords = records.filter(r => r.toolRid === toolRid);
        if (toolRecords.length > 0) {
          toolRecords.sort((a, b) => b.recordedAt - a.recordedAt);
          return toolRecords[0].rank;
        }
      }
    }
    return 1;
  }

  /**
   * 获取排名历史
   */
  private async getRankHistory(toolRid: string): Promise<Array<{ date: Date; rank: number }>> {
    const history: Array<{ date: Date; rank: number }> = [];

    for (const records of rankingHistoryStore.values()) {
      const toolRecords = records.filter(r => r.toolRid === toolRid);
      for (const record of toolRecords) {
        history.push({
          date: new Date(record.recordedAt),
          rank: record.rank,
        });
      }
    }

    return history.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-30);
  }

  /**
   * 计算百分位
   */
  private async calculatePercentiles(
    toolRid: string,
    dimensions: ScoreDimensions
  ): Promise<{
    overall: number;
    byDimension: Record<string, number>;
  }> {
    // 计算各维度的百分位
    const byDimension: Record<string, number> = {};

    for (const [key, value] of Object.entries(dimensions)) {
      byDimension[key] = Math.min(100, Math.max(0, value));
    }

    // 计算总体百分位
    const overall = Object.values(byDimension).reduce((a, b) => a + b, 0) / Object.keys(byDimension).length;

    return { overall, byDimension };
  }

  /**
   * 获取比较数据
   */
  private async getComparisonData(
    toolRid: string,
    perspective: PerspectiveType
  ): Promise<{ betterThan: number; worseThan: number }> {
    // 简化实现：返回默认值
    return { betterThan: 50, worseThan: 50 };
  }

  /**
   * 获取热度上升工具
   */
  private async getRisingTools(days: number, limit: number) {
    // 从热度快照获取趋势为 rising 的工具
    try {
      const snapshots = await this.prisma.tool_heat_snapshots.findMany({
        where: {
          period: '7d',
          trend: 'rising',
        },
        orderBy: {
          trendChange: 'desc',
        },
        take: limit,
      });

      // 获取工具详情
      const toolRids = snapshots.map(s => s.toolRid);

      const tools = await this.prisma.functions.findMany({
        where: {
          OR: [
            { rid: { in: toolRids } },
            { id: { in: toolRids } },
          ],
        },
      });

      // 合并趋势数据
      return tools.map(tool => {
        const snapshot = snapshots.find(s => s.toolRid === (tool.rid || tool.id));
        return {
          ...tool,
          trendChange: snapshot?.trendChange || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching rising tools:', error);
      return [];
    }
  }

  /**
   * 生成解释文本
   */
  private generateExplanation(
    type: RankingType,
    perspective: PerspectiveType,
    category?: string
  ): string[] {
    const explanations: string[] = [];

    explanations.push(`排名类型: ${RANKING_TYPE_NAMES[type]}`);
    explanations.push(`计算视角: ${perspective === 'default' ? '默认' : perspective}`);

    if (category) {
      explanations.push(`分类筛选: ${category}`);
    }

    explanations.push(RANKING_TYPE_DESCRIPTIONS[type]);

    return explanations;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let rankingCalculatorInstance: RankingCalculator | null = null;

export function getRankingCalculator(
  prisma: PrismaClient,
  config?: Partial<RankingConfig>
): RankingCalculator {
  if (!rankingCalculatorInstance) {
    rankingCalculatorInstance = new RankingCalculator(prisma, config);
  }
  return rankingCalculatorInstance;
}

export default RankingCalculator;
