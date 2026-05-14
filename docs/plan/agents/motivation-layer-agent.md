# 动力层 Agent

> **任务**：实现社区评分系统、排名算法和推荐系统
> **前置条件**：Phase 1 和 Phase 2 完成

---

## Agent 信息

```yaml
name: motivation-layer-agent
type: general_purpose_task
priority: P0
timeout: 60 minutes
parallel: true

sub_agents:
  - rating-system-agent
  - ranking-algorithm-agent
  - recommendation-engine-agent
```

---

## Sub-Agent 1: 评分系统

### 任务定义

```yaml
name: rating-system-agent
description: 实现社区评分系统
output_dir: src/services
files:
  - rating-service.ts
  - anti-spam.ts
components_dir: src/components/rating
component_files:
  - StarRating.tsx
  - RatingDisplay.tsx
  - RatingModal.tsx
```

### 实现规范

#### RatingService

```typescript
// src/services/rating-service.ts
interface RatingInput {
  toolRid: string;
  userId: string;
  overallScore: number;
  easeOfUseScore?: number;
  performanceScore?: number;
  valueScore?: number;
  review?: string;
  useCase?: string;
  wouldRecommend: boolean;
}

class RatingService {
  private antiSpam: AntiSpamValidator;

  async submitRating(input: RatingInput): Promise<RatingResult> {
    // 1. 防刷验证
    const validation = this.antiSpam.validate(input);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Rating blocked by spam protection',
        issues: validation.issues,
      };
    }

    // 2. 检查是否已评分
    const existing = await this.getUserRating(input.userId, input.toolRid);
    if (existing) {
      // 更新评分
      await this.updateRating(existing.id, input);
    } else {
      // 创建新评分
      await this.createRating(input);
    }

    // 3. 更新工具平均分
    const toolRating = await this.calculateToolRating(input.toolRid);

    return {
      success: true,
      rating: toolRating,
      weight: validation.weight,
    };
  }

  async getToolRating(toolRid: string): Promise<ToolRating> {
    const ratings = await this.getRatings(toolRid);

    if (ratings.length === 0) {
      return {
        toolRid,
        overallScore: 0,
        overallCount: 0,
      };
    }

    // 加权平均（考虑防刷权重）
    const weightedSum = ratings.reduce(
      (sum, r) => sum + r.overallScore * r.weight,
      0
    );
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);

    return {
      toolRid,
      overallScore: weightedSum / totalWeight,
      overallCount: ratings.length,
      easeOfUseAvg: this.calculateAvg(ratings, 'easeOfUseScore'),
      performanceAvg: this.calculateAvg(ratings, 'performanceScore'),
      valueAvg: this.calculateAvg(ratings, 'valueScore'),
      wouldRecommendRate: this.calculateRecommendRate(ratings),
      scoreDistribution: this.calculateDistribution(ratings),
    };
  }

  private calculateAvg(ratings: UserRating[], field: string): number {
    const values = ratings
      .map(r => (r as any)[field])
      .filter(v => v != null);

    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateRecommendRate(ratings: UserRating[]): number {
    const wouldRecommend = ratings.filter(r => r.wouldRecommend).length;
    return wouldRecommend / ratings.length;
  }

  private calculateDistribution(ratings: UserRating[]): ScoreDistribution {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      const score = Math.round(r.overallScore);
      if (score >= 1 && score <= 5) {
        distribution[score as 1|2|3|4|5]++;
      }
    });
    return distribution;
  }
}
```

#### AntiSpamValidator

