# 动力层设计 — 排名算法与社区驱动机制

> 动力层的核心思想：**让社区集体智慧决定工具的价值，让优质工具获得更多曝光**。通过将动态层收集的用户行为数据转化为可量化的价值信号，驱动排名的形成和推荐系统的运转。

---

## 1. 设计理念

### 1.1 什么是动力层？

```
静态层（对象层）：
  工具的"身份" → 名称、开发商、功能描述

动态层（动态层）：
  工具的"当前状态" → 今日热度、搜索量、对比次数

动力层（动力层）：
  工具的"社区价值" → 综合排名、用户评分、推荐理由
  驱动这个价值持续变化的机制 → 排名算法、社区激励、生态飞轮
```

### 1.2 动力来源模型

```
┌─────────────────────────────────────────────────────────────┐
│                    动力来源                                  │
├──────────────────────┬──────────────────────────────────────┤
│      被动数据          │        主动贡献                      │
│   (动态层已自动收集)     │      (用户主动参与)                  │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                      │
│  🔍 搜索热度           │  ⭐ 用户评分 (1-5星)                  │
│     反映用户关注趋势     │     反映主观质量感知                  │
│                      │                                      │
│  👆 点击量             │  📝 使用评测 (长文)                   │
│     反映短期兴趣         │     反映深度体验                      │
│                      │                                      │
│  📊 对比次数            │  ✏️ 工具提交 (新工具)                 │
│     反映决策需求         │     扩展工具库                        │
│                      │                                      │
│  ⭐ 收藏数             │  🔧 数据纠错 (修正)                   │
│     反映长期认可         │     提升数据质量                      │
│                      │                                      │
│  🔗 分享数             │  💬 社区讨论                          │
│     反映传播能力         │     促进知识沉淀                      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
                              ↓
                    综合价值量化模型
                              ↓
                    ┌────────────────┐
                    │   排名系统      │
                    └────────────────┘
                              ↓
                    ┌────────────────┐
                    │   推荐系统      │
                    └────────────────┘
```

### 1.3 动力层的价值

1. **解决信息过载**：帮助用户在数百个工具中快速找到最适合自己的
2. **发现新工具**：通过排名和推荐发现未被广泛知晓的优质工具
3. **建立信任**：社区验证的排名比单一来源更可信
4. **激励贡献**：让贡献者看到自己行为对系统的影响

---

## 2. 排名系统设计

### 2.1 排名类型矩阵

| 排名类型 | 维度 | 数据来源 | 更新频率 | 适用场景 |
|----------|------|----------|----------|----------|
| **综合榜** | 多维度加权 | 全部数据源 | 每日 | 快速了解整体排名 |
| **性价比榜** | 价格/性能比 | 第三方 + 社区 | 每日 | 预算有限的用户 |
| **速度榜** | Token/s 吞吐量 | Artificial Analysis | 每小时 | 实时性要求高的场景 |
| **质量榜** | Benchmark 分数 | LMSYS + 社区 | 每日 | 追求最佳效果 |
| **热度榜** | 动态层数据 | 用户行为 | 每5分钟 | 发现当前流行工具 |
| **新兴榜** | 近期上升速度 | 综合数据 | 每日 | 发现新兴工具 |
| **价格榜** | 价格从低到高 | 工具定价 | 每周 | 预算敏感用户 |
| **专场景榜** | 特定使用场景 | 社区标注 | 每周 | 有明确需求的用户 |

### 2.2 综合排名算法

