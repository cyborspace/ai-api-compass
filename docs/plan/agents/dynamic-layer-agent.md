# 动态层 Agent

> **任务**：实现用户行为追踪、热度计算和实时 UI 组件
> **前置条件**：Phase 1 数据丰富化完成

---

## Agent 信息

```yaml
name: dynamic-layer-agent
type: general_purpose_task
priority: P0
timeout: 60 minutes
parallel: true

sub_agents:
  - behavior-sdk-agent
  - heat-calculator-agent
  - dynamic-ui-agent
```

---

## Sub-Agent 1: 行为追踪 SDK

### 任务定义

```yaml
name: behavior-sdk-agent
description: 实现前端用户行为收集 SDK
output_dir: src/lib/analytics
files:
  - behavior-collector.ts
  - event-types.ts
  - session-manager.ts
```

### 实现规范

#### BehaviorCollector

```typescript
// src/lib/analytics/behavior-collector.ts
class BehaviorCollector {
  private queue: BehaviorEvent[] = [];
  private flushInterval = 5000;
  private maxQueueSize = 20;
  private sessionId: string;
  private isOnline = true;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushTimer();
    this.setupVisibilityHandler();
    this.setupOnlineListener();
  }

  // 追踪方法
  track(eventType: EventType, properties: Record<string, any> = {}) {
    const event: BehaviorEvent = {
      eventType,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userId: this.getUserId(),
      properties: {
        ...properties,
        pageUrl: window.location.href,
        referrer: document.referrer,
        deviceType: this.getDeviceType(),
      },
    };

    this.queueEvent(event);

    // 乐观更新热度（如果可用）
    this.optimisticallyUpdateHeat(eventType, properties.toolRid);
  }

  // 快捷方法
  trackSearch(query: string, resultCount: number) {
    this.track('search', { query, resultCount });
  }

  trackClick(toolRid: string, source: string) {
    this.track('click', { toolRid, clickSource: source });
  }

  trackCompare(toolRids: string[], winnerRid?: string) {
    this.track('compare', { toolsCompared: toolRids, winnerRid });
  }

  trackBookmark(toolRid: string, action: 'add' | 'remove') {
    this.track('bookmark', { toolRid, bookmarkAction: action });
  }

  trackShare(toolRid: string, platform: string) {
    this.track('share', { toolRid, platform });
  }
}

// 事件类型
type EventType = 'search' | 'click' | 'view' | 'compare' | 'bookmark' | 'share' | 'comment';

// 单例导出
export const analytics = new BehaviorCollector();

// React Hook
export function useAnalytics() {
  return useMemo(() => ({
    trackSearch: (query: string, resultCount: number) =>
      analytics.trackSearch(query, resultCount),
    trackClick: (toolRid: string, source: string) =>
      analytics.trackClick(toolRid, source),
    trackCompare: (toolRids: string[], winnerRid?: string) =>
      analytics.trackCompare(toolRids, winnerRid),
    trackBookmark: (toolRid: string, action: 'add' | 'remove') =>
      analytics.trackBookmark(toolRid, action),
    trackShare: (toolRid: string, platform: string) =>
      analytics.trackShare(toolRid, platform),
  }), []);
}
```

### 验收标准

- [ ] `analytics.trackSearch('text', 10)` 成功发送事件
- [ ] `analytics.trackClick('tool-rid', 'search')` 成功发送事件
- [ ] 事件批量发送，减少网络请求
- [ ] 离线时事件缓冲，恢复后发送

---

## Sub-Agent 2: 热度计算服务

### 任务定义

```yaml
name: heat-calculator-agent
description: 实现后端热度计算服务
output_dir: src/services
files:
  - heat-calculator.ts
  - heat-scheduler.ts
  - event-validator.ts
```

### 实现规范

#### HeatCalculator