```typescript
// src/services/anti-spam.ts
interface ValidationResult {
  valid: boolean;
  issues: string[];
  weight: number;
}

class AntiSpamValidator {
  validate(input: RatingInput): ValidationResult {
    const issues: string[] = [];

    // 1. 检查重复评分
    if (this.hasDuplicateRating(input.userId, input.toolRid)) {
      issues.push('duplicate_rating');
    }

    // 2. 检查评分速度（每小时不超过 10 个）
    if (this.exceedsRatingSpeed(input.userId)) {
      issues.push('too_many_ratings');
    }

    // 3. 检查评论重复
    if (input.review && this.isDuplicateReview(input.review)) {
      issues.push('duplicate_review');
    }

    // 4. 检查可疑模式
    if (this.hasSuspiciousPattern(input)) {
      issues.push('suspicious_pattern');
    }

    // 5. 检查评论长度
    if (input.review && input.review.length < 10) {
      issues.push('review_too_short');
    }

    // 计算权重
    const weight = issues.length === 0 ? 1 : 0.5;

    return {
      valid: issues.length === 0 || weight > 0.3,
      issues,
      weight,
    };
  }

  private async hasDuplicateRating(userId: string, toolRid: string): Promise<boolean> {
    const existing = await prisma.rating.findFirst({
      where: { userId, toolRid },
    });
    return !!existing;
  }

  private async exceedsRatingSpeed(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.rating.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });
    return count >= 10;
  }

  private isDuplicateReview(review: string): boolean {
    // 检查相似评论
    const normalized = review.toLowerCase().trim();
    return this.similarReviews.has(normalized);
  }

  private hasSuspiciousPattern(input: RatingInput): boolean {
    // 检查刷分模式
    // - 全 5 分但无评论
    // - 评论内容重复
    // - 短时间内多次评分
    return false;
  }
}
```

### UI 组件

#### StarRating

```tsx
// src/components/rating/StarRating.tsx
interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'medium',
  showLabel = true,
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className={`star-rating size-${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className={`star ${
            star <= (hoverValue || value) ? 'filled' : ''
          }`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          disabled={readonly}
        >
          {star <= (hoverValue || value) ? '★' : '☆'}
        </button>
      ))}
      {showLabel && (
        <span className="rating-label">{getRatingLabel(value)}</span>
      )}
    </div>
  );
};