```python
class CompositeRankingCalculator:
    """
    综合排名算法

    原则：
    1. 多数据源融合，避免单点依赖
    2. 动态权重，根据用户偏好调整
    3. 抗刷机制，防止恶意操纵
    4. 可解释性，每个分数都有清晰的来源
    """

    # 静态指标权重（40%）
    STATIC_WEIGHTS = {
        'benchmark_quality': 0.20,    # 基准测试质量
        'context_window': 0.10,       # 上下文窗口
        'pricing_value': 0.10,        # 性价比
    }

    # 第三方数据权重（30%）
    THIRD_PARTY_WEIGHTS = {
        'lmsys_elo': 0.15,            # LMSYS ELO 排名
        'artificial_analysis': 0.10,   # Artificial Analysis 评分
        'openrouter_usage': 0.05,     # OpenRouter 使用量
    }

    # 社区动态权重（30%）
    COMMUNITY_WEIGHTS = {
        'click_popularity': 0.10,     # 点击热度
        'rating_average': 0.10,       # 用户评分
        'engagement_depth': 0.10,     # 参与深度（收藏、分享、评论）
    }

    def calculate_composite_score(self, tool_rid: str) -> CompositeScore:
        tool = self.get_tool(tool_rid)

        score = {
            # 静态指标
            'benchmark_quality': self.normalize_benchmark(tool.benchmark_scores),
            'context_window': self.normalize_window(tool.context_window),
            'pricing_value': self.calculate_pricing_value(tool),

            # 第三方数据
            'lmsys_elo': self.get_lmsys_score(tool),
            'artificial_analysis': self.get_aa_score(tool),
            'openrouter_usage': self.get_usage_score(tool),

            # 社区动态
            'click_popularity': self.get_heat_score(tool_rid, '24h'),
            'rating_average': self.get_rating_average(tool_rid),
            'engagement_depth': self.get_engagement_score(tool_rid),
        }

        # 计算加权总分
        weighted_score = (
            score['benchmark_quality'] * 0.20 +
            score['context_window'] * 0.10 +
            score['pricing_value'] * 0.10 +
            score['lmsys_elo'] * 0.15 +
            score['artificial_analysis'] * 0.10 +
            score['openrouter_usage'] * 0.05 +
            score['click_popularity'] * 0.10 +
            score['rating_average'] * 0.10 +
            score['engagement_depth'] * 0.10
        )

        return CompositeScore(
            total=weighted_score * 100,
            breakdown=score,
            rank=self.calculate_rank(weighted_score),
            confidence=self.calculate_confidence(tool)
        )

    def calculate_confidence(self, tool: Tool) -> float:
        """
        计算排名的置信度

        置信度取决于：
        1. 有多少数据源对该工具有数据
        2. 数据的新鲜程度
        3. 样本量是否足够
        """
        sources_count = sum([
            bool(tool.benchmark_scores),
            bool(tool.lmsys_score),
            bool(tool.aa_score),
            tool.rating_count >= 10,
            tool.heat_score_24h > 0,
        ])

        freshness_score = self.calculate_freshness(tool)

        return (sources_count / 5) * 0.7 + freshness_score * 0.3
```

### 2.3 动态权重系统

```typescript
// 用户可以切换排名视角
const RANKING_PRESETS = {
  // 性能党：最看重基准测试表现
  performance: {
    benchmark_quality: 0.35,
    lmsys_elo: 0.20,
    artificial_analysis: 0.15,
    rating_average: 0.10,
    pricing_value: 0.05,
    click_popularity: 0.05,
    context_window: 0.05,
    engagement_depth: 0.05,
  },

  // 性价比党：价格敏感
  value: {
    pricing_value: 0.30,
    artificial_analysis: 0.20,
    rating_average: 0.15,
    benchmark_quality: 0.10,
    lmsys_elo: 0.10,
    context_window: 0.10,
    engagement_depth: 0.05,
    click_popularity: 0.0,
  },

  // 社区党：跟随大众选择
  popular: {
    click_popularity: 0.30,
    rating_average: 0.20,
    engagement_depth: 0.20,
    lmsys_elo: 0.10,
    artificial_analysis: 0.10,
    pricing_value: 0.05,
    benchmark_quality: 0.05,
  },

  // 新手党：易于上手
  beginner: {
    rating_average: 0.25,
    pricing_value: 0.20,
    engagement_depth: 0.15,
    click_popularity: 0.15,
    artificial_analysis: 0.10,
    benchmark_quality: 0.10,
    context_window: 0.05,
  },
};

// 用户自定义权重
interface CustomWeights {
  [dimension: string]: number;  // 0-1 之间，归一化和为 1
}
```

### 2.4 排名抗刷机制

