# 数据采集规划 — 分阶段数据来源与采集策略

> 本文档详细规划 AI API Compass 各阶段的数据采集策略，从最简单的基础数据逐步扩展到第三方排名和社区贡献数据。

---

## 1. 数据维度概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    数据维度全景图                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 基础数据（必须）                                             │
│     ├── 工具基本信息（名称、开发商、官网、描述）                  │
│     ├── 分类归属                                               │
│     └── API 链接                                                │
│                                                                 │
│  🟡 重要数据（推荐）                                             │
│     ├── 定价信息（价格模型、价格区间）                           │
│     ├── 技术规格（上下文窗口、支持的能力）                        │
│     ├── 开发者信息（GitHub、社交媒体）                           │
│     └── 官方文档链接                                            │
│                                                                 │
│  🟢 增强数据（可选）                                             │
│     ├── Benchmark 分数（MMLU、HellaSwag 等）                    │
│     ├── 第三方排名数据（LMSYS、Artificial Analysis）            │
│     ├── 用户评分和评测                                          │
│     └── 社区讨论和案例                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1 — 基础数据丰富化（第 1-4 周）

### 2.1 当前状态

**已采集数据**：
- 295 个工具的基础信息（名称、开发商、URL、描述）
- 10 个分类
- 303 条工具-分类关联

**缺失数据**：
- 定价信息（90% 缺失）
- 上下文窗口（100% 缺失）
- 能力标签（0% 缺失）
- API 参数（0% 缺失）

### 2.2 采集策略

#### 策略 1：自动化采集（适合标准化数据）

```python
# scripts/auto_enrich.py
class AutoEnricher:
    """
    自动化数据丰富工具

    数据来源：
    1. 工具官网（主要）
    2. API 文档（定价、技术规格）
    3. GitHub README（开发者信息）
    """

    # 已知工具官网模板
    KNOWN_WEBSITES = {
        'openai.com': 'https://openai.com/api/pricing',
        'anthropic.com': 'https://docs.anthropic.com/en/api/pricing',
        'google.com': 'https://ai.google.dev/pricing',
    }

    def enrich_tool(self, tool: dict) -> dict:
        """
        自动化丰富单个工具的数据
        """
        domain = self.extract_domain(tool['website'])

        if domain in self.KNOWN_WEBSITES:
            # 已知网站，直接爬取定价页
            pricing = self.scrape_pricing(self.KNOWN_WEBSITES[domain])
        else:
            # 未知网站，先尝试主页
            pricing = self.scrape_pricing(tool['website'] + '/pricing')

        return {
            ...tool,
            'pricingModel': pricing.get('model'),
            'priceRange': pricing.get('range'),
            'contextWindow': pricing.get('contextWindow'),
        }
```

#### 策略 2：社区众包（适合难以自动化的数据）

```typescript
// 前端：用户提交工具信息
interface ToolSubmissionForm {
  toolName: string;
  developer: string;
  website: string;
  pricingModel?: 'free' | 'subscription' | 'per_token' | 'freemium' | 'unknown';
  priceRange?: string;
  contextWindow?: number;
  capabilities?: string[];
  dataQuality: 'verified' | 'estimated' | 'guess';
  evidence?: string;  // 来源链接
}

// 验证流程
const validateSubmission = async (submission: ToolSubmissionForm) => {
  // 1. 格式验证
  if (!submission.toolName || !submission.website) {
    throw new Error('缺少必填字段');
  }

  // 2. 重复检测
  const existing = await searchTool(submission.toolName);
  if (existing) {
    throw new Error('该工具已存在: ' + existing.slug);
  }

  // 3. URL 可访问性验证
  const isValid = await verifyWebsite(submission.website);
  if (!isValid) {
    throw new Error('网站无法访问');
  }

  // 4. 提交审核队列
  await queueForReview(submission);
};
```

### 2.3 Phase 1 数据清单