function getRatingLabel(score: number): string {
  if (score >= 4.5) return '非常好';
  if (score >= 3.5) return '好';
  if (score >= 2.5) return '一般';
  if (score >= 1.5) return '较差';
  return '很差';
}
```

#### RatingDisplay

```tsx
// src/components/rating/RatingDisplay.tsx
interface RatingDisplayProps {
  rating: ToolRating;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating }) => {
  return (
    <div className="rating-display">
      <div className="overall-score">
        <span className="score-value">{rating.overallScore.toFixed(1)}</span>
        <StarRating value={Math.round(rating.overallScore)} readonly />
        <span className="count">{rating.overallCount} 人评价</span>
      </div>

      <div className="score-bars">
        {[5, 4, 3, 2, 1].map(star => {
          const count = rating.scoreDistribution[star];
          const percent = (count / rating.overallCount) * 100;

          return (
            <div key={star} className="score-bar">
              <span className="star-label">{star}星</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="percent">{percent.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>

      {rating.easeOfUseAvg > 0 && (
        <div className="sub-scores">
          <div className="sub-score">
            <span>易用性</span>
            <StarRating value={rating.easeOfUseAvg} readonly size="small" />
          </div>
          <div className="sub-score">
            <span>性能</span>
            <StarRating value={rating.performanceAvg} readonly size="small" />
          </div>
          <div className="sub-score">
            <span>性价比</span>
            <StarRating value={rating.valueAvg} readonly size="small" />
          </div>
        </div>
      )}
    </div>
  );
};
```

### 验收标准

- [ ] 用户可以提交 1-5 星评分
- [ ] 评分防刷机制有效
- [ ] 平均分实时更新
- [ ] 评分分布正确显示

---

## Sub-Agent 2: 排名算法

### 任务定义

```yaml
name: ranking-algorithm-agent
description: 实现排名计算引擎
output_dir: src/services/ranking
files:
  - ranking-calculator.ts
  - composite-scorer.ts
  - anti-gaming.ts
  - ranking-scheduler.ts
```

### 实现规范

#### CompositeScorer

```typescript
// src/services/ranking/composite-scorer.ts
interface ScorerConfig {
  weights: RankingWeights;
  thirdPartyWeight: number;
  communityWeight: number;
}

// 默认权重配置
const DEFAULT_WEIGHTS: RankingWeights = {
  // 静态指标 (40%)
  benchmarkQuality: 0.20,
  contextWindow: 0.10,
  pricingValue: 0.10,

  // 第三方数据 (30%) - Phase 4 才接入真实数据
  lmsysElo: 0.15,
  artificialAnalysis: 0.10,
  openrouterUsage: 0.05,

  // 社区动态 (30%)
  clickPopularity: 0.10,
  ratingAverage: 0.10,
  engagementDepth: 0.10,
};

class CompositeScorer {
  private config: ScorerConfig;

  constructor(config: Partial<ScorerConfig> = {}) {
    this.config = {
      weights: { ...DEFAULT_WEIGHTS, ...config.weights },
      thirdPartyWeight: config.thirdPartyWeight ?? 0.30,
      communityWeight: config.communityWeight ?? 0.30,
    };
  }

  calculateScore(tool: ToolWithData): CompositeScore {
    // 1. 静态指标 (40%)
    const staticScore = this.calculateStaticScore(tool);

    // 2. 第三方数据 (30%) - 使用模拟数据
    const thirdPartyScore = this.calculateThirdPartyScore(tool);

    // 3. 社区动态 (30%)
    const communityScore = this.calculateCommunityScore(tool);

    // 4. 综合评分
    const total =
      staticScore.total * 0.40 +
      thirdPartyScore.total * 0.30 +
      communityScore.total * 0.30;

    return {
      total,
      breakdown: {
        static: staticScore,
        thirdParty: thirdPartyScore,
        community: communityScore,
      },
    };
  }

  private calculateStaticScore(tool: ToolWithData): ScoreBreakdown {
    const { weights } = this.config;

    // Benchmark 质量（如果有真实数据，否则用模拟）
    const benchmark = (tool.benchmarkScore || 50) * weights.benchmarkQuality;

    // 上下文窗口（归一化到 0-100）
    const contextScore = Math.min(100, (tool.contextWindow / 1000000) * 100);
    const context = contextScore * weights.contextWindow;

    // 性价比（价格越低分数越高）
    const priceScore = this.calculatePricingScore(tool);
    const pricing = priceScore * weights.pricingValue;

    return {
      benchmark,
      contextWindow: context,
      pricingValue: pricing,
      total: benchmark + context + pricing,
    };
  }

  private calculateThirdPartyScore(tool: ToolWithData): ScoreBreakdown {
    // Phase 4 之前使用模拟数据
    const { weights } = this.config;

    // 模拟 LMSYS 数据（知名工具较高分）
    const lmsys = this.getSimulatedLmsys(tool.name) * weights.lmsysElo;

    // 模拟 Artificial Analysis 数据
    const aa = this.getSimulatedAA(tool.name) * weights.artificialAnalysis;

    // 模拟 OpenRouter 使用量
    const usage = this.getSimulatedUsage(tool.name) * weights.openrouterUsage;

    return {
      lmsysElo: lmsys,
      artificialAnalysis: aa,
      openrouterUsage: usage,
      total: lmsys + aa + usage,
    };
  }

  private calculateCommunityScore(tool: ToolWithData): ScoreBreakdown {
    const { weights } = this.config;

    // 点击热度（归一化）
    const click = ((tool.heatScore24h || 0) / 100) * 100 * weights.clickPopularity;

    // 用户评分（归一化到 0-100）
    const rating = ((tool.avgRating || 3) / 5) * 100 * weights.ratingAverage;

    // 参与深度（收藏 + 分享 + 评论）
    const engagement = this.calculateEngagement(tool) * weights.engagementDepth;

    return {
      clickPopularity: click,
      ratingAverage: rating,
      engagementDepth: engagement,
      total: click + rating + engagement,
    };
  }

  // 模拟第三方数据
  private getSimulatedLmsys(name: string): number {
    const lower = name.toLowerCase();
    if (lower.includes('gpt-4') || lower.includes('claude')) {
      return 85 + Math.random() * 10;  // 85-95
    }
    if (lower.includes('gpt-3.5') || lower.includes('gemini')) {
      return 75 + Math.random() * 10;  // 75-85
    }
    return 60 + Math.random() * 20;  // 60-80
  }

  private getSimulatedAA(name: string): number {
    const lower = name.toLowerCase();
    if (lower.includes('gpt-4') || lower.includes('claude')) {
      return 80 + Math.random() * 10;
    }
    return 65 + Math.random() * 20;
  }

  private getSimulatedUsage(name: string): number {
    const lower = name.toLowerCase();
    if (lower.includes('gpt-4') || lower.includes('gpt-3.5')) {
      return 80 + Math.random() * 15;
    }
    return 40 + Math.random() * 40;
  }
}
```

#### RankingCalculator

```typescript
// src/services/ranking/ranking-calculator.ts
class RankingCalculator {
  private scorer: CompositeScorer;
  private antiGaming: AntiGamingDetector;

  constructor() {
    this.scorer = new CompositeScorer();
    this.antiGaming = new AntiGamingDetector();
  }

  async calculateAllRankings(type: RankingType = 'composite'): Promise<Ranking[]> {
    // 1. 获取所有工具
    const tools = await this.getAllToolsWithData();

    // 2. 计算综合分数
    const scored = tools.map(tool => {
      const score = this.scorer.calculateScore(tool);

      // 3. 检测异常
      if (this.antiGaming.detect(tool)) {
        score.total *= 0.8;  // 降低可疑工具的分数
      }

      return {
        toolRid: tool.rid,
        rankingType: type,
        rank: 0,
        score: score.total,
        breakdown: score.breakdown,
        confidence: this.calculateConfidence(tool, score),
        generatedAt: new Date(),
      };
    });

    // 4. 排序
    scored.sort((a, b) => b.score - a.score);

    // 5. 分配排名
    scored.forEach((item, index) => {
      item.rank = index + 1;
    });

    // 6. 保存
    await this.saveRankings(scored);

    return scored;
  }

  async calculateRankingsByType(types: RankingType[]): Promise<Map<RankingType, Ranking[]>> {
    const results = new Map<RankingType, Ranking[]>();

    for (const type of types) {
      const rankings = await this.calculateAllRankings(type);
      results.set(type, rankings);
    }

    return results;
  }
}
```

### 验收标准

- [ ] 综合排名正确反映工具质量
- [ ] 可切换不同视角（性能党/性价比党/社区党）
- [ ] 排名数据可解释（显示分数分解）
- [ ] 防刷机制有效

---

## Sub-Agent 3: 推荐系统

### 任务定义

```yaml
name: recommendation-engine-agent
description: 实现个性化推荐系统
output_dir: src/services/recommendation
files:
  - rec-engine.ts
  - scenario-match.ts
components_dir: src/components/recommendation
component_files:
  - RecommendationPanel.tsx
  - ScenarioInput.tsx
```

### 实现规范

#### RecommendationEngine

```typescript
// src/services/recommendation/rec-engine.ts
interface RecommendationContext {
  type: 'home' | 'search' | 'compare' | 'scenario';
  userId?: string;
  query?: string;
  filters?: Filter[];
  selectedTools?: string[];
  scenarioDescription?: string;
}

class RecommendationEngine {
  async getRecommendations(ctx: RecommendationContext, limit = 10): Promise<Recommendation[]> {
    switch (ctx.type) {
      case 'home':
        return this.getHomeRecommendations(limit);
      case 'search':
        return this.getSearchRecommendations(ctx.query!, ctx.filters, limit);
      case 'compare':
        return this.getCompareRecommendations(ctx.selectedTools!, limit);
      case 'scenario':
        return this.getScenarioRecommendations(ctx.scenarioDescription!, limit);
      default:
        return [];
    }
  }

  private async getHomeRecommendations(limit: number): Promise<Recommendation[]> {
    // 首页推荐：热门 + 新兴 + 个性化
    const hotTools = await this.getHotTools(limit * 0.6);
    const risingTools = await this.getRisingTools(limit * 0.3);
    const personalTools = await this.getPersonalRecommendations(limit * 0.1);

    return [...hotTools, ...risingTools, ...personalTools].slice(0, limit);
  }

  private async getSearchRecommendations(
    query: string,
    filters: Filter[] | undefined,
    limit: number
  ): Promise<Recommendation[]> {
    // 搜索推荐：相关性 + 热门 + 个性化
    const relevantTools = await this.searchTools(query, filters, limit * 0.5);
    const hotTools = await this.getHotTools(limit * 0.3);
    const similarTools = await this.getSimilarToSearch(query, limit * 0.2);

    return this.mergeAndRank([...relevantTools, ...hotTools, ...similarTools], limit);
  }

  private async getScenarioRecommendations(
    description: string,
    limit: number
  ): Promise<Recommendation[]> {
    // 场景推荐：基于描述匹配
    const matcher = new ScenarioMatcher();
    const tools = await this.getAllTools();

    const scored = matcher.matchTools(description, tools);

    return scored.slice(0, limit).map(({ tool, score, reason }) => ({
      tool,
      score,
      reason,
      matchDetails: matcher.getMatchDetails(tool, description),
    }));
  }
}
```

#### ScenarioMatcher

```tsx
// src/services/recommendation/scenario-match.ts
class ScenarioMatcher {
  matchTools(requirements: string, tools: Tool[]): ScoredTool[] {
    // 1. 提取关键词
    const keywords = this.extractKeywords(requirements);

    // 2. 为每个工具计算匹配度
    const scored = tools.map(tool => {
      const score = this.calculateMatchScore(tool, keywords);
      const reason = this.generateReason(tool, keywords);
      const matchDetails = this.getMatchDetails(tool, keywords);

      return { tool, score, reason, matchDetails };
    });

    // 3. 过滤和排序
    return scored
      .filter(s => s.score >= 0.3)
      .sort((a, b) => b.score - a.score);
  }

  private extractKeywords(requirements: string): string[] {
    const text = requirements.toLowerCase();

    // 常见需求关键词
    const keywordPatterns = [
      { pattern: /客服|chatbot|对话机器人/i, keywords: ['text_generation', 'function_calling', 'multi_turn'] },
      { pattern: /代码|coding|programming/i, keywords: ['code_generation'] },
      { pattern: /图像|图片|设计|画图/i, keywords: ['image_generation'] },
      { pattern: /视频|video/i, keywords: ['video_generation'] },
      { pattern: /长文本|long|文档|article/i, keywords: ['context_128k', 'context_200k'] },
      { pattern: /免费|free|no.*cost/i, keywords: ['free', 'freemium'] },
      { pattern: /便宜|cheap|budget/i, keywords: ['low_price'] },
      { pattern: /中文|chinese/i, keywords: ['chinese_support'] },
    ];

    const keywords: string[] = [];
    for (const { pattern, keywords: kws } of keywordPatterns) {
      if (pattern.test(text)) {
        keywords.push(...kws);
      }
    }

    return keywords.length > 0 ? keywords : ['text_generation'];
  }

  private calculateMatchScore(tool: Tool, keywords: string[]): number {
    let score = 0;
    const props = tool as any;

    for (const keyword of keywords) {
      // 能力匹配
      if (props.capabilities?.includes(keyword)) {
        score += 0.4;
      }

      // 分类匹配
      if (props.category?.includes(keyword) || props.categories?.some((c: string) => c.includes(keyword))) {
        score += 0.2;
      }

      // 价格匹配
      if (keyword === 'free' && (props.pricingModel === 'free' || props.pricingModel === 'freemium')) {
        score += 0.3;
      }
      if (keyword === 'low_price' && props.inputPrice < 5) {
        score += 0.2;
      }

      // 上下文匹配
      if (keyword === 'context_128k' && props.contextWindow >= 128000) {
        score += 0.3;
      }
      if (keyword === 'context_200k' && props.contextWindow >= 200000) {
        score += 0.4;
      }
    }

    return Math.min(1, score);
  }

  private generateReason(tool: Tool, keywords: string[]): string {
    const props = tool as any;
    const matched: string[] = [];

    for (const keyword of keywords) {
      if (props.capabilities?.includes(keyword)) {
        matched.push(this.keywordToLabel(keyword));
      }
    }

    if (matched.length > 0) {
      return `满足您的核心需求: ${matched.slice(0, 3).join(', ')}`;
    }

    return '综合表现优秀，适合一般场景';
  }

  private keywordToLabel(keyword: string): string {
    const labels: Record<string, string> = {
      'text_generation': '文本生成',
      'code_generation': '代码生成',
      'image_generation': '图像生成',
      'video_generation': '视频生成',
      'function_calling': '函数调用',
      'multi_turn': '多轮对话',
      'chinese_support': '中文支持',
    };
    return labels[keyword] || keyword;
  }
}
```

### 验收标准

- [ ] 首页推荐包含热门和新兴工具
- [ ] 搜索推荐结果相关
- [ ] 场景推荐可解释
- [ ] 推荐理由清晰

---

## 集成验证

### 测试用例

```typescript
// tests/motivation-layer.test.ts
describe('Motivation Layer', () => {
  describe('RatingService', () => {
    it('提交评分成功', async () => {
      const result = await ratingService.submitRating({
        toolRid: 'claude-3-5-sonnet',
        userId: 'user-123',
        overallScore: 5,
        review: '非常好用，特别适合代码生成',
        wouldRecommend: true,
      });

      expect(result.success).toBe(true);
    });

    it('更新工具平均分', async () => {
      const rating = await ratingService.getToolRating('claude-3-5-sonnet');
      expect(rating.overallScore).toBeGreaterThan(0);
      expect(rating.overallCount).toBeGreaterThan(0);
    });

    it('防刷阻止重复评分', async () => {
      const result = await ratingService.submitRating({
        toolRid: 'claude-3-5-sonnet',
        userId: 'user-123',
        overallScore: 5,
        wouldRecommend: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('duplicate');
    });
  });

  describe('RankingCalculator', () => {
    it('综合排名正确', async () => {
      const rankings = await rankingCalculator.calculateAllRankings('composite');

      expect(rankings.length).toBeGreaterThan(0);
      expect(rankings[0].score).toBeGreaterThanOrEqual(rankings[1].score);
    });

    it('排名数据可解释', async () => {
      const rankings = await rankingCalculator.calculateAllRankings('composite');
      const top = rankings[0];

      expect(top.breakdown).toBeDefined();
      expect(top.confidence).toBeGreaterThan(0);
    });
  });

  describe('RecommendationEngine', () => {
    it('场景推荐相关', async () => {
      const recommendations = await recEngine.getRecommendations({
        type: 'scenario',
        scenarioDescription: '我想做一个客服机器人，需要支持多轮对话，预算有限',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].score).toBeGreaterThan(0.5);
      expect(recommendations[0].reason).toBeTruthy();
    });
  });
});
```

---

*相关文档: [Phase 3: 动力层实现](../phase-3-motivation-layer.md)*