```typescript
// src/services/heat-calculator.ts
interface HeatConfig {
  weights: Record<EventType, number>;
  decayRate: number;
  decayInterval: number;  // 分钟
}

const DEFAULT_CONFIG: HeatConfig = {
  weights: {
    search: 0.15,
    click: 0.30,
    compare: 0.20,
    bookmark: 0.25,
    share: 0.10,
    view: 0.05,
    comment: 0.15,
  },
  decayRate: 0.95,  // 每小时衰减 5%
  decayInterval: 60,
};

class HeatCalculator {
  private config: HeatConfig;

  constructor(config: Partial<HeatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  calculateHeatScore(events: BehaviorEvent[], periodHours: number = 24): number {
    const now = Date.now();
    const periodMs = periodHours * 60 * 60 * 1000;
    let totalScore = 0;

    for (let minute = 0; minute < periodHours * 60; minute++) {
      const bucketStart = now - (minute + 1) * 60 * 1000;
      const bucketEnd = now - minute * 60 * 1000;

      const bucketEvents = events.filter(e =>
        e.timestamp.getTime() >= bucketStart &&
        e.timestamp.getTime() < bucketEnd
      );

      const bucketScore = bucketEvents.reduce((sum, e) =>
        sum + (this.config.weights[e.eventType] || 0), 0
      );

      const decayFactor = Math.pow(
        this.config.decayRate,
        minute / 60
      );

      totalScore += bucketScore * decayFactor;
    }

    return Math.min(100, totalScore * 10);
  }

  calculateTrend(current: number, previous: number): Trend {
    if (previous === 0) return 'rising';
    const delta = ((current - previous) / previous) * 100;

    if (delta > 20) return 'rising';
    if (delta < -20) return 'falling';
    return 'stable';
  }

  getHeatLevel(score: number): HeatLevel {
    if (score === 0) return HeatLevel.FROZEN;
    if (score <= 20) return HeatLevel.LOW;
    if (score <= 40) return HeatLevel.MODERATE;
    if (score <= 60) return HeatLevel.WARM;
    if (score <= 80) return HeatLevel.HOT;
    return HeatLevel.VIRAL;
  }
}
```

#### HeatService

```typescript
// src/services/heat-calculator.ts
class HeatService {
  private calculator: HeatCalculator;
  private cache: Map<string, ToolHeatScore>;
  private updateInterval = 5 * 60 * 1000; // 5 分钟

  constructor() {
    this.calculator = new HeatCalculator();
    this.cache = new Map();
  }

  async calculateAllHeats(): Promise<Map<string, ToolHeatScore>> {
    const events = await this.getRecentEvents(24 * 60);  // 24 小时内
    const toolGroups = this.groupEventsByTool(events);

    const results = new Map<string, ToolHeatScore>();

    for (const [toolRid, toolEvents] of toolGroups) {
      const heat1h = this.calculator.calculateHeatScore(toolEvents, 1);
      const heat24h = this.calculator.calculateHeatScore(toolEvents, 24);
      const heat7d = this.calculator.calculateHeatScore(toolEvents, 168);

      const heatScores = await this.getHistoricalScores(toolRid);
      const trend24h = this.calculator.calculateTrend(heat24h, heatScores.yesterday);

      results.set(toolRid, {
        toolRid,
        heatScore1h: heat1h,
        heatScore24h: heat24h,
        heatScore7d: heat7d,
        trend24h,
        lastUpdated: new Date(),
      });
    }

    // 更新缓存
    this.cache = results;

    // 保存到数据库
    await this.saveToDatabase(results);

    return results;
  }

  async getToolHeat(toolRid: string): Promise<ToolHeatScore | null> {
    // 先检查缓存
    if (this.cache.has(toolRid)) {
      return this.cache.get(toolRid);
    }

    // 从数据库获取
    return await this.getFromDatabase(toolRid);
  }
}
```

### 验收标准

- [ ] 热度分数计算正确（可人工验证）
- [ ] 趋势检测准确
- [ ] 缓存机制有效
- [ ] 定时更新正常工作

---

## Sub-Agent 3: 动态层 UI 组件

### 任务定义

```yaml
name: dynamic-ui-agent
description: 实现动态层 UI 组件
output_dir: src/components/dynamic
files:
  - HeatBadge.tsx
  - TrendIndicator.tsx
  - LiveViewers.tsx
  - ToolListHeatmap.tsx
  - index.ts
```

### 实现规范

#### HeatBadge

```tsx
// src/components/dynamic/HeatBadge.tsx
import React from 'react';
import { HeatLevel, getHeatDisplay } from '../lib/analytics';

interface HeatBadgeProps {
  score: number;
  period?: '1h' | '24h' | '7d';
  showRank?: boolean;
  rank?: number;
}

export const HeatBadge: React.FC<HeatBadgeProps> = ({
  score,
  period = '24h',
  showRank = false,
  rank,
}) => {
  const level = getHeatLevel(score);
  const display = getHeatDisplay(level);

  return (
    <div
      className={`heat-badge heat-${level}`}
      style={{ backgroundColor: display.bg, color: display.color }}
    >
      <span className="heat-icon">{display.icon}</span>
      <span className="heat-label">{display.label}</span>

      {showRank && rank && (
        <span className="heat-rank">
          第 {rank} 热
        </span>
      )}
    </div>
  );
};
```

