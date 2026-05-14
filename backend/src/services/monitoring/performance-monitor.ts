/**
 * Performance Monitor
 *
 * 监控系统性能指标
 */

// =============================================================================
// Types
// =============================================================================

export interface PerformanceMetrics {
  timestamp: number;
  apiLatency: number;
  queryCount: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface QueryMetrics {
  query: string;
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  errors: number;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: number;
}

// =============================================================================
// In-Memory Store (Production should use Redis/TimescaleDB)
// =============================================================================

const metricsHistory: PerformanceMetrics[] = [];
const queryMetrics: Map<string, QueryMetrics> = new Map();
const slowQueries: SlowQuery[] = [];

const MAX_HISTORY = 1000;
const SLOW_QUERY_THRESHOLD = 1000; // ms

// =============================================================================
// Performance Monitor
// =============================================================================

export class PerformanceMonitor {
  private startTime: number = Date.now();

  /**
   * 记录 API 请求
   */
  recordRequest(duration: number, isError: boolean): void {
    const now = Date.now();
    const lastMetrics = metricsHistory[metricsHistory.length - 1];

    if (lastMetrics && now - lastMetrics.timestamp < 60000) {
      // 更新当前分钟的指标
      lastMetrics.apiLatency = 
        (lastMetrics.apiLatency * lastMetrics.queryCount + duration) / (lastMetrics.queryCount + 1);
      lastMetrics.queryCount++;
      if (isError) {
        lastMetrics.errorRate = (lastMetrics.errorRate * (lastMetrics.queryCount - 1) + 1) / lastMetrics.queryCount;
      }
    } else {
      // 创建新分钟的指标
      metricsHistory.push({
        timestamp: now,
        apiLatency: duration,
        queryCount: 1,
        errorRate: isError ? 1 : 0,
        activeConnections: 0,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsage: process.cpuUsage().user / 1000000,
      });

      // 限制历史记录数量
      if (metricsHistory.length > MAX_HISTORY) {
        metricsHistory.shift();
      }
    }
  }

  /**
   * 记录查询性能
   */
  recordQuery(query: string, duration: number, isError: boolean): void {
    const existing = queryMetrics.get(query);

    if (existing) {
      existing.count++;
      existing.avgDuration = 
        (existing.avgDuration * (existing.count - 1) + duration) / existing.count;
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.minDuration = Math.min(existing.minDuration, duration);
      if (isError) existing.errors++;
    } else {
      queryMetrics.set(query, {
        query,
        count: 1,
        avgDuration: duration,
        maxDuration: duration,
        minDuration: duration,
        errors: isError ? 1 : 0,
      });
    }

    // 记录慢查询
    if (duration > SLOW_QUERY_THRESHOLD) {
      slowQueries.push({
        query,
        duration,
        timestamp: Date.now(),
      });

      // 限制慢查询记录数量
      if (slowQueries.length > 100) {
        slowQueries.shift();
      }
    }
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): PerformanceMetrics {
    const lastMetrics = metricsHistory[metricsHistory.length - 1];
    return lastMetrics || {
      timestamp: Date.now(),
      apiLatency: 0,
      queryCount: 0,
      errorRate: 0,
      activeConnections: 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: 0,
    };
  }

  /**
   * 获取历史指标
   */
  getMetricsHistory(minutes: number = 60): PerformanceMetrics[] {
    const cutoff = Date.now() - minutes * 60000;
    return metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  /**
   * 获取查询统计
   */
  getQueryMetrics(): QueryMetrics[] {
    return Array.from(queryMetrics.values())
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * 获取慢查询
   */
  getSlowQueries(limit: number = 20): SlowQuery[] {
    return slowQueries
      .slice(-limit)
      .reverse();
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  } {
    return {
      uptime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }
}

// =============================================================================
// Singleton
// =============================================================================

let monitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitor) {
    monitor = new PerformanceMonitor();
  }
  return monitor;
}
