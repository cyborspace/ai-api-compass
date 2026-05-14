# Phase 2: 动态层实现

> **目标**：实现用户行为追踪系统、热度计算服务和实时 UI 组件
> **前置条件**：Phase 1 数据丰富化完成

---

## 1. 目标

### 1.1 功能目标

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **行为追踪 SDK** | 前端收集用户搜索、点击、对比等行为 | P0 |
| **热度计算服务** | 后端实时计算工具热度 | P0 |
| **实时 UI 组件** | 热度标签、趋势箭头、实时查看人数 | P0 |
| **WebSocket 服务** | 推送实时数据到客户端 | P1 |

### 1.2 数据目标

| 数据项 | 描述 | 目标 |
|--------|------|------|
| **UserBehaviorEvent** | 用户行为事件记录 | 完整 |
| **SearchSession** | 搜索会话数据 | 完整 |
| **ComparisonSession** | 对比会话数据 | 完整 |
| **ToolHeatScore** | 工具热度分数 | 实时 |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                               │
│                     Analytics SDK                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  搜索   │  │  点击   │  │  对比   │  │  收藏   │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       └───────────┴───────────┴───────────┘                    │
│                        │                                       │
│                   事件收集                                      │
│                   批量发送                                      │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTPS POST /api/events
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway                                 │
│                 Rate Limiting + 验证                            │
└─────────────────────────┬─────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Redis     │    │   Kafka     │    │    PG       │
│  热度缓存    │    │  事件队列    │    │  事件归档    │
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Heat Worker │    │ Process     │
│ 热度计算     │    │ Worker      │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └──────────────────┘
                │
                ▼
         ┌─────────────┐
         │   分析面板   │
         └─────────────┘
```

---

## 3. Agent 任务定义

### Agent 1: 行为追踪 SDK

```yaml
name: behavior-sdk-agent
description: 实现前端用户行为收集 SDK
priority: P0

inputs:
  - existing: frontend/src/lib/analytics.ts (如果存在)
  - eventTypes: ['search', 'click', 'view', 'compare', 'bookmark', 'share', 'comment']

outputs:
  - src/lib/analytics/behavior-collector.ts
  - src/lib/analytics/event-types.ts
  - src/lib/analytics/session-manager.ts

tasks:
  - name: implement_collector
    description: 实现 BehaviorCollector 类
    features:
      - 事件批量收集
      - 本地缓冲
      - 离线支持
      - 乐观更新

  - name: implement_session
    description: 实现 SessionManager
    features:
      - 生成 sessionId
      - 关联用户登录
      - 持久化

  - name: implement_events
    description: 定义事件类型和数据结构

acceptance:
  - "SDK 可在任意页面引入并收集行为"
  - "事件延迟 < 100ms"
  - "支持批量发送"
  - "支持离线缓冲"
```

### Agent 2: 热度计算服务

```yaml
name: heat-calculator-agent
description: 实现后端热度计算服务
priority: P0

inputs:
  - eventSchema: UserBehaviorEvent
  - calculationRules: 热度计算规则

outputs:
  - src/services/heat-calculator.ts
  - src/services/heat-scheduler.ts
  - src/lib/analytics/event-validator.ts

tasks:
  - name: implement_calculator
    description: 实现 HeatCalculator
    features:
      - 加权时间衰减算法
      - 多周期热度 (1h, 24h, 7d, 30d)
      - 趋势检测

  - name: implement_scheduler
    description: 实现调度服务
    features:
      - 每 5 分钟更新热度
      - 定时任务调度

  - name: implement_validator
    description: 实现事件验证器
    features:
      - 格式验证
      - 防刷检测

acceptance:
  - "热度计算正确（人工验证）"
  - "更新延迟 < 1 分钟"
  - "支持多周期查询"
```

### Agent 3: 实时 UI 组件

```yaml
name: dynamic-ui-agent
description: 实现动态层 UI 组件
priority: P0

inputs:
  - heatComponents: HeatIndicator, TrendArrow, LiveViewers
  - designSpec: docs/plan/ui-design.md

outputs:
  - src/components/dynamic/HeatBadge.tsx
  - src/components/dynamic/TrendIndicator.tsx
  - src/components/dynamic/LiveViewers.tsx
  - src/components/dynamic/ToolListHeatmap.tsx