| 数据项 | 采集方式 | 目标覆盖率 | 负责人 | 截止日期 |
|--------|----------|-----------|--------|----------|
| 定价模型 | 自动 + 手动 | 100% | 脚本 + 社区 | Week 2 |
| 价格区间 | 自动 + 手动 | 90% | 脚本 + 社区 | Week 2 |
| 上下文窗口 | 手动调研 | 80% | 专人负责 | Week 3 |
| 能力标签 | 社区标注 | 70% | 社区 | Week 4 |
| API 参数 | 手动调研 | 50% | 专人负责 | Week 4 |

### 2.4 数据质量标准

```
Phase 1 数据质量标准：

✓ 有效数据：
  - 定价模型：已确认（网站、文档、或社区验证）
  - 价格区间：已确认（官方网站价格）
  - 上下文窗口：已确认（官方文档）

⚠️ 估算数据：
  - 定价模型：已估算（未找到官方信息）
  - 价格区间：已估算（基于市场行情）

✗ 无数据：
  - 标注为 null，等待后续补充
```

---

## 3. Phase 2 — 第三方排名数据接入（第 2-3 月）

### 3.1 数据源概览

| 数据源 | 数据类型 | 覆盖工具 | 更新频率 | 技术难度 |
|--------|----------|----------|----------|----------|
| **LMSYS Chatbot Arena** | ELO 评分 | ~100 | 每日 | 中 |
| **Artificial Analysis** | 速度/质量/价格 | ~50 | 每小时 | 低 |
| **OpenRouter Stats** | 使用量/评分 | ~100 | 每日 | 低 |
| **HuggingFace** | 下载量/点赞 | ~50 | 每日 | 低 |
| **GitHub** | Stars/Forks | ~30 | 实时 | 低 |

### 3.2 LMSYS Chatbot Arena

**数据获取**：

```python
# scripts/collect_lmsys.py
import httpx
import asyncio

class LMSYSCollector:
    """
    LMSYS Chatbot Arena 数据采集

    API 端点：https://chat.lmsys.org/api/leaderboard
    """

    BASE_URL = 'https://chat.lmsys.org/api/leaderboard'

    async def fetch_leaderboard(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(self.BASE_URL, timeout=30)
            data = response.json()

            return [
                {
                    'toolName': row['model'],
                    'eloScore': row['elo_rating'],
                    'voteCount': row['vote_count'],
                    'rank': row['rank'],
                    '更新日期': row.get('last_updated'),
                }
                for row in data.get('leaderboard', [])
            ]

    def normalize_tool_name(self, lmsys_name: str) -> str:
        """
        LMSYS 工具名称标准化

        例子：
        "gpt-4-turbo-2024-04-09" -> "gpt-4-turbo"
        "claude-3.5-sonnet-20240619" -> "claude-3.5-sonnet"
        """
        # 去除日期后缀
        import re
        cleaned = re.sub(r'-\d{8}$', '', lmsys_name)

        # 厂商前缀
        vendor_map = {
            'gpt': 'openai',
            'claude': 'anthropic',
            'gemini': 'google',
        }

        return cleaned
```

**数据存储**：

```typescript
// ObjectType 设计
interface LMSYSRecord {
  rid: string;
  toolRid: string;
  source: 'lmsys';
  eloScore: number;
  voteCount: number;
  rank: number;
  capturedAt: Date;
}
```

### 3.3 Artificial Analysis

**数据获取**：

```python
# scripts/collect_aa.py
class ArtificialAnalysisCollector:
    """
    Artificial Analysis 数据采集

    数据源：
    1. 公开 API: https://artificialanalysis.ai/api/providers
    2. CSV 下载: 每日排名数据
    """

    API_URL = 'https://artificialanalysis.ai/api/providers'

    async def fetch_provider_data(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(self.API_URL)
            return response.json()

    def extract_metrics(self, provider_data: dict) -> dict:
        """
        提取关键指标：
        - latency_ms: 平均延迟
        - throughput_tokens_per_second: 吞吐量
        - quality_score: 质量分数
        - price_per_million_tokens: 价格
        """
        return {
            'latency': provider_data.get('latency_p50', 0),
            'throughput': provider_data.get('throughput', 0),
            'quality': provider_data.get('quality', 0),
            'price': provider_data.get('price_per_m', 0),
        }
```

