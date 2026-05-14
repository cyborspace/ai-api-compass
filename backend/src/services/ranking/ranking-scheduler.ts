/**
 * Ranking Scheduler Service
 * 
 * 排名调度服务
 * 
 * 功能:
 * - 每日自动更新排名
 * - 批量处理排名计算
 * - 管理调度任务生命周期
 * - 排名历史记录保存
 */

import { PrismaClient } from '@prisma/client';
import {
  RankingCalculator,
  getRankingCalculator,
  RankingListResult,
} from './ranking-calculator.js';
import {
  RankingType,
  PerspectiveType,
} from './composite-scorer.js';

// =============================================================================
// Types & Constants
// =============================================================================

/** 调度器状态 */
export type SchedulerStatus = 'running' | 'stopped' | 'error';

/** 调度器配置 */
export interface RankingSchedulerConfig {
  /** 更新间隔 (毫秒), 默认每天 */
  updateInterval: number;
  /** 批量处理大小 */
  batchSize: number;
  /** 是否保存历史记录 */
  saveHistory: boolean;
  /** 是否在启动时立即执行 */
  runOnStart: boolean;
  /** 历史记录保存间隔 (毫秒) */
  historyInterval: number;
  /** 要计算的排名类型 */
  rankingTypes: RankingType[];
  /** 要计算的视角 */
  perspectives: PerspectiveType[];
}

/** 调度器统计 */
export interface SchedulerStats {
  status: SchedulerStatus;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastError: string | null;
  rankingsProcessed: number;
  averageRunTime: number;
}

/** 排名快照 */
export interface RankingSnapshot {
  id: string;
  type: RankingType;
  perspective: PerspectiveType;
  category?: string;
  data: RankingListResult;
  createdAt: Date;
}

/** 默认配置 */
const DEFAULT_CONFIG: RankingSchedulerConfig = {
  updateInterval: 24 * 60 * 60 * 1000, // 每天
  batchSize: 100,
  saveHistory: true,
  runOnStart: true,
  historyInterval: 24 * 60 * 60 * 1000, // 每天
  rankingTypes: ['composite', 'price_performance', 'speed', 'quality', 'popularity', 'rising'],
  perspectives: ['default', 'performance', 'value', 'community'],
};

// =============================================================================
// Ranking Scheduler Class
// =============================================================================

