/**
 * Heat Calculator Service
 * 
 * 热度计算核心服务
 * 
 * 功能:
 * - 加权时间衰减算法
 * - 多周期热度计算 (1h/24h/7d/30d)
 * - 趋势检测 (上升/下降/稳定)
 * - 热度等级划分
 */

import { PrismaClient, user_events, tool_heat_snapshots, tool_heat_history } from '@prisma/client';

// =============================================================================
// Types & Constants
// =============================================================================

/** 事件类型 */
export type EventType = 'search' | 'click' | 'compare' | 'bookmark' | 'share';

/** 热度周期 */
export type HeatPeriod = '1h' | '24h' | '7d' | '30d';

/** 趋势类型 */
export type TrendType = 'rising' | 'falling' | 'stable';

/** 热度等级 */
export type HeatLevel = 'FROZEN' | 'LOW' | 'MODERATE' | 'WARM' | 'HOT' | 'VIRAL';

/** 热度等级配置 */
export interface HeatLevelConfig {
  level: HeatLevel;
  icon: string;
  label: string;
  minScore: number;
  maxScore: number;
}

/** 事件权重配置 */
export const EVENT_WEIGHTS: Record<EventType, number> = {
  search: 0.15,
  click: 0.30,
  compare: 0.20,
  bookmark: 0.25,
  share: 0.10,
};

/** 时间衰减率 - 每小时衰减 5% */
export const DECAY_RATE = 0.95;

/** 热度等级配置 */
export const HEAT_LEVELS: HeatLevelConfig[] = [
  { level: 'FROZEN', icon: '❄️', label: '冷门', minScore: 0, maxScore: 0 },
  { level: 'LOW', icon: '🔵', label: '一般', minScore: 1, maxScore: 20 },
  { level: 'MODERATE', icon: '🟡', label: '活跃', minScore: 21, maxScore: 40 },
  { level: 'WARM', icon: '🟠', label: '热门', minScore: 41, maxScore: 60 },
  { level: 'HOT', icon: '🔴', label: '爆款', minScore: 61, maxScore: 80 },
  { level: 'VIRAL', icon: '💥', label: '顶流', minScore: 81, maxScore: 100 },
];

/** 周期配置 (毫秒) */
export const PERIOD_DURATIONS: Record<HeatPeriod, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** 趋势阈值 */
export const TREND_THRESHOLD = {
  rising: 0.1,    // 上升超过 10% 视为上升
  falling: -0.1,  // 下降超过 10% 视为下降
};

/** 事件数据 */
export interface EventData {
  toolRid: string;
  eventType: EventType;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  weight?: number;
}

/** 热度计算结果 */
export interface HeatCalculationResult {
  toolRid: string;
  period: HeatPeriod;
  heatScore: number;
  rawScore: number;
  eventCount: number;
  weightedScore: number;
  decayFactor: number;
  trend: TrendType;
  trendChange: number;
  previousScore: number | null;
  level: HeatLevel;
  levelIcon: string;
  levelLabel: string;
}

/** 批量热度结果 */
export interface BatchHeatResult {
  toolRid: string;
  periods: Record<HeatPeriod, HeatCalculationResult>;
}

// =============================================================================
// Heat Calculator Class
// =============================================================================

