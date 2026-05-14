# Phase 3: 动力层实现

> **目标**：实现社区评分系统、排名算法和推荐系统
> **前置条件**：Phase 1 和 Phase 2 完成

---

## 1. 目标

### 1.1 功能目标

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **评分系统** | 用户可以为工具打分（1-5 星） | P0 |
| **排名算法** | 综合排名、性价比榜、速度榜等 | P0 |
| **推荐系统** | 基于用户行为和偏好的个性化推荐 | P1 |
| **数据飞轮** | 用户贡献 → 排名优化 → 更多贡献 | P2 |

### 1.2 数据目标

| 数据项 | 描述 | 目标 |
|--------|------|------|
| **UserRating** | 用户评分记录 | 50%+ 工具被评分 |
| **ToolRating** | 工具平均分 | 完整 |
| **Ranking** | 各种类型的排名 | 完整 |
| **Recommendation** | 个性化推荐 | 可用 |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互层                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  评分   │  │  评测   │  │  对比   │  │  收藏   │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       └───────────┴───────────┴───────────┘                   │
│                        │                                       │
└─────────────────────────┼─────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    动力层核心服务                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  评分服务   │  │  排名服务   │  │  推荐服务   │             │
│  │             │  │             │  │             │             │
│  │ • 提交评分  │  │ • 综合排名  │  │ • 场景推荐  │             │
│  │ • 防刷验证  │  │ • 分类排名  │  │ • 相似推荐  │             │
│  │ • 聚合统计  │  │ • 趋势排名  │  │ • 个性化    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    排名计算引擎                             ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │ 综合权重: 静态(40%) + 第三方(30%) + 动态(30%)         │ ││
│  │  │ 可切换视角: 性能党 / 性价比党 / 社区党                 │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据层                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ 评分数据 │  │ 排名数据 │  │ 行为数据 │  │ 工具数据 │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent 任务定义

### Agent 1: 评分系统

```yaml
name: rating-system-agent
description: 实现社区评分系统
priority: P0

inputs:
  - existingRating: UserRating 数据结构
  - antiSpamRules: 防刷规则

outputs:
  - src/services/rating-service.ts
  - src/components/rating/StarRating.tsx
  - src/components/rating/RatingDisplay.tsx
  - src/components/rating/RatingModal.tsx

tasks:
  - name: implement_rating_service
    description: 实现评分服务
    features:
      - 提交评分（1-5 星）
      - 更新评分
      - 获取平均分
      - 分项评分（易用性、性能、性价比）
      - 防刷验证

  - name: implement_star_rating
    description: 实现星级评分组件
    features:
      - 点击评分
      - 悬停预览
      - 半数评分
      - 只读模式

  - name: implement_rating_display
    description: 实现评分展示组件
    features:
      - 平均分显示
      - 评分分布
      - 分项评分
      - 评测列表

  - name: implement_rating_modal
    description: 实现评分弹窗
    features:
      - 多维度评分
      - 评测文字
      - 使用场景
      - 防刷提示

acceptance:
  - "用户可以评分 1-5 星"
  - "评分立即反映到平均分"
  - "防刷机制有效"
  - "评测列表正确显示"
```

### Agent 2: 排名算法

```yaml
name: ranking-algorithm-agent
description: 实现排名计算引擎
priority: P0

inputs:
  - scoringWeights: 权重配置
  - rankingTypes: 排名类型
  - thirdPartyData: 第三方数据（模拟）

outputs:
  - src/services/ranking/ranking-calculator.ts
  - src/services/ranking/composite-scorer.ts
  - src/services/ranking/anti-gaming.ts
  - src/services/ranking/ranking-scheduler.ts

tasks:
  - name: implement_composite_scorer
    description: 实现综合评分器
    features:
      - 多数据源加权融合
      - 动态权重调整
      - 置信度计算
      - 分数分解展示

  - name: implement_anti_gaming
    description: 实现防刷机制
    features:
      - 异常检测
      - 投票权重调整
      - 可疑标记

  - name: implement_ranking_types
    description: 实现各类排名
    types:
      - 综合榜
      - 性价比榜
      - 速度榜
      - 质量榜
      - 热度榜
      - 新兴榜

  - name: implement_ranking_scheduler
    description: 实现排名调度
    features:
      - 每日更新
      - 增量更新
      - 历史记录

acceptance:
  - "综合排名正确计算"
  - "可切换不同视角"
  - "排名数据可解释"
  - "每日自动更新"
```