```python
class AntiGamingProtection:
    """
    防止恶意刷排名
    """

    def detect_suspicious_activity(self, tool_rid: str) -> bool:
        indicators = [
            self.unusual_click_spike(),      # 点击量异常突增
            self.coordinated_ratings(),       # 有组织的评分
            self.new_account_bias(),          # 新账号偏向特定工具
            self.temporal_pattern(),          # 时间规律性
            self.ip_concentration(),          # IP 集中
        ]

        # 如果多个指标同时触发，标记为可疑
        if sum(indicators) >= 3:
            return True  # 可疑
        return False

    def apply_penalty(self, tool_rid: str, activity_score: float) -> float:
        """
        对可疑活动的工具应用惩罚

        惩罚方式：降低该数据源的权重
        """
        if self.detect_suspicious_activity(tool_rid):
            # 可疑活动分数越高，惩罚越重
            penalty = min(activity_score * 0.5, 0.3)  # 最多惩罚 30%
            return activity_score * (1 - penalty)
        return activity_score

    def handle_flagged_tool(self, tool_rid: str):
        """
        处理被标记的工具
        """
        # 降低排名，但不下线
        # 增加审核权重
        # 通知人工审核
```

---

## 3. 社区驱动机制

### 3.1 社区贡献者分层

```
┌─────────────────────────────────────────────────────────────────┐
│                    社区贡献者金字塔                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                           ▲                                     │
│                          /█\        核心贡献者 (1%)              │
│                         /███\       - 工具提交审核               │
│                        /█████\      - 深度评测                   │
│                       /███████\     - 排名算法参与               │
│                      /█████████\    - 社区治理                   │
│                                                                 │
│                         ▲▲▲▲                                   │
│                        ▲▲▲▲▲▲        活跃贡献者 (5%)           │
│                       ▲▲▲▲▲▲▲▲       - 数据纠错                 │
│                      ▲▲▲▲▲▲▲▲▲▲       - 场景标注                 │
│                     ▲▲▲▲▲▲▲▲▲▲▲       - 工具讨论                 │
│                                                                 │
│                        ▲▲▲▲▲▲▲▲                               │
│                       ▲▲▲▲▲▲▲▲▲▲      普通用户 (20%)           │
│                      ▲▲▲▲▲▲▲▲▲▲▲      - 评分/收藏                │
│                     ▲▲▲▲▲▲▲▲▲▲▲      - 搜索/浏览                │
│                    ▲▲▲▲▲▲▲▲▲▲▲▲      - 分享                     │
│                                                                 │
│                   ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲                            │
│                  ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲   沉默访客 (74%)            │
│                 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲    - 仅浏览                   │
│                ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 贡献类型与激励

```typescript
const CONTRIBUTION_TYPES = {
  // 评分贡献
  rating: {
    action: '为工具打分 1-5 星',
    reward: {
      points: 5,              // 5 积分
      badge: '首评徽章',      // 第一次评分
    },
    validation: {
      minCharacters: 0,      // 纯评分不需要文字
      verified: false,       // 无需验证
    },
  },

  // 评测贡献
  review: {
    action: '提交详细使用评测',
    reward: {
      points: 50,            // 50 积分
      badge: '专业评测徽章',
      highlight: '评测可能被精选展示',
    },
    validation: {
      minCharacters: 200,    // 至少 200 字
      verified: true,        // 需要审核
    },
  },

  // 工具提交
  toolSubmission: {
    action: '提交新工具信息',
    reward: {
      points: 100,           // 100 积分
      badge: '发现者徽章',
      credit: '工具页面显示提交者',
    },
    validation: {
      requiredFields: ['name', 'website', 'description', 'category'],
      verified: true,         // 必须审核
    },
  },

  // 数据纠错
  dataCorrection: {
    action: '纠正工具信息错误',
    reward: {
      points: 20,            // 20 积分
      badge: '纠错达人徽章',
    },
    validation: {
      requires: '提供正确信息和来源',
      verified: true,
    },
  },

  // 场景标注
  scenarioTagging: {
    action: '为工具添加使用场景标签',
    reward: {
      points: 10,
      badge: null,
    },
    validation: {
      minTags: 2,             // 至少 2 个标签
      verified: false,
    },
  },
};