### 3.4 OpenRouter Stats

```typescript
// scripts/collect_openrouter.ts
class OpenRouterCollector {
  private readonly API_URL = 'https://openrouter.ai/api/v1/models';

  async fetchModels(): Promise<Model[]> {
    const response = await fetch(this.API_URL);
    const data = await response.json();

    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      pricing: model.pricing,
      contextLength: model.context_length,
      usage: model.top_provider?.rank || 0,
    }));
  }
}
```

### 3.5 采集调度配置

```yaml
# config/collection_schedule.yaml
data_collection:
  # LMSYS 每日凌晨 2 点采集
  lmsys:
    schedule: "0 2 * * *"
    api_endpoint: "https://chat.lmsys.org/api/leaderboard"
    target覆盖率: 100%
    retry_on_failure: 3

  # Artificial Analysis 每小时采集
  artificial_analysis:
    schedule: "0 * * * *"
    api_endpoint: "https://artificialanalysis.ai/api/providers"
    target覆盖率: 80%
    retry_on_failure: 2

  # OpenRouter 每日采集
  openrouter:
    schedule: "0 6 * * *"
    api_endpoint: "https://openrouter.ai/api/v1/models"
    target覆盖率: 90%
    retry_on_failure: 3

  # GitHub 每6小时采集
  github:
    schedule: "0 */6 * * *"
    # 使用 GraphQL API 获取 Stars 数量
    target覆盖率: 50%
    rate_limit:
      max_per_hour: 5000
      retry_after: 3600
```

### 3.6 数据映射表

```typescript
// 数据源与工具的映射
interface DataMapping {
  // 工具的 RID -> 第三方数据源的工具 ID
  mappings: Map<string, {
    lmsys?: string;
    artificial_analysis?: string;
    openrouter?: string;
    github?: string;
  }>;

  // 自动映射（基于名称匹配）
  autoMatch(toolName: string): string | null {
    // 精确匹配
    if (this.directMatch(toolName)) return toolName;

    // 模糊匹配
    const normalized = this.normalize(toolName);
    return this.fuzzyMatch(normalized);
  }

  // 手动映射（针对特殊情况）
  manualMapping: Record<string, Record<string, string>> = {
    'claude-3.5-sonnet': {
      lmsys: 'claude-3.5-sonnet-20240619',
      openrouter: 'anthropic/claude-3.5-sonnet',
    },
    'gpt-4-turbo': {
      lmsys: 'gpt-4-turbo-2024-04-09',
      openrouter: 'openai/gpt-4-turbo',
    },
  };
}
```

---

## 4. Phase 3 — 动态数据采集（第 3-4 月）

### 4.1 用户行为数据采集

**前端 SDK**：

```typescript
// src/lib/behavior-collector.ts
class BehaviorCollector {
  private queue: BehaviorEvent[] = [];
  private flushInterval = 5000;
  private maxQueueSize = 20;

  constructor() {
    // 页面卸载时发送剩余事件
    window.addEventListener('beforeunload', () => this.flush());

    // 定时刷新
    setInterval(() => this.flush(), this.flushInterval);
  }

  track(event: BehaviorEvent) {
    // 添加基础信息
    const enrichedEvent = {
      ...event,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer,
      deviceType: this.getDeviceType(),
    };

    // 入队
    this.queue.push(enrichedEvent);

    // 达到阈值立即发送
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0);

    try {
      await fetch('/api/behavior/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // 失败时重新入队
      this.queue.unshift(...events);
    }
  }
}

// 使用示例
const collector = new BehaviorCollector();

// 搜索
collector.track({
  type: 'search',
  query: '文本生成',
  resultCount: 15,
  clickedRid: 'claude-3-sonnet',
});

// 对比
collector.track({
  type: 'compare',
  toolRids: ['claude-3-sonnet', 'gpt-4-turbo'],
  dimensions: ['price', 'contextWindow'],
});

// 收藏
collector.track({
  type: 'bookmark',
  toolRid: 'gemini-1.5-pro',
  action: 'add',
});
```