### Agent 3: 推荐系统

```yaml
name: recommendation-engine-agent
description: 实现个性化推荐系统
priority: P1

inputs:
  - userProfile: 用户画像
  - userBehavior: 用户行为
  - toolData: 工具数据

outputs:
  - src/services/recommendation/rec-engine.ts
  - src/services/recommendation/scenario-match.ts
  - src/components/recommendation/RecommendationPanel.tsx
  - src/components/recommendation/ScenarioInput.tsx

tasks:
  - name: implement_rec_engine
    description: 实现推荐引擎
    features:
      - 基于热度的推荐
      - 基于相似用户的推荐
      - 基于历史的推荐

  - name: implement_scenario_match
    description: 实现场景匹配
    features:
      - 输入使用场景
      - 提取需求关键词
      - 匹配工具
      - 生成推荐理由

  - name: implement_rec_panel
    description: 实现推荐面板
    features:
      - 推荐结果列表
      - 匹配度显示
      - 推荐理由
      - 操作按钮

  - name: implement_scenario_input
    description: 实现场景输入
    features:
      - 文本输入框
      - 预设场景
      - 快速选择

acceptance:
  - "推荐结果相关"
  - "场景匹配准确"
  - "推荐理由可解释"
```

---

## 4. 数据模型

### 4.1 UserRating