#### TrendIndicator

```tsx
// src/components/dynamic/TrendIndicator.tsx
import React from 'react';

interface TrendIndicatorProps {
  trend: 'rising' | 'falling' | 'stable';
  delta: number;
  size?: 'small' | 'medium' | 'large';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  delta,
  size = 'medium',
}) => {
  if (trend === 'rising') {
    return (
      <span className={`trend trend-up size-${size}`}>
        <TrendingUpIcon />
        +{delta.toFixed(1)}%
      </span>
    );
  }

  if (trend === 'falling') {
    return (
      <span className={`trend trend-down size-${size}`}>
        <TrendingDownIcon />
        -{delta.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="trend trend-stable">
      —
    </span>
  );
};
```

#### LiveViewers

```tsx
// src/components/dynamic/LiveViewers.tsx
import { useEffect, useState } from 'react';

interface LiveViewersProps {
  toolRid: string;
}

export const LiveViewers: React.FC<LiveViewersProps> = ({ toolRid }) => {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // WebSocket 连接
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/live/${toolRid}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setViewers(data.viewers);
    };

    ws.onclose = () => {
      // 自动重连
      setTimeout(() => {}, 5000);
    };

    return () => ws.close();
  }, [toolRid]);

  return (
    <div className="live-viewers">
      <span className="pulse-indicator" />
      <span>{viewers} 人正在浏览</span>
    </div>
  );
};
```

### 验收标准

- [ ] HeatBadge 正确显示 6 个热度等级
- [ ] TrendIndicator 正确显示上升/下降/稳定
- [ ] LiveViewers 正确连接 WebSocket 并显示人数
- [ ] 所有组件响应式设计

---

## 集成验证

### 测试用例

```typescript
// tests/dynamic-layer.test.ts
describe('Dynamic Layer', () => {
  describe('BehaviorCollector', () => {
    it('收集搜索事件', async () => {
      analytics.trackSearch('text generation', 15);
      const event = await getLatestEvent('search');
      expect(event.query).toBe('text generation');
    });

    it('收集点击事件', async () => {
      analytics.trackClick('claude-3-5-sonnet', 'search');
      const event = await getLatestEvent('click');
      expect(event.toolRid).toBe('claude-3-5-sonnet');
    });

    it('批量发送', async () => {
      // 触发多个事件
      for (let i = 0; i < 20; i++) {
        analytics.trackClick(`tool-${i}`, 'search');
      }

      // 等待批量发送
      await wait(1000);
      const batch = await getLatestBatch();
      expect(batch.events.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('HeatCalculator', () => {
    it('正确计算热度分数', () => {
      const events = generateTestEvents(100, 'click');
      const score = calculator.calculateHeatScore(events, 24);
      expect(score).toBeGreaterThan(0);
    });

    it('时间衰减正确', () => {
      const recentEvents = generateTestEvents(50, 'click', Date.now());
      const oldEvents = generateTestEvents(50, 'click', Date.now() - 12 * 60 * 60 * 1000);

      const recentScore = calculator.calculateHeatScore([...recentEvents, ...oldEvents], 24);
      const oldOnlyScore = calculator.calculateHeatScore(oldEvents, 24);

      expect(recentScore).toBeGreaterThan(oldOnlyScore);
    });

    it('趋势检测正确', () => {
      expect(calculator.calculateTrend(100, 50)).toBe('rising');
      expect(calculator.calculateTrend(50, 100)).toBe('falling');
      expect(calculator.calculateTrend(100, 95)).toBe('stable');
    });
  });

  describe('UI Components', () => {
    it('HeatBadge 显示正确', () => {
      const { getByText } = render(<HeatBadge score={75} />);
      expect(getByText(/热门/)).toBeTruthy();
    });

    it('TrendIndicator 显示上升', () => {
      const { getByText } = render(<TrendIndicator trend="rising" delta={25} />);
      expect(getByText(/\+25.0%/)).toBeTruthy();
    });
  });
});
```

---

*相关文档: [Phase 2: 动态层实现](../phase-2-dynamic-layer.md)*