### 4.2 搜索行为数据采集

```typescript
// 搜索查询的深度分析
interface SearchAnalysis {
  query: string;
  normalizedQuery: string;        // 标准化
  intent: 'find_tool' | 'compare_tools' | 'learn' | 'unknown';
  entities: string[];            // 提取的实体（厂商、类别、功能）
  filters: {
    category?: string;
    pricing?: string;
    capability?: string[];
  };
  // 结果分析
  resultsShown: number;
  clickedToolRid?: string;
  clickPosition?: number;
  conversionTime?: number;        // 从搜索到点击的时间
}
```

### 4.3 数据管道架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                               │
│                        Analytics SDK                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS POST /api/behavior
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway                                  │
│              Rate Limiting + 认证                                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐      ┌─────────┐     ┌─────────┐
        │  Redis  │      │ Kafka   │     │   PG    │
        │ 实时缓存│      │ 事件队列│     │  归档   │
        └────┬────┘      └────┬────┘     └─────────┘
             │                │
             ▼                ▼
        ┌─────────┐      ┌─────────┐
        │ Heat    │      │ Process │
        │ Worker  │      │ Worker │
        │ 热度计算 │      │ 聚合分析 │
        └─────────┘      └─────────┘
```

---

## 5. Phase 4 — 社区数据采集（第 5-6 月）

### 5.1 评分数据

```typescript
// 评分收集表单
interface RatingForm {
  toolRid: string;
  overallScore: 1 | 2 | 3 | 4 | 5;
  easeOfUse: 1 | 2 | 3 | 4 | 5;
  performance: 1 | 2 | 3 | 4 | 5;
  value: 1 | 2 | 3 | 4 | 5;
  review?: string;               // 可选的长评
  useCase?: string;             // 使用场景
  wouldRecommend: boolean;
}

// 防刷机制
class AntiSpamRating {
  checkDuplicate(userId: string, toolRid: string): boolean {
    // 每个用户对每个工具只能评分一次
  }

  checkVelocity(userId: string): boolean {
    // 检测短时间内大量评分
    // 超过 10 个评分/小时视为可疑
  }

  checkContent(review: string): boolean {
    // 检测刷评内容
    // 重复内容、过短内容、可疑关键词
  }

  verifyOwnership(userId: string, toolRid: string): boolean {
    // 验证用户确实使用过该工具（可选）
    // 通过 API 调用记录确认
  }
}
```

### 5.2 工具提交

```typescript
// 新工具提交流程
const TOOL_SUBMISSION_WORKFLOW = {
  // 步骤 1：用户提交
  submit: {
    requiredFields: ['name', 'developer', 'website', 'description', 'category'],
    optionalFields: ['pricing', 'contextWindow', 'capabilities', 'documentation'],
    validation: {
      website: 'must_be_accessible',
      description: 'min_length_50',
      category: 'must_exist',
    },
  },

  // 步骤 2：格式检查
  formatCheck: {
    checks: ['complete', 'no_spam', 'appropriate_content'],
    autoReject: true,  // 不合格自动拒绝
  },

  // 步骤 3：重复检测
  duplicateCheck: {
    checks: ['name_similarity', 'website_match', 'api_match'],
    threshold: 0.8,   // 相似度 > 80% 视为重复
  },

  // 步骤 4：社区预审
  communityReview: {
    requiredApprovals: 3,
    approvalWeight: 1,
    rejectionWeight: 2,  // 拒绝权重更高
    autoApproveThreshold: 5,  // 5 个赞同自动通过
  },

  // 步骤 5：最终审核
  expertReview: {
    requiredApprovals: 1,
    roles: ['expert', 'admin'],
  },

  // 结果
  outcome: {
    approved: 'published',
    rejected: 'rejected_with_reason',
    duplicate: 'merged_with_existing',
  },
};
```

### 5.3 数据纠错

```typescript
// 数据纠错流程
interface DataCorrection {
  id: string;
  toolRid: string;
  field: string;           // 被纠错的字段
  currentValue: any;       // 当前值
  proposedValue: any;      // 建议值
  evidence: string;        // 证据/来源
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';