tasks:
  - name: implement_heat_badge
    description: 实现热度徽章组件
    features:
      - 6 个热度等级
      - 颜色和图标
      - 排名显示

  - name: implement_trend_indicator
    description: 实现趋势指示器
    features:
      - 上升/下降/稳定
      - 百分比变化

  - name: implement_live_viewers
    description: 实现实时查看人数
    features:
      - WebSocket 连接
      - 脉冲动画

  - name: implement_heatmap
    description: 实现热力图列表
    features:
      - 热度高亮
      - 渐变背景

acceptance:
  - "组件可在工具卡片中使用"
  - "动画流畅"
  - "响应式设计"
```

### Agent 4: WebSocket 服务

```yaml
name: websocket-agent
description: 实现 WebSocket 实时推送服务
priority: P1

inputs:
  - heatData: ToolHeatScore[]
  - clients: WebSocket connections

outputs:
  - src/services/websocket-server.ts
  - src/hooks/useHeatSocket.ts

tasks:
  - name: implement_server
    description: 实现 WebSocket 服务器
    features:
      - 连接管理
      - 房间订阅
      - 广播热度更新

  - name: implement_hook
    description: 实现 React Hook
    features:
      - 连接状态
      - 自动重连
      - 实时数据更新

acceptance:
  - "支持 100+ 并发连接"
  - "延迟 < 500ms"
  - "自动重连"
```

---

## 4. 数据模型

### 4.1 UserBehaviorEvent

```typescript
interface UserBehaviorEvent {
  id: string;
  eventType: 'search' | 'click' | 'view' | 'compare' | 'bookmark' | 'share' | 'comment';
  toolRid?: string;           // 可空的，因为有些事件针对分类
  categoryRid?: string;
  sessionId: string;
  userId?: string;            // 匿名用户可能为空
  timestamp: Date;
  properties: {
    // 搜索事件
    query?: string;
    resultCount?: number;
    clickedRid?: string;
    clickPosition?: number;

    // 点击事件
    clickSource?: 'search' | 'category' | 'recommendation' | 'comparison';
    pageUrl?: string;
    scrollDepth?: number;
    dwellTime?: number;

    // 对比事件
    toolsCompared?: string[];
    dimensions?: string[];
    winnerRid?: string;

    // 收藏事件
    bookmarkAction?: 'add' | 'remove';

    // 分享事件
    platform?: 'copy_link' | 'twitter' | 'wechat' | 'email';
  };
}
```

### 4.2 ToolHeatScore

```typescript
interface ToolHeatScore {
  toolRid: string;
  heatScore1h: number;     // 0-100
  heatScore24h: number;
  heatScore7d: number;
  heatScore30d: number;
  trend1h: 'rising' | 'stable' | 'falling';
  trend24h: 'rising' | 'stable' | 'falling';
  // 点击/搜索/对比/收藏 各维度
  clickCount24h: number;
  searchCount24h: number;
  compareCount24h: number;
  bookmarkCount24h: number;
  lastUpdated: Date;
}
```

---

## 5. 热度计算算法

### 5.1 核心算法

```typescript
class HeatCalculator {
  // 行为权重
  private readonly WEIGHTS = {
    search: 0.15,
    click: 0.30,
    compare: 0.20,
    bookmark: 0.25,
    share: 0.10,
  };

  // 时间衰减
  private readonly DECAY_RATE = 0.95;  // 每小时衰减 5%

  calculateHeatScore(events: UserBehaviorEvent[], periodHours: number = 24): number {
    const now = Date.now();
    let totalScore = 0;

    for (let minute = 0; minute < periodHours * 60; minute++) {
      const bucketStart = now - (minute + 1) * 60 * 1000;
      const bucketEnd = now - minute * 60 * 1000;

      // 获取该时间桶的事件
      const bucketEvents = events.filter(e =>
        e.timestamp.getTime() >= bucketStart &&
        e.timestamp.getTime() < bucketEnd
      );

      // 计算桶内分数
      const bucketScore = bucketEvents.reduce((sum, e) =>
        sum + (this.WEIGHTS[e.eventType] || 0), 0
      );

      // 应用时间衰减
      const decayFactor = Math.pow(this.DECAY_RATE, minute / 60);
      totalScore += bucketScore * decayFactor;
    }

    // 归一化到 0-100
    return Math.min(100, totalScore * 10);
  }

