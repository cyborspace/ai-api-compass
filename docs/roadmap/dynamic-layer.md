# 动态层设计 — 用户行为数据模型与实时反馈机制

> 动态层的核心思想：**用户每一次与系统的交互，都是一次数据注入**。这些行为数据实时反映工具的"热度"状态，让静态的知识图谱"活"起来。

---

## 1. 设计理念

### 1.1 什么是动态层？

```
静态层（对象层）：
  工具的"固有属性" → name, developer, pricing, contextWindow...
  这些数据相对稳定，不会随时间剧烈变化

动态层（动态层）：
  工具的"实时状态" → 今日热度、搜索趋势、对比频率...
  这些数据随用户行为实时变化
```

### 1.2 为什么需要动态层？

1. **实时性**：用户想知道"现在最火的工具是什么"，而不是"历史最佳"
2. **个性化**：基于用户行为推断偏好，提供更精准的推荐
3. **数据闭环**：用户不仅是数据的消费者，也是数据的生产者
4. **趋势发现**：通过热度变化发现新兴工具的机会

### 1.3 动态层的数据来源

| 行为类型 | 数据价值 | 采集难度 |
|----------|----------|----------|
| 🔍 搜索 | 意图信号最强 | 低 |
| 👆 点击 | 兴趣信号 | 低 |
| 📊 对比 | 决策信号 | 中 |
| ⭐ 收藏 | 偏好信号 | 低 |
| 🔗 分享 | 传播信号 | 中 |
| 💬 评论 | 深度反馈 | 高 |

---

## 2. 用户行为数据模型

### 2.1 核心 ObjectType 设计