  // 审核信息
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
}

// 纠错审核规则
const CORRECTION_RULES = {
  // 字段级别权重
  fieldWeights: {
    pricing: 2,             // 价格纠错权重高
    contextWindow: 2,
    capabilities: 1.5,
    description: 1,
  },

  // 纠错者权重
  submitterWeights: {
    expert: 3,
    verified_user: 2,
    new_user: 1,
  },

  // 自动批准规则
  autoApprove: {
    min_approvals: 5,
    min_approval_rate: 0.8,
    evidence_required: true,
  },
};
```

---

## 6. 数据质量保障

### 6.1 数据验证层级

```
┌─────────────────────────────────────────────────────────────────┐
│                     数据验证金字塔                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     ▲ 自动验证                                   │
│                    /█\                                          │
│                   /███\                                         │
│                  /█████\                                        │
│                 /███████\                                       │
│                /█████████\                                      │
│               /███████████\                                    │
│              /█████████████\                                   │
│                                                                 │
│  Level 1: 格式验证（自动）                                       │
│    - 必填字段存在                                               │
│    - 数据类型正确                                               │
│    - URL 格式正确                                               │
│                                                                 │
│  Level 2: 逻辑验证（自动）                                       │
│    - 价格在合理范围内                                           │
│    - 上下文窗口 > 0                                            │
│    - 评分在 1-5 之间                                           │
│                                                                 │
│  Level 3: 来源验证（半自动）                                     │
│    - URL 可访问                                                │
│    - 与官方文档一致                                            │
│    - 数据一致性检查                                            │
│                                                                 │
│  Level 4: 社区验证（人工）                                       │
│    - 多人确认                                                  │
│    - 专家审核                                                  │
│    - 时间验证                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 数据新鲜度监控

```typescript
// 数据新鲜度监控
class DataFreshnessMonitor {
  checkStaleness(field: string, toolRid: string): StalenessLevel {
    const data = this.getData(field, toolRid);
    const age = Date.now() - data.lastUpdated;

    if (age < 7 * 24 * 60 * 60 * 1000) return 'fresh';
    if (age < 30 * 24 * 60 * 60 * 1000) return 'stale';
    if (age < 90 * 24 * 60 * 60 * 1000) return 'very_stale';
    return 'outdated';
  }

  // 超过 90 天的数据需要重新验证
  requestRevalidation(field: string, toolRid: string) {
    // 标记为待验证
    // 通知相关贡献者
    // 降低该数据在排名中的权重
  }
}
```

### 6.3 异常检测