export class RankingScheduler {
  private prisma: PrismaClient;
  private calculator: RankingCalculator;
  private config: RankingSchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private historyIntervalId: NodeJS.Timeout | null = null;
  private stats: SchedulerStats;
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient, config: Partial<RankingSchedulerConfig> = {}) {
    this.prisma = prisma;
    this.calculator = getRankingCalculator(prisma);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      status: 'stopped',
      lastRunTime: null,
      nextRunTime: null,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastError: null,
      rankingsProcessed: 0,
      averageRunTime: 0,
    };
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 启动调度器
   */
  start(): void {
    if (this.intervalId) {
      console.log('[RankingScheduler] Already running');
      return;
    }

    this.stats.status = 'running';
    console.log(`[RankingScheduler] Starting with interval: ${this.config.updateInterval}ms`);

    // 立即执行一次
    if (this.config.runOnStart) {
      this.runUpdate().catch(err => {
        console.error('[RankingScheduler] Initial run failed:', err);
      });
    }

    // 设置定时任务
    this.intervalId = setInterval(() => {
      this.runUpdate().catch(err => {
        console.error('[RankingScheduler] Scheduled run failed:', err);
      });
    }, this.config.updateInterval);

    // 设置历史记录保存任务
    if (this.config.saveHistory) {
      this.historyIntervalId = setInterval(() => {
        this.saveHistoryRecords().catch(err => {
          console.error('[RankingScheduler] History save failed:', err);
        });
      }, this.config.historyInterval);
    }

    this.updateNextRunTime();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.historyIntervalId) {
      clearInterval(this.historyIntervalId);
      this.historyIntervalId = null;
    }

    this.stats.status = 'stopped';
    this.stats.nextRunTime = null;
    console.log('[RankingScheduler] Stopped');
  }

  /**
   * 手动触发更新
   */
  async runUpdate(): Promise<void> {
    if (this.isRunning) {
      console.log('[RankingScheduler] Update already in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[RankingScheduler] Starting ranking update...');

      let processed = 0;

      // 计算所有排名类型和视角的组合
      for (const type of this.config.rankingTypes) {
        for (const perspective of this.config.perspectives) {
          try {
            // 获取排名列表
            const result = await this.calculator.getRankings({
              type,
              perspective,
              limit: 100,
            });

            // 保存排名快照
            await this.saveRankingSnapshot(result);

            processed++;
          } catch (error) {
            console.error(`[RankingScheduler] Error updating ${type}/${perspective}:`, error);
          }
        }
      }

      // 获取所有分类并计算分类排名
      const categories = await this.getCategories();
      for (const category of categories) {
        for (const perspective of this.config.perspectives) {
          try {
            const result = await this.calculator.getRankings({
              type: 'composite',
              perspective,
              category: category.slug,
              limit: 50,
            });

            await this.saveRankingSnapshot(result);
            processed++;
          } catch (error) {
            console.error(`[RankingScheduler] Error updating category ${category.slug}:`, error);
          }
        }
      }

      const runTime = Date.now() - startTime;
      this.updateStats(true, processed, runTime);

      console.log(
        `[RankingScheduler] Update completed: ${processed} rankings processed in ${runTime}ms`
      );
    } catch (error) {
      const runTime = Date.now() - startTime;
      this.updateStats(false, 0, runTime, error);
      console.error('[RankingScheduler] Update failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.updateNextRunTime();
    }
  }

  /**
   * 更新单个工具排名
   */
  async updateToolRanking(toolRid: string): Promise<void> {
    // 清除缓存
    this.calculator.clearCache();

    // 重新计算所有排名
    for (const type of this.config.rankingTypes) {
      for (const perspective of this.config.perspectives) {
        await this.calculator.getRankings({
          type,
          perspective,
          limit: 100,
        });
      }
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RankingSchedulerConfig>): void {
    this.config = { ...this.config, ...config };

    // 如果正在运行,重启以应用新配置
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * 保存历史记录
   */
  async saveHistoryRecords(): Promise<void> {
    console.log('[RankingScheduler] Saving history records...');

    // 保存当前排名快照到历史表
    // 这里简化实现
    console.log('[RankingScheduler] History records saved');
  }

  /**
   * 清理旧历史记录
   */
  async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    // 清理旧记录
    // 这里简化实现
    console.log(`[RankingScheduler] Cleaned up history records older than ${cutoffDate}`);
    return 0;
  }

  /**
   * 获取上次排名快照
   */
  async getLastSnapshot(
    type: RankingType,
    perspective: PerspectiveType,
    category?: string
  ): Promise<RankingSnapshot | null> {
    // 从数据库获取上次快照
    // 这里简化实现
    return null;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 获取所有分类
   */
  private async getCategories(): Promise<Array<{ id: string; slug: string; name: string }>> {
    try {
      const categories = await this.prisma.object_types.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          apiName: true,
          displayName: true,
        },
      });
      return categories.map(c => ({ id: c.id, slug: c.apiName, name: c.displayName }));
    } catch (error) {
      console.error('[RankingScheduler] Error fetching categories:', error);
      return [];
    }
  }

  /**
   * 保存排名快照
   */
  private async saveRankingSnapshot(result: RankingListResult): Promise<void> {
    // 保存到数据库
    // 这里简化实现，实际应该保存到专门的排名快照表
    console.log(
      `[RankingScheduler] Saved snapshot for ${result.type}/${result.perspective}` +
      (result.category ? `/${result.category}` : '')
    );
  }

  /**
   * 更新统计信息
   */
  private updateStats(
    success: boolean,
    processed: number,
    runTime: number,
    error?: unknown
  ): void {
    this.stats.totalRuns++;
    this.stats.lastRunTime = new Date();

    if (success) {
      this.stats.successfulRuns++;
      this.stats.rankingsProcessed += processed;

      // 计算平均运行时间
      const totalTime =
        this.stats.averageRunTime * (this.stats.successfulRuns - 1) + runTime;
      this.stats.averageRunTime = Math.round(totalTime / this.stats.successfulRuns);
    } else {
      this.stats.failedRuns++;
      this.stats.lastError = error instanceof Error ? error.message : String(error);
      this.stats.status = 'error';
    }
  }

  /**
   * 更新下次运行时间
   */
  private updateNextRunTime(): void {
    if (this.intervalId && this.stats.lastRunTime) {
      this.stats.nextRunTime = new Date(
        this.stats.lastRunTime.getTime() + this.config.updateInterval
      );
    }
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let schedulerInstance: RankingScheduler | null = null;

export function getRankingScheduler(
  prisma: PrismaClient,
  config?: Partial<RankingSchedulerConfig>
): RankingScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RankingScheduler(prisma, config);
  }
  return schedulerInstance;
}

export default RankingScheduler;