```
┌─────────────────────────────────────────────────────────────┐
│                    用户行为事件模型                           │
├─────────────────────────────────────────────────────────────┤
│ ObjectType: UserBehaviorEvent                               │
│   ├── Property: eventId (ValueType: string)                │
│   ├── Property: eventType (ValueType: enum)                │
│   │       // search | click | view | compare | bookmark    │
│   │       // share | comment | rate | submit              │
│   ├── Property: timestamp (ValueType: datetime)           │
│   ├── Property: sessionId (ValueType: string)              │
│   ├── Property: userId (ValueType: string, nullable)      │
│   ├── Property: deviceType (ValueType: enum)               │
│   │       // desktop | mobile | tablet                     │
│   ├── Property: context (ValueType: JSON)                  │
│   │       // { query, resultsCount, clickPosition, ... }   │
│   └── Link: actor → User (匿名用户)                        │
│   └── Link: subject → AIGCTool | ToolCategory | Comparison │
├─────────────────────────────────────────────────────────────┤
│ ObjectType: SearchSession                                  │
│   ├── Property: sessionId (ValueType: string)              │
│   ├── Property: query (ValueType: string)                  │
│   ├── Property: filtersApplied (ValueType: JSON)           │
│   ├── Property: resultsCount (ValueType: number)           │
│   ├── Property: clickedToolRid (ValueType: string)         │
│   ├── Property: conversionTime (ValueType: number)         │
│   │       // 从搜索到点击的时间（秒）                        │
│   └── Link: performedBy → User                             │
├─────────────────────────────────────────────────────────────┤
│ ObjectType: ComparisonSession                               │
│   ├── Property: sessionId (ValueType: string)              │
│   ├── Property: toolsCompared (ValueType: JSON array)      │
│   ├── Property: dimensions (ValueType: JSON array)         │
│   │       // ["price", "contextWindow", "capabilities"]     │
│   ├── Property: winnerToolRid (ValueType: string)          │
│   ├── Property: sessionDuration (ValueType: number)        │
│   └── Link: participants → AIGCTool[]                      │
│   └── Link: user → User                                    │
├─────────────────────────────────────────────────────────────┤
│ ObjectType: ToolHeatScore                                  │
│   ├── Property: period (ValueType: enum)                  │
│   │       // 1h | 24h | 7d | 30d                          │
│   ├── Property: clickCount (ValueType: number)             │
│   ├── Property: searchCount (ValueType: number)            │
│   ├── Property: compareCount (ValueType: number)           │
│   ├── Property: bookmarkCount (ValueType: number)          │
│   ├── Property: shareCount (ValueType: number)             │
│   ├── Property: compositeHeatScore (ValueType: number)     │
│   ├── Property: trend (ValueType: enum)                   │
│   │       // rising | stable | falling                     │
│   ├── Property: trendDelta (ValueType: number)            │
│   │       // 相比上一周期的百分比变化                        │
│   ├── Property: lastUpdated (ValueType: datetime)         │
│   └── Link: tracks → AIGCTool                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 事件类型详解

#### 2.2.1 搜索事件 (search)

```typescript
interface SearchEvent {
  eventType: 'search';
  query: string;                    // 搜索关键词
  queryNormalized: string;          // 标准化后的查询（去除大小写/空格）
  filters: {
    category?: string;
    pricing?: 'free' | 'paid' | 'freemium';
    capabilities?: string[];
  };
  resultsShown: number;             // 结果数量
  clickedToolRid?: string;         // 点击的工具（如果有）
  clickPosition?: number;          // 点击位置（第几个结果）
  sessionId: string;
  timestamp: Date;
}
```

**数据价值分析**：
- 查询词 → 用户的真实需求
- 点击位置 → 排名效果评估
- 无点击搜索 → 未满足需求

#### 2.2.2 点击事件 (click)

```typescript
interface ClickEvent {
  eventType: 'click';
  toolRid: string;
  clickSource: 'search' | 'category' | 'recommendation' | 'comparison';
  sourceQuery?: string;             // 来源搜索词
  pageUrl: string;
  scrollDepth: number;              // 页面滚动深度
  dwellTime: number;               // 停留时间（毫秒）
  sessionId: string;
  timestamp: Date;
}
```

**数据价值分析**：
- 来源分布 → 各入口的转化效率
- 停留时间 → 内容质量评估
- 滚动深度 → 页面设计优化

#### 2.2.3 对比事件 (compare)

```typescript
interface CompareEvent {
  eventType: 'compare';
  tools: string[];                 // 对比的工具 RIDs (2-4个)
  dimensions: string[];            // 对比维度
  winnerToolRid?: string;         // 胜出的工具（如果有）
  reason?: string;                 // 选择原因（用户填写）
  sessionId: string;
  timestamp: Date;
}
```

**数据价值分析**：
- 工具配对 → 发现强关联工具
- 维度选择 → 用户决策因素
- 胜出工具 → 竞争优势信号

#### 2.2.4 收藏事件 (bookmark)

```typescript
interface BookmarkEvent {
  eventType: 'bookmark';
  toolRid: string;
  action: 'add' | 'remove';
  folderName?: string;
  userNote?: string;
  sessionId: string;
  timestamp: Date;
}
```

**数据价值分析**：
- 收藏数 → 长期价值认可
- 收藏后移除 → 质量下降或找到替代品

#### 2.2.5 分享事件 (share)

```typescript
interface ShareEvent {
  eventType: 'share';
  toolRid: string;
  platform: 'copy_link' | 'twitter' | 'wechat' | 'email';
  shareContext?: string;           // 用户添加的分享语
  sessionId: string;
  timestamp: Date;
}
```

**数据价值分析**：
- 分享平台 → 用户群体特征
- 分享语 → 产品定位感知

### 2.3 匿名用户处理

```typescript
// Session 管理
class SessionManager {
  // 浏览器端：使用 localStorage + UUID 生成 sessionId
  // 有效期：30天
  // 不需要登录即可贡献数据

  generateSessionId(): string {
    // 检查 localStorage 是否有已保存的 sessionId
    let sessionId = localStorage.getItem('ai_compass_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('ai_compass_session', sessionId);
    }
    return sessionId;
  }