```python
class AnomalyDetector:
    """
    数据异常检测

    检测类型：
    1. 价格异常：远低于/高于市场
    2. 排名突变：短时间内大幅上升/下降
    3. 数据不一致：多个数据源相互矛盾
    """

    def detect_pricing_anomaly(self, tool: Tool) -> bool:
        market_avg = self.get_market_average(tool.category, 'price')
        tool_price = tool.price_per_million

        # 价格低于市场均价 80% 或高于 300% 视为异常
        if tool_price < market_avg * 0.2 or tool_price > market_avg * 3:
            return True
        return False

    def detect_ranking_sudden_change(self, tool_rid: str) -> bool:
        history = self.get_rank_history(tool_rid, days=7)

        if len(history) < 2:
            return False

        changes = [history[i] - history[i-1] for i in range(1, len(history))]

        # 7 天内排名变化超过 50 位视为异常
        if max(abs(c) for c in changes) > 50:
            return True
        return False

    def detect_contradiction(self, tool: Tool) -> List[Contradiction]:
        contradictions = []

        # 检查不同来源的矛盾
        for source1, source2 in combinations(['lmsys', 'aa', 'community'], 2):
            if self.has_contradiction(tool, source1, source2):
                contradictions.append({
                    'field': 'rank_score',
                    'source1': source1,
                    'value1': self.get_score(tool, source1),
                    'source2': source2,
                    'value2': self.get_score(tool, source2),
                    'delta': abs(self.get_score(tool, source1) - self.get_score(tool, source2)),
                })

        return contradictions
```

---

## 7. 数据采集工具

### 7.1 采集脚本管理

```bash
# scripts/collection/
.
├── run_collectors.sh      # 一键运行所有采集脚本
├── lmsys_collector.py     # LMSYS 数据采集
├── aa_collector.py        # Artificial Analysis 采集
├── openrouter_collector.ts # OpenRouter 采集
├── github_collector.ts    # GitHub 热度采集
├── enrich_tools.py        # 工具数据丰富化
└── validate_data.py       # 数据验证

# 使用方法
npm run collect:lmsys      # 采集单个数据源
npm run collect:all        # 采集所有数据源
npm run collect:enrich     # 丰富工具数据
```

### 7.2 监控仪表板

```
┌─────────────────────────────────────────────────────────────────┐
│                    数据采集监控面板                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  采集状态                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ LMSYS    │ │ AA       │ │ OpenRouter│ │ GitHub   │          │
│  │ ✅ OK    │ │ ✅ OK    │ │ ⚠️ 延迟  │ │ ✅ OK    │          │
│  │ 2小时前   │ │ 5分钟前  │ │ 30分钟前  │ │ 1小时前  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  数据覆盖率                                                       │
│  定价: 85%  ████████████████████░░░░                            │
│  上下文: 62% █████████████░░░░░░░░░░░                            │
│  评分: 28%  ██████░░░░░░░░░░░░░░░░░░░                            │
│                                                                 │
│  数据质量                                                         │
│  有效数据: 1,847 条                                              │
│  待验证: 234 条                                                  │
│  已过期: 12 条                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 实施时间表

| 周次 | 任务 | 产出 | 负责人 |
|------|------|------|--------|
| Week 1 | 自动化采集脚本开发 | 定价数据自动采集 | 后端 |
| Week 2 | 手动调研定价数据 | 90% 工具定价完成 | 全栈 |
| Week 3 | 上下文窗口调研 | 80% 工具上下文完成 | 全栈 |
| Week 4 | 社区标注系统上线 | 用户可标注工具能力 | 前端 |
| Month 2 | LMSYS 数据接入 | ELO 排名数据 | 后端 |
| Month 2 | Artificial Analysis 接入 | 速度/价格数据 | 后端 |
| Month 3 | OpenRouter 数据接入 | 使用量数据 | 后端 |
| Month 3 | 行为数据采集 SDK | 用户行为追踪 | 前端 |
| Month 4 | 热度计算服务 | 实时热度数据 | 后端 |
| Month 5 | 评分系统上线 | 用户可评分 | 前端 |
| Month 5 | 工具提交系统上线 | 用户可提交新工具 | 全栈 |
| Month 6 | 推荐系统上线 | 个性化推荐 | 后端 |

---

*Last updated: 2026-05-09*
*相关文档: [对象层设计](./static-layer.md) | [动态层设计](./dynamic-layer.md) | [动力层设计](./motivation-layer.md)*