// 激励等级
const INCENTIVE_LEVELS = {
  100: { name: '初学者', icon: '🌱' },
  500: { name: '贡献者', icon: '🌿' },
  1000: { name: '达人', icon: '🌳' },
  5000: { name: '专家', icon: '🏆' },
  10000: { name: '传奇', icon: '⭐' },
};
```

### 3.3 社区治理机制

```typescript
// 工具状态机
const TOOL_LIFECYCLE = {
  submitted: {
    status: 'pending_review',
    actions: ['approve', 'reject', 'request_info'],
    notify: '提交者',
  },
  approved: {
    status: 'active',
    actions: ['flag', 'edit', 'merge', 'archive'],
    notify: null,
  },
  flagged: {
    status: 'under_review',
    actions: ['dismiss_flag', 'correct_info', 'archive'],
    notify: 'flagger',
  },
  archived: {
    status: 'inactive',
    actions: ['restore', 'permanent_delete'],
    notify: null,
  },
};

// 审核流程
const reviewProcess = {
  steps: [
    {
      name: '自动检查',
      checks: ['格式验证', '重复检测', '敏感词过滤'],
      autoAction: 'reject',  // 自动拒绝
    },
    {
      name: '社区预审',
      checks: ['基础信息验证'],
      requiredApprovals: 3,
      autoAction: 'approve', // 达到阈值自动通过
    },
    {
      name: '专家审核',
      checks: ['准确性验证', '来源核查'],
      requiredApprovals: 1,
      roles: ['expert', 'admin'],
    },
  ],
};
```

---

## 4. 推荐系统设计

### 4.1 推荐场景

| 场景 | 推荐逻辑 | 数据依赖 |
|------|----------|----------|
| **首页推荐** | 热门工具 + 新兴工具混合 | 热度数据、评分数据 |
| **搜索结果** | 相关度 + 热度 + 个性化 | 查询意图、用户历史 |
| **对比后推荐** | 基于对比的工具推荐 | 对比行为数据 |
| **场景推荐** | 输入使用场景，输出工具 | 场景标签数据 |
| **相似工具** | 相同类别 + 高相似度 | 工具属性数据 |
| **替代工具** | 功能相似但不同 | 工具关系数据 |

### 4.2 推荐算法

```python
class RecommendationEngine:
    """
    推荐引擎

    核心思想：结合协同过滤和内容推荐
    """

    def recommend_for_user(self, user_id: str, context: dict) -> List[Recommendation]:
        # 1. 获取用户画像
        user_profile = self.build_user_profile(user_id)

        # 2. 确定推荐场景
        scenario = context.get('scenario', 'general')

        # 3. 根据场景选择算法
        if scenario == 'search':
            return self.search_based_recommend(user_profile, context)
        elif scenario == 'compare':
            return self.compare_based_recommend(context)
        elif scenario == 'scenario':
            return self.scenario_based_recommend(context)
        else:
            return self.hybrid_recommend(user_profile, context)

    def scenario_based_recommend(self, context: dict) -> List[Tool]:
        """
        场景推荐：用户描述使用场景，系统推荐工具

        示例：用户输入 "我想做一个客服机器人，需要支持中文"
        """
        scenario_description = context.get('description', '')

        # 1. 提取关键需求
        requirements = self.extract_requirements(scenario_description)
        # 结果: ['多轮对话', '中文支持', '低成本', 'API集成']

        # 2. 匹配工具
        candidate_tools = self.match_tools_by_requirements(requirements)

        # 3. 排序
        ranked_tools = self.rank_by_fit(requirements, candidate_tools)

        # 4. 生成推荐理由
        recommendations = []
        for tool in ranked_tools:
            reason = self.generate_recommendation_reason(tool, requirements)
            recommendations.append(Recommendation(
                tool=tool,
                score=tool.match_score,
                reason=reason,
            ))

        return recommendations

    def generate_recommendation_reason(self, tool: Tool, requirements: List[str]) -> str:
        """生成可解释的推荐理由"""

        # 找出匹配的需求
        matched = []
        for req in requirements:
            if self.tool_satisfies_requirement(tool, req):
                matched.append(req)

        if not matched:
            return f"综合表现优秀，适合一般场景"

        return f"满足您的核心需求: {', '.join(matched[:3])}"