  // 用户登录后：关联匿名 session 数据到用户账户
  linkSessionToUser(anonymousSessionId: string, userId: string) {
    // 合并历史行为数据，提升用户画像完整性
  }
}
```

---

## 3. 热度计算引擎

### 3.1 热度算法设计

```python
class HeatCalculator:
    """
    热度计算采用加权时间衰减算法
    """

    # 行为权重配置
    WEIGHTS = {
        'search': 0.15,      # 搜索命中
        'click': 0.30,      # 点击详情
        'compare': 0.20,    # 加入对比
        'bookmark': 0.25,   # 收藏
        'share': 0.10,      # 分享
    }

    # 时间衰减系数
    DECAY_RATE = 0.95        # 每小时衰减 5%
    DECAY_INTERVAL = 1       # 每小时计算一次

    def calculate_heat_score(self, tool_rid: str, period_hours: int = 24) -> float:
        """
        计算工具的热度分数

        Args:
            tool_rid: 工具的 RID
            period_hours: 统计周期（小时）

        Returns:
            float: 热度分数 (0-100)
        """

        # 1. 获取时间段内的所有事件
        events = self.get_events(tool_rid, period_hours)

        if not events:
            return 0.0

        # 2. 分桶统计（每分钟一个桶）
        buckets = self.bucket_by_minute(events)

        # 3. 计算加权分数
        total_score = 0.0
        now = datetime.now()

        for minute_offset in range(period_hours * 60):
            bucket_time = now - timedelta(minutes=minute_offset)
            bucket_key = self.get_bucket_key(bucket_time)

            # 获取该桶的事件
            bucket_events = buckets.get(bucket_key, [])

            # 计算该桶的权重分数
            bucket_score = self.calculate_bucket_score(bucket_events)

            # 应用时间衰减
            decay_factor = self.DECAY_RATE ** (minute_offset / 60)
            weighted_score = bucket_score * decay_factor

            total_score += weighted_score

        # 4. 归一化到 0-100
        max_possible_score = sum(
            self.WEIGHTS.values() * 60 * 24  # 最大每小时事件数 * 24小时
        )
        normalized_score = (total_score / max_possible_score) * 100

        return min(normalized_score, 100.0)

    def calculate_bucket_score(self, events: List[Event]) -> float:
        """计算单个时间桶的加权分数"""
        score = 0.0
        for event in events:
            score += self.WEIGHTS.get(event.type, 0.0)
        return score

    def detect_trend(self, current_score: float, previous_score: float) -> Tuple[str, float]:
        """检测热度趋势"""
        if previous_score == 0:
            return 'rising', 100.0

        delta = ((current_score - previous_score) / previous_score) * 100

        if delta > 20:
            return 'rising', delta
        elif delta < -20:
            return 'falling', abs(delta)
        else:
            return 'stable', abs(delta)
```

### 3.2 热度等级划分

```typescript
enum HeatLevel {
  FROZEN = 0,        // 0 - 无热度
  LOW = 1,           // 1-20 - 冷门
  MODERATE = 2,      // 21-40 - 一般
  WARM = 3,          // 41-60 - 活跃
  HOT = 4,           // 61-80 - 热门
  VIRAL = 5,         // 81-100 - 爆款
}

// UI 显示映射
const HEAT_DISPLAY = {
  [HeatLevel.FROZEN]: { icon: '❄️', label: '冷门', color: '#9CA3AF' },
  [HeatLevel.LOW]: { icon: '🔵', label: '一般', color: '#60A5FA' },
  [HeatLevel.MODERATE]: { icon: '🟡', label: '活跃', color: '#FBBF24' },
  [HeatLevel.WARM]: { icon: '🟠', label: '热门', color: '#F97316' },
  [HeatLevel.HOT]: { icon: '🔴', label: '爆款', color: '#EF4444' },
  [HeatLevel.VIRAL]: { icon: '💥', label: '顶流', color: '#DC2626' },
};
```

### 3.3 多周期热度

```typescript
interface MultiPeriodHeat {
  toolRid: string;
  heat1h: number;     // 1小时热度
  heat24h: number;     // 24小时热度
  heat7d: number;      // 7天热度
  heat30d: number;     // 30天热度
  trend1h: Trend;      // 1小时趋势
  trend24h: Trend;     // 24小时趋势
  lastUpdated: Date;
}
```

---

## 4. 实时数据管道

### 4.1 事件收集架构

```
┌──────────────────────────────────────────────────────────────┐
│                       用户浏览器                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │ 搜索行为   │  │ 点击行为   │  │    对比/收藏行为        │  │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬────────────┘  │
│        │               │                      │              │
│        └───────────┬───┴──────────────────────┘              │
│                    ▼                                          │
│         ┌──────────────────────┐                             │
│         │  事件收集 SDK         │                             │
│         │  - 批量收集           │                             │
│         │  - 本地缓冲           │                             │
│         │  - 离线支持           │                             │
│         └──────────┬───────────┘                             │
└────────────────────┼─────────────────────────────────────────┘
                     │ HTTPS POST /events
                     ▼
┌────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│         ┌──────────────────────────────────────┐           │
│         │         事件接收服务                   │           │
│         │  - 验证事件格式                        │           │
│         │  - 补充 metadata                      │           │
│         │  - 写入消息队列                       │           │
│         └─────────────────┬────────────────────┘           │
└───────────────────────────┼─────────────────────────────────┘
                            │ Kafka / Redis Streams
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    事件处理管道                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ 热度计算   │  │ 实时聚合   │  │ 存档存储   │            │
│  │ Worker    │  │ Worker    │  │ Worker    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │               │               │                  │
│         ▼               ▼               ▼                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ HeatScore  │  │ Analytics  │  │  ClickHouse│            │
│  │ Redis      │  │ Dashboard  │  │ 历史数据    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 前端事件收集 SDK

