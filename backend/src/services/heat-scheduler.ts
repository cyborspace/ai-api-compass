/**
 * Heat Scheduler Service
 * 
 * 热度调度服务
 * 
 * 功能:
 * - 每 5 分钟更新热度
 * - 批量处理工具热度计算
 * - 管理调度任务生命周期
 */

import { PrismaClient } from '@prisma/client';
import {
  HeatCalculator,
  getHeatCalculator,
  HeatPeriod,
  HeatCalculationResult,
} from './heat-calculator.js';

// =============================================================================
// Types & Constants
// =============================================================================

/** 调度器状态 */
export type SchedulerStatus = 'running' | 'stopped' | 'error';

/** 调度器配置 */
export interface SchedulerConfig {
  /** 更新间隔 (毫秒), 默认 5 分钟 */
  updateInterval: number;
  /** 批量处理大小 */
  batchSize: number;
  /** 是否保存历史记录 */
  saveHistory: boolean;
  /** 是否在启动时立即执行 */
  runOnStart: boolean;
  /** 历史记录保存间隔 (毫秒), 默认 1 小时 */
  historyInterval: number;
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
  toolsProcessed: number;
  averageRunTime: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: SchedulerConfig = {
  updateInterval: 5 * 60 * 1000, // 5 分钟
  batchSize: 100,
  saveHistory: true,
  runOnStart: true,
  historyInterval: 60 * 60 * 1000, // 1 小时
};

// =============================================================================
// Heat Scheduler Class
// =============================================================================

export class HeatScheduler {
  private prisma: PrismaClient;
  private calculator: HeatCalculator;
  private config: SchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private historyIntervalId: NodeJS.Timeout | null = null;
  private stats: SchedulerStats;
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient, config: Partial<SchedulerConfig> = {}) {
    this.prisma = prisma;
    this.calculator = getHeatCalculator(prisma);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      status: 'stopped',
      lastRunTime: null,
      nextRunTime: null,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastError: null,
      toolsProcessed: 0,
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
      console.log('[HeatScheduler] Already running');
      return;
    }

    this.stats.status = 'running';
    console.log(`[HeatScheduler] Starting with interval: ${this.config.updateInterval}ms`);

    // 立即执行一次
    if (this.config.runOnStart) {
      this.runUpdate().catch(err => {
        console.error('[HeatScheduler] Initial run failed:', err);
      });
    }

    // 设置定时任务
    this.intervalId = setInterval(() => {
      this.runUpdate().catch(err => {
        console.error('[HeatScheduler] Scheduled run failed:', err);
      });
    }, this.config.updateInterval);

    // 设置历史记录保存任务
    if (this.config.saveHistory) {
      this.historyIntervalId = setInterval(() => {
        this.saveHistoryRecords().catch(err => {
          console.error('[HeatScheduler] History save failed:', err);
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
    console.log('[HeatScheduler] Stopped');
  }

  /**
   * 手动触发更新
   */
  async runUpdate(): Promise<void> {
    if (this.isRunning) {
      console.log('[HeatScheduler] Update already in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[HeatScheduler] Starting heat update...');

      // 获取所有有事件的工具 RID
      const toolRids = await this.getToolsWithEvents();

      if (toolRids.length === 0) {
        console.log('[HeatScheduler] No tools with events found');
        this.updateStats(true, 0, Date.now() - startTime);
        return;
      }

      // 批量处理
      let processed = 0;
      const periods: HeatPeriod[] = ['1h', '24h', '7d', '30d'];

      for (let i = 0; i < toolRids.length; i += this.config.batchSize) {
        const batch = toolRids.slice(i, i + this.config.batchSize);

        for (const period of periods) {
          const results = await this.calculator.calculateBatchHeat(batch, period);

          for (const result of results) {
            await this.calculator.saveHeatSnapshot(result);
            processed++;
          }
        }
      }

      const runTime = Date.now() - startTime;
      this.updateStats(true, processed, runTime);

      console.log(
        `[HeatScheduler] Update completed: ${processed} tools processed in ${runTime}ms`
      );
    } catch (error) {
      const runTime = Date.now() - startTime;
      this.updateStats(false, 0, runTime, error);
      console.error('[HeatScheduler] Update failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
      this.updateNextRunTime();
    }
  }

  /**
   * 更新单个工具热度
   */
  async updateToolHeat(toolRid: string): Promise<Record<HeatPeriod, HeatCalculationResult>> {
    const result = await this.calculator.calculateAllPeriods(toolRid);

    // 保存快照
    for (const period of Object.keys(result.periods) as HeatPeriod[]) {
      await this.calculator.saveHeatSnapshot(result.periods[period]);
    }

    return result.periods;
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
  updateConfig(config: Partial<SchedulerConfig>): void {
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
    console.log('[HeatScheduler] Saving history records...');

    const snapshots = await this.prisma.tool_heat_snapshots.findMany();

    for (const snapshot of snapshots) {
      await this.calculator.saveHeatHistory({
        toolRid: snapshot.toolRid,
        period: snapshot.period as HeatPeriod,
        heatScore: snapshot.heatScore,
        rawScore: snapshot.rawScore,
        eventCount: snapshot.eventCount,
        weightedScore: snapshot.weightedScore,
        decayFactor: snapshot.decayFactor,
        trend: snapshot.trend as any,
        trendChange: snapshot.trendChange,
        previousScore: snapshot.previousScore,
        level: snapshot.level as any,
        levelIcon: snapshot.levelIcon,
        levelLabel: '',
      });
    }

    console.log(`[HeatScheduler] Saved ${snapshots.length} history records`);
  }

  /**
   * 清理旧事件
   */
  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.user_events.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[HeatScheduler] Cleaned up ${result.count} old events`);
    return result.count;
  }

  /**
   * 清理旧历史记录
   */
  async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.tool_heat_history.deleteMany({
      where: {
        recordedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[HeatScheduler] Cleaned up ${result.count} old history records`);
    return result.count;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 获取有事件的工具 RID 列表
   */
  private async getToolsWithEvents(): Promise<string[]> {
    const result = await this.prisma.user_events.findMany({
      distinct: ['toolRid'],
      select: { toolRid: true },
    });

    return result.map(r => r.toolRid);
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
      this.stats.toolsProcessed += processed;

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

let schedulerInstance: HeatScheduler | null = null;

export function getHeatScheduler(
  prisma: PrismaClient,
  config?: Partial<SchedulerConfig>
): HeatScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new HeatScheduler(prisma, config);
  }
  return schedulerInstance;
}

export default HeatScheduler;