```

### 4.3 个性化模型

```typescript
interface UserPreferenceProfile {
  // 显式偏好
  explicitPreferences: {
    favoriteCategories: string[];
    preferredPricing: 'free' | 'paid' | 'any';
    maxBudget?: number;
    preferredProviders?: string[];
  };

  // 隐式偏好（从行为推断）
  implicitPreferences: {
    preferredContextWindow: 'small' | 'medium' | 'large';
    weightOnPerformance: number;      // 0-1
    weightOnPrice: number;            // 0-1
    weightOnEaseOfUse: number;        // 0-1
  };

  // 行为特征
  behavior: {
    avgSessionDuration: number;
    comparisonFrequency: number;     // 每次搜索平均对比工具数
    ratingPropensity: number;        // 评分意愿
    submissionPropensity: number;     // 贡献意愿
  };
}

// 更新用户画像
const updateUserProfile = (userId: string, event: UserBehaviorEvent) => {
  const profile = getUserProfile(userId);

  switch (event.eventType) {
    case 'click':
      // 点击某个工具 → 增加该类别的偏好权重
      profile.implicitPreferences.weightOnPerformance += 0.01;
      break;
    case 'bookmark':
      // 收藏 → 长期价值认可
      profile.implicitPreferences.weightOnEaseOfUse += 0.02;
      break;
    case 'compare_decision':
      // 做出对比决策 → 了解最终偏好
      if (event.winner) {
        const winnerTool = getTool(event.winner);
        profile.explicitPreferences.favoriteCategories
          .push(winnerTool.category);
      }
      break;
  }

  saveUserProfile(userId, profile);
};
```

---

## 5. 动力层的 UI 呈现

### 5.1 排名展示页面

```
┌─────────────────────────────────────────────────────────────────┐
│  AI 工具排行榜                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [综合] [性价比] [速度] [质量] [热度] [新兴]                      │
│                                                                 │
│  视图: [全部] [免费] [付费] [开源]                               │
│  时间: [总榜] [本月] [本周]                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🥇 1. GPT-4 Turbo                                              │
│     OpenAI · $10/1M · 128K context                             │
│     ⭐ 4.8 (2.3k) 🔥 热度第1 · 📈 +12%                          │
│     推荐理由: 综合性能最强，适合复杂任务                          │
│     [查看详情] [对比]                                            │
│                                                                 │
│  🥈 2. Claude 3.5 Sonnet                                         │
│     Anthropic · $3/1M · 200K context                           │
│     ⭐ 4.7 (1.8k) 🔥 热度第2 · 📈 +28%                          │
│     推荐理由: 性价比最高，支持超长上下文                          │
│     [查看详情] [对比]                                            │
│                                                                 │
│  🥉 3. Gemini 1.5 Pro                                           │
│     Google · Free · 1M context                                  │
│     ⭐ 4.5 (980) 🔥 热度第5 · 📈 +45%                           │
│     推荐理由: 免费工具中上下文最长，适合长文档处理                │
│     [查看详情] [对比]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 工具详情页的推荐模块