```typescript
// src/lib/analytics.ts
class AnalyticsSDK {
  private sessionId: string;
  private eventQueue: Event[] = [];
  private flushInterval = 5000; // 5秒批量发送
  private maxQueueSize = 20;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushTimer();
    this.setupVisibilityHandler();
  }

  track(eventType: EventType, properties: Record<string, any>) {
    const event: UserBehaviorEvent = {
      eventType,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userId: this.getUserId(), // 可能为空（匿名用户）
      context: properties,
      // 自动收集的字段
      pageUrl: window.location.href,
      referrer: document.referrer,
      deviceType: this.getDeviceType(),
    };

    this.queueEvent(event);

    // 实时更新热度（乐观更新）
    this.optimisticallyUpdateHeat(eventType, properties.toolRid);
  }

  private queueEvent(event: UserBehaviorEvent) {
    this.eventQueue.push(event);

    // 达到阈值立即发送
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // 失败时重新入队
      this.eventQueue.unshift(...events);
      console.error('Failed to send events:', error);
    }
  }

  // 乐观更新热度分数
  private optimisticallyUpdateHeat(eventType: EventType, toolRid?: string) {
    if (!toolRid) return;

    // 立即更新本地缓存的热度分数
    const heatStore = useHeatStore.getState();
    heatStore.boostScore(toolRid, eventType);
  }
}

// 使用示例
const analytics = new AnalyticsSDK();

// 搜索事件
analytics.track('search', { query: '文本生成', resultsCount: 15 });

// 点击事件
analytics.track('click', { toolRid: 'claude-3-sonnet', source: 'search' });

// 对比事件
analytics.track('compare', {
  tools: ['claude-3-sonnet', 'gpt-4-turbo'],
  dimensions: ['price', 'contextWindow'],
  winner: 'claude-3-sonnet'
});
```

### 4.3 热度更新频率

| 数据类型 | 更新频率 | 存储位置 | 有效期 |
|----------|----------|----------|--------|
| 1小时热度 | 每 5 分钟 | Redis | 2 小时 |
| 24小时热度 | 每 15 分钟 | Redis | 2 天 |
| 7天热度 | 每 1 小时 | PostgreSQL | 8 天 |
| 30天热度 | 每 6 小时 | PostgreSQL | 32 天 |
| 历史热度 | 每天 | ClickHouse | 永久 |

---

## 5. 动态层的 UI 呈现

### 5.1 用户可见的动态元素

```
┌─────────────────────────────────────────────────────────────────┐
│                         工具卡片                                  │
├─────────────────────────────────────────────────────────────────┤
│ [图标] Claude 3.5 Sonnet                                         │
│ Anthropic · $3/1M tokens · 200K context                        │
│                                                                 │
│ ⭐ 4.8 (1.2k) 🔥 第3热 📈 +45%                                  │
│                                                                   │
│ 能力: 💬聊天 📄文档 🖼️图片 🎵音频 🌐视频                        │
│                                                                 │
│ [查看详情] [对比] [收藏]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 热度标签设计

```typescript
const HeatBadge = ({ score, period = '24h' }: Props) => {
  const level = calculateHeatLevel(score);

  return (
    <div className={`heat-badge heat-${level}`}>
      <span className="heat-icon">{HEAT_DISPLAY[level].icon}</span>
      <span className="heat-label">{HEAT_DISPLAY[level].label}</span>
      {score > 0 && (
        <span className="heat-trend">
          {period === '24h' ? `今日第 ${getRank(score)} 热` : `🔥 +${score}%`}
        </span>
      )}
    </div>
  );
};
```

### 5.3 趋势指示器

```typescript
interface TrendIndicatorProps {
  trend: 'rising' | 'falling' | 'stable';
  delta: number;
}

// 上升趋势
<RisingTrendIcon /> +24%  // 绿色箭头 + 百分比

// 下降趋势
<FallingTrendIcon /> -15% // 红色箭头 + 百分比

// 稳定
<StableIcon /> —        // 横线
```

### 5.4 实时查看人数

```typescript
interface LiveViewersProps {
  toolRid: string;
}