```typescript
interface UserRating {
  id: string;
  toolRid: string;
  userId: string;
  overallScore: number;        // 1-5
  easeOfUseScore?: number;     // 1-5
  performanceScore?: number;    // 1-5
  valueScore?: number;         // 1-5
  review?: string;             // 评测文字
  useCase?: string;           // 使用场景
  wouldRecommend: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 ToolRating (聚合)

```typescript
interface ToolRating {
  toolRid: string;
  overallScore: number;        // 平均分
  overallCount: number;       // 评分人数
  easeOfUseAvg: number;
  performanceAvg: number;
  valueAvg: number;
  wouldRecommendRate: number;  // 推荐率
  scoreDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

### 4.3 Ranking

```typescript
interface Ranking {
  id: string;
  toolRid: string;
  rankingType: 'composite' | 'price_performance' | 'speed' | 'quality' | 'popularity';
  rank: number;               // 排名
  score: number;              // 分数
  confidence: number;         // 置信度
  breakdown: {
    dimension: string;
    score: number;
    weight: number;
    source: string;
  }[];
  generatedAt: Date;
}
```

---

## 5. 排名算法详解

### 5.1 综合排名算法

```typescript
interface RankingWeights {
  // 静态指标 (40%)
  benchmarkQuality: 0.20;
  contextWindow: 0.10;
  pricingValue: 0.10;

  // 第三方数据 (30%) - Phase 4 才接入真实数据
  lmsysElo: 0.15;
  artificialAnalysis: 0.10;
  openrouterUsage: 0.05;

  // 社区动态 (30%)
  clickPopularity: 0.10;
  ratingAverage: 0.10;
  engagementDepth: 0.10;
}

class CompositeRankingCalculator {
  calculateCompositeScore(toolRid: string): CompositeScore {
    // 获取各维度数据
    const benchmark = this.getBenchmarkScore(toolRid);
    const context = this.getContextWindow(toolRid);
    const pricing = this.getPricingValue(toolRid);
    const heat = this.getHeatScore(toolRid);
    const rating = this.getAverageRating(toolRid);
    const engagement = this.getEngagementScore(toolRid);

    // 综合评分（Phase 1-3 使用模拟的第三方数据）
    const score = (
      (benchmark || 50) * 0.20 +
      (context || 50) * 0.10 +
      (pricing || 50) * 0.10 +
      (heat || 30) * 0.15 +  // 模拟 LMSYS
      (rating || 50) * 0.15 +  // 模拟 AA
      (this.getSimulatedUsage() * 0.05) +  // 模拟 OpenRouter
      (heat || 30) * 0.10 +
      (rating || 50) * 0.10 +
      (engagement || 30) * 0.10
    );

    return {
      total: score,
      breakdown: {
        benchmarkQuality: (benchmark || 50) * 0.20,
        contextWindow: (context || 50) * 0.10,
        pricingValue: (pricing || 50) * 0.10,
        thirdParty: score * 0.30,  // 模拟
        community: score * 0.30,
      },
    };
  }

  // 模拟第三方数据（Phase 4 替换为真实数据）
  private getSimulatedThirdParty(toolRid: string) {
    // 基于工具名称生成合理的模拟数据
    const tool = this.getTool(toolRid);
    const name = tool.name.toLowerCase();

    // 知名工具模拟较高分数
    if (name.includes('gpt-4') || name.includes('claude')) {
      return { lmsys: 1300, aa: 85, usage: 0.3 };
    }
    // 其他工具随机
    return {
      lmsys: 1100 + Math.random() * 100,
      aa: 70 + Math.random() * 20,
      usage: Math.random() * 0.2,
    };
  }
}
```

### 5.2 动态权重系统

```typescript
const RANKING_PRESETS = {
  performance: {
    benchmarkQuality: 0.35,
    lmsysElo: 0.20,
    artificialAnalysis: 0.15,
    ratingAverage: 0.10,
  },
  value: {
    pricingValue: 0.30,
    artificialAnalysis: 0.20,
    ratingAverage: 0.15,
  },
  popular: {
    clickPopularity: 0.30,
    ratingAverage: 0.20,
    engagementDepth: 0.20,
  },
};
```

### 5.3 评分防刷规则

```typescript
class AntiSpamValidator {
  validateRating(rating: UserRating): ValidationResult {
    const issues: string[] = [];

    // 1. 检查是否重复评分
    if (this.hasExistingRating(rating.userId, rating.toolRid)) {
      issues.push('duplicate_rating');
    }

    // 2. 检查评分速度
    const userActivity = this.getUserActivity(rating.userId);
    if (userActivity.ratingsLastHour > 10) {
      issues.push('too_many_ratings');
    }

    // 3. 检查内容重复
    if (rating.review && this.isDuplicateReview(rating.review)) {
      issues.push('duplicate_review');
    }

    // 4. 检查可疑模式
    if (this.hasSuspiciousPattern(rating)) {
      issues.push('suspicious_pattern');
    }

    return {
      valid: issues.length === 0,
      issues,
      weight: issues.length === 0 ? 1 : 0.5,  // 可疑评分降低权重
    };
  }
}
```

---

## 6. 推荐系统

### 6.1 推荐场景

```typescript
interface RecommendationScenario {
  type: 'home' | 'search' | 'compare' | 'scenario';
  context: {
    query?: string;
    filters?: Filter[];
    selectedTools?: string[];
    scenarioDescription?: string;
  };
  limit?: number;
}

// 推荐场景
const RECOMMENDATION_SCENARIOS = {
  // 首页推荐：热门 + 新兴
  home: (userId?: string) => ({
    type: 'home',
    strategy: 'blend',
    components: [
      { source: 'hot', weight: 0.6 },
      { source: 'rising', weight: 0.3 },
      { source: 'personal', weight: 0.1 },  // 如果有用户历史
    ],
  }),

  // 搜索推荐：相关 + 热门
  search: (query: string, filters?: Filter[]) => ({
    type: 'search',
    strategy: 'hybrid',
    components: [
      { source: 'relevance', query, weight: 0.5 },
      { source: 'hot', weight: 0.3 },
      { source: 'personal', weight: 0.2 },
    ],
  }),

  // 场景推荐：基于描述匹配
  scenario: (description: string) => ({
    type: 'scenario',
    strategy: 'match',
    extractRequirements: description,
  }),
};
```

### 6.2 场景匹配算法

```typescript
class ScenarioMatcher {
  matchTools(requirements: string[], tools: Tool[]): ScoredTool[] {
    // 1. 提取需求关键词
    const keywords = this.extractKeywords(requirements);

    // 2. 为每个工具计算匹配度
    const scoredTools = tools.map(tool => {
      const matchScore = this.calculateMatchScore(tool, keywords);
      const reason = this.generateReason(tool, keywords);
      return { tool, score: matchScore, reason };
    });

    // 3. 排序返回
    return scoredTools
      .filter(t => t.score > 0.3)  // 过滤低匹配
      .sort((a, b) => b.score - a.score);
  }

  private calculateMatchScore(tool: Tool, keywords: string[]): number {
    let score = 0;

    for (const keyword of keywords) {
      // 名称匹配
      if (tool.name.toLowerCase().includes(keyword)) {
        score += 0.3;
      }
      // 描述匹配
      if (tool.description.toLowerCase().includes(keyword)) {
        score += 0.2;
      }
      // 能力匹配
      if (tool.capabilities.some(c => c.includes(keyword))) {
        score += 0.4;
      }
      // 分类匹配
      if (tool.category.toLowerCase().includes(keyword)) {
        score += 0.1;
      }
    }

    // 归一化到 0-1
    return Math.min(1, score);
  }

  private generateReason(tool: Tool, keywords: string[]): string {
    const matched = tool.capabilities.filter(c =>
      keywords.some(k => c.includes(k))
    );

    if (matched.length > 0) {
      return `满足您的核心需求: ${matched.slice(0, 3).join(', ')}`;
    }
    return '综合表现优秀，适合一般场景';
  }
}
```

---

## 7. 执行计划

### 7.1 Agent 并行执行

```
Agent 1: rating-system-agent      ─┐
Agent 2: ranking-algorithm-agent  ──┼─ 并行执行
Agent 3: recommendation-engine   ─┘
                    │
                    ▼
              集成测试
              排名调优
              推荐调优
```

### 7.2 执行命令

```bash
# Phase 3 执行

# 1. 评分系统
tsx agents/rating-system.ts

# 2. 排名算法
tsx agents/ranking-algorithm.ts

# 3. 推荐系统
tsx agents/recommendation-engine.ts

# 4. 集成测试
npm run verify:phase3
```

---

## 8. 验收标准

### 8.1 功能验收

| 功能 | 验收条件 | 测试方法 |
|------|----------|----------|
| **评分提交** | 用户可提交 1-5 星评分 | UI 测试 |
| **评分显示** | 平均分正确计算和显示 | 断言测试 |
| **综合排名** | 排名正确反映综合分数 | 对比测试 |
| **推荐结果** | 推荐工具相关且可解释 | 人工检查 |

### 8.2 定量指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 被评分工具数 | 150+ (50%) | 0 |
| 平均评分数/工具 | 5+ | 0 |
| 排名准确性 | 前 10 无明显错误 | - |
| 推荐相关性 | 80%+ 相关 | - |

### 8.3 端到端测试

```typescript
describe('Phase 3 Motivation Layer', () => {
  it('评分系统可用', async () => {
    const response = await submitRating({
      toolRid: 'claude-3-5-sonnet',
      overallScore: 5,
      review: '很好用',
    });
    expect(response.success).toBe(true);

    const rating = await getToolRating('claude-3-5-sonnet');
    expect(rating.overallScore).toBe(5);
    expect(rating.overallCount).toBe(1);
  });

  it('综合排名正确', async () => {
    const rankings = await getCompositeRanking('composite');

    // 验证排序
    for (let i = 1; i < rankings.length; i++) {
      expect(rankings[i].score).toBeLessThanOrEqual(rankings[i - 1].score);
    }
  });

  it('推荐结果相关', async () => {
    const recommendations = await getScenarioRecommendations(
      '我想做一个客服机器人，需要支持多轮对话，预算有限'
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].score).toBeGreaterThan(0.5);
    expect(recommendations[0].reason).toBeTruthy();
  });
});
```

---

## 9. 与 Phase 1-2 的衔接

### 9.1 数据依赖

```
Phase 1 输出              Phase 3 依赖
─────────────────────────────────────
pricing_data.json    →    性价比排名
context_window      →    上下文排名
capabilities        →    场景推荐

Phase 2 输出              Phase 3 依赖
─────────────────────────────────────
heatScore           →    热度排名、参与深度
clickCount          →    参与深度
```

### 9.2 集成验证

1. Phase 1-2 完成后，运行数据合并
2. Phase 3 的排名基于完整数据
3. Phase 3 的推荐使用 Phase 1-2 的数据

---

*相关文档: [Phase 2: 动态层实现](./phase-2-dynamic-layer.md) | [Phase 4: 第三方排名接入](./phase-4-third-party.md)*