```
┌─────────────────────────────────────────────────────────────────┐
│  Claude 3.5 Sonnet                                              │
├─────────────────────────────────────────────────────────────────┤
│  [概览] [评分] [对比] [讨论] [历史版本]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  综合评分: ⭐ 4.7 / 5.0                                         │
│  评分分布: ████████████░░ (4-5分占 82%)                          │
│  评价人数: 1,847 人                                              │
│                                                                 │
│  分项评分:                                                      │
│  · 性能表现: ⭐ 4.9 (最满意)                                    │
│  · 性价比:   ⭐ 4.8 (非常满意)                                   │
│  · 易用性:   ⭐ 4.6                                             │
│  · 支持服务: ⭐ 4.4                                             │
│                                                                 │
│  ─────────────────────────────────────                          │
│                                                                 │
│  💬 精选评测 (3 篇)                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "用于代码生成任务时，Claude 3.5 的表现比 GPT-4 更稳定，    │   │
│  │  特别是在处理复杂项目时..." — @开发者张三                 │   │
│  │ 👍 42  | 💬 8  | 完整阅读 →                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────                          │
│                                                                 │
│  🔥 相似工具推荐                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐                              │
│  │ GPT-4o │ │ Gemini │ │ Llama3 │                              │
│  │ ⭐4.8  │ │ ⭐4.5  │ │ ⭐4.3  │                              │
│  └────────┘ └────────┘ └────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 场景推荐功能

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 智能推荐                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  描述您的使用场景:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 我想做一个客服聊天机器人，需要支持多轮对话，预算有限...   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [获取推荐]                                                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────      │
│                                                                 │
│  💡 推荐结果 (基于您的需求匹配度)                                │
│                                                                 │
│  🥇 第1推荐: Claude 3.5 Haiku                                  │
│     匹配度: 95%                                                 │
│     理由: 成本极低 ($0.25/1M)，响应速度快，支持多轮对话          │
│     价格: $0.25/1M tokens                                      │
│     [查看详情] [对比]                                           │
│                                                                 │
│  🥈 第2推荐: GPT-3.5 Turbo                                      │
│     匹配度: 88%                                                 │
│     理由: 生态成熟，文档丰富，API 稳定                           │
│     价格: $0.50/1M tokens                                      │
│     [查看详情] [对比]                                           │
│                                                                 │
│  🥉 第3推荐: Gemini 1.5 Flash                                  │
│     匹配度: 82%                                                 │
│     理由: 免费额度大，支持 1M 上下文                              │
│     价格: Free (部分限制)                                        │
│     [查看详情] [对比]                                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────      │
│                                                                 │
│  📊 您的需求分析:                                               │
│  · 多轮对话: ✓ 全部支持                                        │
│  · 预算有限: ✓ 价格均 < $1/1M                                  │
│  · 生态成熟: ⚠️ 仅 GPT-3.5 生态最完善                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 数据来源与权重

### 6.1 综合排名数据源配置

```typescript
const RANKING_CONFIG = {
  // 第三方权威数据
  thirdParty: {
    lmsys: {
      weight: 0.15,
      updateFrequency: 'daily',
      scoreNormalization: 'elo_to_100',
      coverage: 0.6,           // 60% 的工具有 LMSYS 数据
      antiGamingLevel: 'high',
    },
    artificialAnalysis: {
      weight: 0.10,
      updateFrequency: 'hourly',
      scoreNormalization: 'speed_to_100',
      coverage: 0.4,
      antiGamingLevel: 'high',
    },
    openRouter: {
      weight: 0.05,
      updateFrequency: 'daily',
      scoreNormalization: 'usage_log',
      coverage: 0.5,
      antiGamingLevel: 'medium',
    },
  },

  // 社区数据
  community: {
    ratings: {
      weight: 0.10,
      minSampleSize: 5,       // 至少 5 个评分才计入
      decayFactor: 0.95,      // 老评分权重降低
      antiGamingLevel: 'high',
    },
    engagement: {
      weight: 0.10,
      metrics: {
        bookmarks: 0.3,
        shares: 0.3,
        comments: 0.2,
        reviews: 0.2,
      },
    },
  },

  // 实时热度数据
  heat: {
    weight: 0.10,
    timeWindow: '24h',
    metrics: {
      clicks: 0.4,
      searches: 0.3,
      comparisons: 0.3,
    },
    antiGamingLevel: 'high',
  },
};
```

### 6.2 数据新鲜度策略

```typescript
// 不同数据源的过期策略
const DATA_FRESHNESS = {
  // 实时数据（小时级更新）
  heat: {
    stalenessThreshold: '6h',
    fallbackStrategy: 'use_last_valid',
    displayMode: 'heatmap',    // 数据过期时显示灰色
  },

  // 每日数据
  daily: {
    stalenessThreshold: '48h',
    fallbackStrategy: 'show_last_update_time',
    displayMode: 'timestamp',
  },

  // 第三方数据
  thirdParty: {
    lmsys: {
      stalenessThreshold: '7d',
      fallbackStrategy: 'exclude_from_calculation',
      warningThreshold: '3d',
    },
    artificialAnalysis: {
      stalenessThreshold: '1d',
      fallbackStrategy: 'exclude_from_calculation',
      warningThreshold: '12h',
    },
  },

  // 社区数据
  community: {
    ratings: {
      stalenessThreshold: '90d',  // 90天内的评分有效
      fallbackStrategy: 'decay_weight',
      displayMode: 'review_count_with_date',
    },
    reviews: {
      stalenessThreshold: '180d',
      fallbackStrategy: 'show_with_date',
      displayMode: 'timeline',
    },
  },
};
```

---

## 7. 技术实现要点

### 7.1 排名计算服务

```typescript
// services/ranking-calculator.ts
class RankingCalculator {
  private cache: Map<string, { score: CompositeScore; timestamp: number }>;
  private cacheTTL = 3600000; // 1小时