  detectTrend(current: number, previous: number): 'rising' | 'stable' | 'falling' {
    if (previous === 0) return 'rising';
    const delta = ((current - previous) / previous) * 100;

    if (delta > 20) return 'rising';
    if (delta < -20) return 'falling';
    return 'stable';
  }
}
```

### 5.2 热度等级

```typescript
enum HeatLevel {
  FROZEN = 0,      // 0
  LOW = 1,         // 1-20
  MODERATE = 2,    // 21-40
  WARM = 3,        // 41-60
  HOT = 4,         // 61-80
  VIRAL = 5,       // 81-100
}

const HEAT_DISPLAY = {
  [HeatLevel.FROZEN]: { icon: '❄️', label: '冷门', color: '#9CA3AF' },
  [HeatLevel.LOW]: { icon: '🔵', label: '一般', color: '#60A5FA' },
  [HeatLevel.MODERATE]: { icon: '🟡', label: '活跃', color: '#FBBF24' },
  [HeatLevel.WARM]: { icon: '🟠', label: '热门', color: '#F97316' },
  [HeatLevel.HOT]: { icon: '🔴', label: '爆款', color: '#EF4444' },
  [HeatLevel.VIRAL]: { icon: '💥', label: '顶流', color: '#DC2626' },
};
```

---

## 6. 执行计划

### 6.1 Agent 并行执行

```
Agent 1: behavior-sdk-agent      ─┐
Agent 2: heat-calculator-agent  ──┼─ 并行执行
Agent 3: dynamic-ui-agent       ─┘
                    │
                    ▼
          Agent 4: websocket-agent (依赖 1,2,3)
                    │
                    ▼
              集成测试
```

### 6.2 执行命令

```bash
# Phase 2 执行

# 1. 行为追踪 SDK
tsx agents/behavior-sdk.ts

# 2. 热度计算服务
tsx agents/heat-calculator.ts

# 3. UI 组件
tsx agents/dynamic-ui.ts

# 4. WebSocket 服务（可选，先完成前三）
tsx agents/websocket-server.ts
```

---

## 7. 验收标准

### 7.1 功能验收

| 功能 | 验收条件 | 测试方法 |
|------|----------|----------|
| **行为收集** | 搜索/点击/对比事件被记录 | 发送测试事件，检查数据库 |
| **热度计算** | 热度分数随行为变化 | 触发行为，验证分数变化 |
| **UI 组件** | 热度标签正确显示 | 视觉检查 |
| **实时更新** | 热度数据实时变化 | WebSocket 检查 |

### 7.2 性能验收

| 指标 | 目标 | 当前 |
|------|------|------|
| 事件收集延迟 | < 100ms | - |
| 热度更新延迟 | < 1 分钟 | - |
| 并发连接数 | 100+ | - |
| WebSocket 延迟 | < 500ms | - |

### 7.3 端到端测试

```typescript
describe('Phase 2 Dynamic Layer', () => {
  it('搜索行为被记录', async () => {
    await sendSearchEvent('text generation');
    const event = await getLatestEvent('search');
    expect(event.query).toBe('text generation');
  });

  it('点击行为更新热度', async () => {
    const initialHeat = await getToolHeat('claude-3-5-sonnet');
    await sendClickEvent('claude-3-5-sonnet');
    await wait(60000); // 等待热度更新
    const newHeat = await getToolHeat('claude-3-5-sonnet');
    expect(newHeat.heatScore24h).toBeGreaterThan(initialHeat.heatScore24h);
  });

  it('UI 显示正确热度', async () => {
    const { getByText } = render(<ToolCard tool={mockTool} />);
    expect(getByText(/热度/)).toBeTruthy();
  });
});
```

---

## 8. 与 Phase 1 的衔接

### 8.1 数据依赖

```
Phase 1 输出                    Phase 2 依赖
─────────────────────────────────────────
pricing_data.json        →     工具定价用于热度权重
context_window_data.json →     上下文窗口用于能力标签
capabilities_data.json   →     能力标签用于搜索/筛选
```

### 8.2 集成策略

1. Phase 1 完成后，运行数据合并脚本
2. Phase 2 的热度计算基于合并后的完整数据
3. Phase 2 的 UI 组件显示 Phase 1 采集的数据

---

*相关文档: [Phase 1: 数据丰富化](./phase-1-data-enrichment.md) | [Phase 3: 动力层实现](./phase-3-motivation-layer.md)*