export class HeatCalculator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 记录事件
   */
  async recordEvent(event: EventData): Promise<user_events> {
    const weight = event.weight ?? EVENT_WEIGHTS[event.eventType] ?? 1.0;

    return this.prisma.user_events.create({
      data: {
        id: crypto.randomUUID(),
        toolRid: event.toolRid,
        eventType: event.eventType,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.metadata ?? {},
        weight,
      },
    });
  }

  /**
   * 批量记录事件
   */
  async recordEvents(events: EventData[]): Promise<number> {
    const data = events.map(event => ({
      toolRid: event.toolRid,
      eventType: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      metadata: event.metadata ?? {},
      weight: event.weight ?? EVENT_WEIGHTS[event.eventType] ?? 1.0,
    }));

    const result = await this.prisma.user_events.createMany({
      data: data.map(d => ({ ...d, id: crypto.randomUUID() })),
      skipDuplicates: true,
    });

    return result.count;
  }

  /**
   * 计算单个工具的热度
   */
  async calculateHeat(
    toolRid: string,
    period: HeatPeriod
  ): Promise<HeatCalculationResult> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - PERIOD_DURATIONS[period]);

    // 获取周期内的事件
    const events = await this.prisma.user_events.findMany({
      where: {
        toolRid,
        createdAt: {
          gte: periodStart,
        },
      },
    });

    // 计算原始分数
    const rawScore = this.calculateRawScore(events);

    // 计算加权分数
    const weightedScore = this.calculateWeightedScore(events);

    // 计算时间衰减
    const decayFactor = this.calculateDecayFactor(period);
    const decayedScore = weightedScore * decayFactor;

    // 归一化到 0-100
    const heatScore = this.normalizeScore(decayedScore);

    // 获取上次分数用于趋势计算
    const previousSnapshot = await this.prisma.tool_heat_snapshots.findUnique({
      where: {
        toolRid_period: {
          toolRid,
          period,
        },
      },
    });

    const previousScore = previousSnapshot?.heatScore ?? null;

    // 计算趋势
    const { trend, trendChange } = this.calculateTrend(heatScore, previousScore);

    // 确定热度等级
    const { level, icon, label } = this.determineLevel(heatScore);

    return {
      toolRid,
      period,
      heatScore: Math.round(heatScore * 100) / 100,
      rawScore: Math.round(rawScore * 100) / 100,
      eventCount: events.length,
      weightedScore: Math.round(weightedScore * 100) / 100,
      decayFactor: Math.round(decayFactor * 100) / 100,
      trend,
      trendChange: Math.round(trendChange * 100) / 100,
      previousScore,
      level,
      levelIcon: icon,
      levelLabel: label,
    };
  }

  /**
   * 计算工具所有周期的热度
   */
  async calculateAllPeriods(toolRid: string): Promise<BatchHeatResult> {
    const periods: HeatPeriod[] = ['1h', '24h', '7d', '30d'];
    const results: Record<HeatPeriod, HeatCalculationResult> = {} as any;

    for (const period of periods) {
      results[period] = await this.calculateHeat(toolRid, period);
    }

    return {
      toolRid,
      periods: results,
    };
  }

  /**
   * 批量计算多个工具的热度
   */
  async calculateBatchHeat(
    toolRids: string[],
    period: HeatPeriod
  ): Promise<HeatCalculationResult[]> {
    return Promise.all(
      toolRids.map(rid => this.calculateHeat(rid, period))
    );
  }

  /**
   * 保存热度快照
   */
  async saveHeatSnapshot(result: HeatCalculationResult): Promise<tool_heat_snapshots> {
    return this.prisma.tool_heat_snapshots.upsert({
      where: {
        toolRid_period: {
          toolRid: result.toolRid,
          period: result.period,
        },
      },
      update: {
        heatScore: result.heatScore,
        rawScore: result.rawScore,
        eventCount: result.eventCount,
        weightedScore: result.weightedScore,
        decayFactor: result.decayFactor,
        trend: result.trend,
        trendChange: result.trendChange,
        previousScore: result.previousScore,
        level: result.level,
        levelIcon: result.levelIcon,
        calculatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        toolRid: result.toolRid,
        period: result.period,
        heatScore: result.heatScore,
        rawScore: result.rawScore,
        eventCount: result.eventCount,
        weightedScore: result.weightedScore,
        decayFactor: result.decayFactor,
        trend: result.trend,
        trendChange: result.trendChange,
        previousScore: result.previousScore,
        level: result.level,
        levelIcon: result.levelIcon,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 保存热度历史记录
   */
  async saveHeatHistory(result: HeatCalculationResult): Promise<tool_heat_history> {
    return this.prisma.tool_heat_history.create({
      data: {
        id: crypto.randomUUID(),
        toolRid: result.toolRid,
        period: result.period,
        heatScore: result.heatScore,
        eventCount: result.eventCount,
        trend: result.trend,
      },
    });
  }

  /**
   * 获取工具热度
   */
  async getToolHeat(toolRid: string): Promise<BatchHeatResult | null> {
    const snapshots = await this.prisma.tool_heat_snapshots.findMany({
      where: { toolRid },
    });

    if (snapshots.length === 0) {
      return null;
    }

    const periods: Record<HeatPeriod, HeatCalculationResult> = {} as any;

    for (const snapshot of snapshots) {
      periods[snapshot.period as HeatPeriod] = {
        toolRid: snapshot.toolRid,
        period: snapshot.period as HeatPeriod,
        heatScore: snapshot.heatScore,
        rawScore: snapshot.rawScore,
        eventCount: snapshot.eventCount,
        weightedScore: snapshot.weightedScore,
        decayFactor: snapshot.decayFactor,
        trend: snapshot.trend as TrendType,
        trendChange: snapshot.trendChange,
        previousScore: snapshot.previousScore,
        level: snapshot.level as HeatLevel,
        levelIcon: snapshot.levelIcon,
        levelLabel: this.getLevelLabel(snapshot.level as HeatLevel),
      };
    }

    return { toolRid, periods };
  }

  /**
   * 获取热门工具列表
   */
  async getHotTools(
    period: HeatPeriod,
    limit: number = 20,
    offset: number = 0
  ): Promise<HeatCalculationResult[]> {
    const snapshots = await this.prisma.tool_heat_snapshots.findMany({
      where: { period },
      orderBy: { heatScore: 'desc' },
      take: limit,
      skip: offset,
    });

    return snapshots.map(s => ({
      toolRid: s.toolRid,
      period: s.period as HeatPeriod,
      heatScore: s.heatScore,
      rawScore: s.rawScore,
      eventCount: s.eventCount,
      weightedScore: s.weightedScore,
      decayFactor: s.decayFactor,
      trend: s.trend as TrendType,
      trendChange: s.trendChange,
      previousScore: s.previousScore,
      level: s.level as HeatLevel,
      levelIcon: s.levelIcon,
      levelLabel: this.getLevelLabel(s.level as HeatLevel),
    }));
  }

  /**
   * 获取趋势上升工具
   */
  async getRisingTools(
    period: HeatPeriod,
    limit: number = 20
  ): Promise<HeatCalculationResult[]> {
    const snapshots = await this.prisma.tool_heat_snapshots.findMany({
      where: {
        period,
        trend: 'rising',
      },
      orderBy: { trendChange: 'desc' },
      take: limit,
    });

    return snapshots.map(s => ({
      toolRid: s.toolRid,
      period: s.period as HeatPeriod,
      heatScore: s.heatScore,
      rawScore: s.rawScore,
      eventCount: s.eventCount,
      weightedScore: s.weightedScore,
      decayFactor: s.decayFactor,
      trend: s.trend as TrendType,
      trendChange: s.trendChange,
      previousScore: s.previousScore,
      level: s.level as HeatLevel,
      levelIcon: s.levelIcon,
      levelLabel: this.getLevelLabel(s.level as HeatLevel),
    }));
  }

  /**
   * 获取热度历史
   */
  async getHeatHistory(
    toolRid: string,
    period: HeatPeriod,
    days: number = 7
  ): Promise<Array<{ heatScore: number; recordedAt: Date; trend: string }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await this.prisma.tool_heat_history.findMany({
      where: {
        toolRid,
        period,
        recordedAt: {
          gte: startDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    return history.map(h => ({
      heatScore: h.heatScore,
      recordedAt: h.recordedAt,
      trend: h.trend,
    }));
  }

  // ===========================================================================
  // Private Methods - Core Algorithms
  // ===========================================================================

  /**
   * 计算原始分数 (事件数量)
   */
  private calculateRawScore(events: user_events[]): number {
    return events.length;
  }

  /**
   * 计算加权分数
   * 使用事件权重和时间衰减
   */
  private calculateWeightedScore(events: user_events[]): number {
    const now = Date.now();

    return events.reduce((total, event) => {
      // 基础权重
      const baseWeight = EVENT_WEIGHTS[event.eventType as EventType] ?? 1.0;

      // 时间衰减 (基于事件发生时间)
      const eventAge = now - event.createdAt.getTime();
      const hoursSinceEvent = eventAge / (60 * 60 * 1000);
      const timeDecay = Math.pow(DECAY_RATE, hoursSinceEvent);

      // 加权贡献
      return total + (baseWeight * timeDecay * event.weight);
    }, 0);
  }

  /**
   * 计算周期衰减因子
   * 周期越长，衰减越明显
   */
  private calculateDecayFactor(period: HeatPeriod): number {
    const periodHours = PERIOD_DURATIONS[period] / (60 * 60 * 1000);

    // 使用对数衰减，周期越长衰减越大
    // 但保持一定的基准值
    const baseDecay = Math.pow(DECAY_RATE, periodHours / 24);

    // 确保衰减因子在合理范围内
    return Math.max(0.1, Math.min(1.0, baseDecay));
  }

  /**
   * 归一化分数到 0-100
   * 使用 sigmoid 函数进行平滑映射
   */
  private normalizeScore(rawScore: number): number {
    // 使用 sigmoid 函数进行归一化
    // 调整参数使分数分布更合理
    const k = 0.1; // 增长率
    const midpoint = 20; // 中点值

    const sigmoid = 100 / (1 + Math.exp(-k * (rawScore - midpoint)));

    return Math.min(100, Math.max(0, sigmoid));
  }

  /**
   * 计算趋势
   */
  private calculateTrend(
    currentScore: number,
    previousScore: number | null
  ): { trend: TrendType; trendChange: number } {
    if (previousScore === null || previousScore === 0) {
      return { trend: 'stable', trendChange: 0 };
    }

    const change = (currentScore - previousScore) / previousScore;

    if (change >= TREND_THRESHOLD.rising) {
      return { trend: 'rising', trendChange: change };
    } else if (change <= TREND_THRESHOLD.falling) {
      return { trend: 'falling', trendChange: change };
    }

    return { trend: 'stable', trendChange: change };
  }

  /**
   * 确定热度等级
   */
  private determineLevel(score: number): { level: HeatLevel; icon: string; label: string } {
    for (const config of HEAT_LEVELS) {
      if (score >= config.minScore && score <= config.maxScore) {
        return {
          level: config.level,
          icon: config.icon,
          label: config.label,
        };
      }
    }

    // 默认返回最高等级
    const viral = HEAT_LEVELS[HEAT_LEVELS.length - 1];
    return {
      level: viral.level,
      icon: viral.icon,
      label: viral.label,
    };
  }

  /**
   * 获取等级标签
   */
  private getLevelLabel(level: HeatLevel): string {
    const config = HEAT_LEVELS.find(l => l.level === level);
    return config?.label ?? '未知';
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let heatCalculatorInstance: HeatCalculator | null = null;

export function getHeatCalculator(prisma: PrismaClient): HeatCalculator {
  if (!heatCalculatorInstance) {
    heatCalculatorInstance = new HeatCalculator(prisma);
  }
  return heatCalculatorInstance;
}

export default HeatCalculator;