  async calculateRankings(type: RankingType): Promise<RankingList> {
    const cacheKey = `ranking:${type}`;

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 并行获取所有数据源
    const [tools, heatScores, ratings, thirdPartyData] = await Promise.all([
      this.getAllTools(),
      this.getHeatScores(),
      this.getRatings(),
      this.fetchThirdPartyData(),
    ]);

    // 计算每个工具的分数
    const scores = tools.map(tool => this.calculateScore(tool, {
      heatScores,
      ratings,
      thirdPartyData,
    }));

    // 排序
    scores.sort((a, b) => b.total - a.total);

    // 缓存
    this.setCache(cacheKey, scores);

    return scores;
  }
}
```

### 7.2 数据库 Schema

```prisma
model ToolRating {
  id              String   @id @default(cuid())
  toolRid         String
  userId          String
  overallScore    Float    // 1-5
  easeOfUseScore  Float?   // 1-5
  performanceScore Float?  // 1-5
  valueScore      Float?   // 1-5
  review          String?  // 评测文字
  helpfulVotes    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([toolRid, overallScore])
  @@unique([toolRid, userId])  // 每个用户只能评一次
}

model ToolSubmission {
  id          String   @id @default(cuid())
  toolName    String
  developer   String
  website     String
  description String
  categoryRid String
  submittedBy String
  status      String   @default("pending")
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([status])
}

model Ranking {
  id            String   @id @default(cuid())
  toolRid       String
  rankingType   String   // composite, price_performance, speed, etc.
  rank          Int
  score         Float
  methodology   String
  generatedAt   DateTime @default(now())

  @@unique([toolRid, rankingType, generatedAt])
  @@index([rankingType, rank])
}
```

---

## 8. 激励与飞轮机制

### 8.1 数据飞轮

```
                        用户获得价值
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  用户访问 → 发现工具 → 使用工具 → 贡献数据                   │
│      ▲                              │                       │
│      │                              ▼                       │
│      │                    ┌─────────────────┐                │
│      │                    │   数据质量提升   │                │
│      │                    └─────────────────┘                │
│      │                              │                       │
│      │                              ▼                       │
│      │                    ┌─────────────────┐                │
│      │                    │   排名更准确     │                │
│      │                    └─────────────────┘                │
│      │                              │                       │
│      └──────────────────────────────┘                       │
│                  更好的推荐 → 更好的价值                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 贡献者激励体系

```typescript
const INCENTIVE_PROGRAMS = {
  // 日常激励
  dailyEngagement: {
    search: { points: 1, dailyLimit: 10 },
    click: { points: 1, dailyLimit: 50 },
    bookmark: { points: 5, dailyLimit: 5 },
  },

  // 进阶激励
  milestoneRewards: {
    '10_ratings': { badge: '点评新人', points: 50 },
    '50_ratings': { badge: '点评达人', points: 200 },
    'first_review': { badge: '首评纪念', points: 100 },
    'first_submission': { badge: '发现者', points: 200 },
  },

  // 特殊贡献
  specialContributions: {
    'data_correction': { points: 20, badge: null },
    'helpful_review': { points: 30, badge: '精选评测' },
    'popular_tool_discovery': { points: 100, badge: '伯乐' },
  },
};
```

---

*Last updated: 2026-05-09*
*相关文档: [动态层设计](./dynamic-layer.md) | [数据采集规划](./data-collection.md) | [UI 设计方案](./ui-design.md)*