// WebSocket 连接实时获取
const LiveViewers = ({ toolRid }: Props) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.aicompass.com/live/${toolRid}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCount(data.viewers);
    };
    return () => ws.close();
  }, [toolRid]);

  return (
    <div className="live-viewers">
      <span className="pulse-indicator">●</span>
      <span>{count} 人正在浏览</span>
    </div>
  );
};
```

### 5.5 热度热力图

```typescript
// 工具列表按热度高亮
const ToolList = ({ tools, sortBy = 'heat' }: Props) => {
  return (
    <div className="tool-list">
      {tools.map(tool => {
        const heatLevel = getHeatLevel(tool.heatScore24h);
        return (
          <div
            key={tool.rid}
            className={`tool-card heat-bg-${heatLevel}`}
            style={{
              background: `rgba(${getHeatColor(heatLevel)}, 0.1)`
            }}
          >
            {/* 工具内容 */}
          </div>
        );
      })}
    </div>
  );
};
```

---

## 6. 动态层数据在对比中的应用

### 6.1 用户对比行为数据化

```typescript
// 用户在对比页面选择维度时的行为追踪
const handleDimensionSelect = (dimension: string) => {
  analytics.track('compare_dimension_select', {
    dimension,
    currentTools: selectedTools.map(t => t.rid),
    previousDimensions: selectedDimensions,
  });
};

// 用户做决策时的行为追踪
const handleDecision = (winnerRid: string, reason?: string) => {
  analytics.track('compare_decision', {
    winner: winnerRid,
    losers: selectedTools.filter(t => t.rid !== winnerRid).map(t => t.rid),
    reason,
    timeSpent: Date.now() - compareSessionStart,
  });

  // 更新动力层数据
  updateToolVote(winnerRid, 'comparison_win');
};
```

### 6.2 对比数据反馈到对象层

```typescript
// 通过对比行为丰富工具的"关联关系"
const enrichToolRelations = (comparison: ComparisonEvent) => {
  // 如果 A 被用来和 B 对比，说明两者是竞争对手
  createLink({
    linkTypeId: 'competitor',
    sourceObjectId: comparison.tools[0],
    targetObjectId: comparison.tools[1],
    properties: {
      comparisonCount: increment(),
      lastCompared: now(),
    }
  });
};
```

---

## 7. 技术实现要点

### 7.1 数据存储

```prisma
// Prisma Schema 扩展
model UserBehaviorEvent {
  id          String   @id @default(cuid())
  eventType   String
  toolRid     String?  // 可空的，因为有些事件针对分类或全局
  categoryRid String?
  sessionId   String
  userId      String?
  properties  Json     // 事件相关的额外数据
  timestamp   DateTime @default(now())

  // 索引
  @@index([toolRid, timestamp])
  @@index([sessionId])
  @@index([eventType, timestamp])
}

model ToolHeatScore {
  id              String   @id @default(cuid())
  toolRid         String   @unique
  heatScore1h     Float    @default(0)
  heatScore24h    Float    @default(0)
  heatScore7d     Float    @default(0)
  heatScore30d    Float    @default(0)
  trend1h         String   // rising, stable, falling
  trend24h        String
  lastUpdated     DateTime @default(now())

  @@index([heatScore24h])
}
```

### 7.2 API 端点

```typescript
// 事件上报
POST /api/events/batch
Body: { events: UserBehaviorEvent[] }

// 热度查询
GET /api/tools/:rid/heat
Response: {
  score24h: number;
  trend: string;
  rank: number;
  viewers: number;
}

// 批量热度
POST /api/tools/heat/batch
Body: { toolRids: string[] }
Response: { heats: Record<string, ToolHeatScore> }
```

### 7.3 性能考虑

1. **事件批处理**：前端批量收集事件，减少网络请求
2. **Redis 缓存**：热度数据使用 Redis，毫秒级响应
3. **优雅降级**：如果事件服务不可用，数据不丢失（本地重试）
4. **采样**：对于高流量事件，进行采样存储

---

## 8. 隐私与合规

### 8.1 数据收集原则

1. **最小化**：只收集必要的行为数据
2. **匿名化**：不收集可识别个人身份的信息
3. **透明度**：明确告知用户数据收集用途
4. **可控制**：用户可查看和删除自己的行为数据

### 8.2 隐私声明

```
我们收集以下匿名数据以提升服务体验：
- 搜索关键词（不关联到个人）
- 工具点击和对比行为
- 页面停留时间和滚动深度

这些数据用于：
- 热度排名计算
- 产品体验优化
- 个性化推荐

我们不会：
- 追踪您访问的其他网站
- 与第三方共享个人数据
- 将数据用于广告定向
```

---

*Last updated: 2026-05-09*
*相关文档: [动力层设计](./motivation-layer.md) | [数据采集规划](./data-collection.md)*