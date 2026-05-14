# Phase 3 验收标准

> **阶段**：动力层实现
> **目标**：评分、排名、推荐系统完整可用

---

## 验收检查清单

### 1. 评分系统

| 功能 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **评分提交** | 可以提交 1-5 星评分 | POST /api/ratings | ☐ |
| **评分更新** | 可以更新已有评分 | PUT /api/ratings/:id | ☐ |
| **评分查询** | 可以查询工具评分 | GET /api/tools/:rid/rating | ☐ |
| **防刷验证** | 重复评分被阻止 | 发送重复评分 | ☐ |
| **分项评分** | 可以评分易用性/性能/性价比 | POST /api/ratings | ☐ |
| **评测文字** | 可以提交评测文字 | POST /api/ratings | ☐ |

### 2. 排名算法

| 功能 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **综合排名** | 返回正确的综合排名 | GET /api/rankings/composite | ☐ |
| **性价比排名** | 返回正确的性价比排名 | GET /api/rankings/value | ☐ |
| **热度排名** | 返回正确的热度排名 | GET /api/rankings/popularity | ☐ |
| **排序验证** | 排名按分数降序 | 检查排序 | ☐ |
| **分数分解** | 返回各维度分数分解 | 检查响应 | ☐ |
| **可切换视角** | 支持性能/性价比/社区视角 | 切换权重 | ☐ |

### 3. 推荐系统

| 功能 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **首页推荐** | 返回热门和新工具 | GET /api/recommendations/home | ☐ |
| **搜索推荐** | 返回相关工具 | GET /api/recommendations/search?q=... | ☐ |
| **场景推荐** | 基于描述推荐 | POST /api/recommendations/scenario | ☐ |
| **推荐理由** | 返回可解释的理由 | 检查响应 | ☐ |
| **匹配度** | 返回匹配分数 | 检查响应 | ☐ |

### 4. 数据指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 被评分工具数 | 150+ (50%) | - | ☐ |
| 平均评分数/工具 | 5+ | - | ☐ |
| 排名准确性 | 前 10 无明显错误 | - | ☐ |
| 推荐相关性 | 80%+ 相关 | - | ☐ |

---

## 验收命令

### 运行验收测试

```bash
# 方式 1: 运行验收脚本
npm run verify:phase3

# 方式 2: 运行所有测试
npm test -- --grep "motivation"

# 方式 3: API 测试
curl -X POST http://localhost:3000/api/ratings -d '{"toolRid":"xxx","score":5}'
curl http://localhost:3000/api/rankings/composite
curl -X POST http://localhost:3000/api/recommendations/scenario -d '{"description":"客服机器人"}'
```

### 预期输出

```
Phase 3 Motivation Layer Verification
==================================

评分系统:
  ✓ 评分提交成功
  ✓ 评分更新成功
  ✓ 评分查询成功
  ✓ 防刷阻止重复评分
  ✓ 分项评分正常工作
  ✓ 评测文字正常保存

排名算法:
  ✓ 综合排名正确
  ✓ 性价比排名正确
  ✓ 热度排名正确
  ✓ 排序验证通过
  ✓ 分数分解正常
  ✓ 可切换视角

推荐系统:
  ✓ 首页推荐正常
  ✓ 搜索推荐相关
  ✓ 场景推荐可解释
  ✓ 推荐理由清晰
  ✓ 匹配度准确

数据指标:
  - 被评分工具: 180/295 (61%) ✓
  - 平均评分数: 8.2/工具 ✓
  - 排名准确性: 100% ✓
  - 推荐相关性: 85% ✓

==================================
VERIFICATION: PASSED
==================================
```

---

## 验收脚本

### verify-phase3.ts

```typescript
// scripts/verify-phase3.ts
import { prisma } from '../lib/prisma';

interface VerificationResult {
  passed: boolean;
  checks: Record<string, boolean>;
  metrics: Record<string, number>;
  errors: string[];
}

async function verifyPhase3(): Promise<VerificationResult> {
  const checks: Record<string, boolean> = {};
  const metrics: Record<string, number> = {};
  const errors: string[] = [];

  console.log('Phase 3 Motivation Layer Verification\n');
  console.log('==================================\n');

  // 1. 测试评分系统
  console.log('1. Testing Rating System...');
  checks['rating-submit'] = await testRatingSubmit();
  checks['rating-update'] = await testRatingUpdate();
  checks['rating-query'] = await testRatingQuery();
  checks['rating-antispam'] = await testAntiSpam();
  console.log('');

  // 2. 测试排名算法
  console.log('2. Testing Ranking Algorithm...');
  checks['ranking-composite'] = await testCompositeRanking();
  checks['ranking-value'] = await testValueRanking();
  checks['ranking-popularity'] = await testPopularityRanking();
  checks['ranking-sort'] = await testRankingSort();
  checks['ranking-breakdown'] = await testScoreBreakdown();
  console.log('');

  // 3. 测试推荐系统
  console.log('3. Testing Recommendation System...');
  checks['rec-home'] = await testHomeRecommendations();
  checks['rec-search'] = await testSearchRecommendations();
  checks['rec-scenario'] = await testScenarioRecommendations();
  checks['rec-reason'] = await testRecommendationReasons();
  console.log('');

  // 4. 收集数据指标
  console.log('4. Collecting Data Metrics...');
  metrics['rated-tools'] = await countRatedTools();
  metrics['avg-ratings'] = await calculateAvgRatings();
  metrics['ranking-accuracy'] = await calculateRankingAccuracy();
  metrics['rec-relevance'] = await calculateRecommendationRelevance();
  console.log('');

  // 输出结果
  console.log('==================================\n');
  const allPassed = Object.values(checks).every(c => c);

  for (const [name, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✓' : '✗'} ${name}`);
  }

  console.log('\nData Metrics:');
  console.log(`  - Rated tools: ${metrics['rated-tools']}/295`);
  console.log(`  - Avg ratings: ${metrics['avg-ratings']}`);
  console.log(`  - Ranking accuracy: ${metrics['ranking-accuracy']}%`);
  console.log(`  - Recommendation relevance: ${metrics['rec-relevance']}%`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\n==================================`);
  console.log(`VERIFICATION: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log('==================================\n');

  return { passed: allPassed, checks, metrics, errors };
}

// 测试评分提交
async function testRatingSubmit(): Promise<boolean> {
  const ratingService = new RatingService();

  const result = await ratingService.submitRating({
    toolRid: 'test-tool',
    userId: 'test-user',
    overallScore: 5,
    wouldRecommend: true,
  });

  return result.success;
}

// 测试防刷
async function testAntiSpam(): Promise<boolean> {
  const ratingService = new RatingService();

  // 第一次评分
  await ratingService.submitRating({
    toolRid: 'test-tool',
    userId: 'test-user-spam',
    overallScore: 5,
    wouldRecommend: true,
  });

  // 第二次评分（应该被阻止）
  const result = await ratingService.submitRating({
    toolRid: 'test-tool',
    userId: 'test-user-spam',
    overallScore: 1,
    wouldRecommend: false,
  });

  return !result.success;
}

// 测试综合排名
async function testCompositeRanking(): Promise<boolean> {
  const rankingService = new RankingService();

  const rankings = await rankingService.getRankings('composite');

  // 验证排序
  for (let i = 1; i < rankings.length; i++) {
    if (rankings[i].score > rankings[i - 1].score) {
      return false;
    }
  }

  return rankings.length > 0;
}

// 测试场景推荐
async function testScenarioRecommendations(): Promise<boolean> {
  const recService = new RecommendationService();

  const recommendations = await recService.getRecommendations({
    type: 'scenario',
    scenarioDescription: '我想做一个客服机器人，需要支持多轮对话，预算有限',
  });

  if (recommendations.length === 0) return false;

  // 检查推荐理由
  return recommendations.every(r => r.reason && r.score > 0);
}

// 统计被评分的工具数
async function countRatedTools(): Promise<number> {
  const count = await prisma.rating.groupBy({
    by: ['toolRid'],
    _count: true,
  });

  return count.length;
}

// 计算平均评分数
async function calculateAvgRatings(): Promise<number> {
  const ratings = await prisma.rating.findMany({
    select: { toolRid: true },
  });

  const toolCounts = new Map<string, number>();
  for (const r of ratings) {
    toolCounts.set(r.toolRid, (toolCounts.get(r.toolRid) || 0) + 1);
  }

  const counts = Array.from(toolCounts.values());
  return counts.reduce((a, b) => a + b, 0) / counts.length;
}

// 计算推荐相关性（简化版：场景推荐有理由即为相关）
async function calculateRecommendationRelevance(): Promise<number> {
  const recService = new RecommendationService();

  const recommendations = await recService.getRecommendations({
    type: 'scenario',
    scenarioDescription: '文本生成工具',
  });

  const relevant = recommendations.filter(r => r.reason && r.score > 0.3);
  return (relevant.length / recommendations.length) * 100;
}

verifyPhase3().catch(console.error);
```

---

## 集成测试

### 端到端测试

```typescript
// tests/e2e-motivation-layer.test.ts
describe('Motivation Layer E2E', () => {
  it('用户可以对工具评分', async () => {
    // 1. 进入工具详情页
    await page.goto('/tools/claude-3-5-sonnet');

    // 2. 点击评分按钮
    await page.click('[data-testid="rate-button"]');

    // 3. 填写评分
    await page.click('[data-testid="star-5"]');

    // 4. 提交
    await page.click('[data-testid="submit-rating"]');

    // 5. 验证评分成功
    const rating = await api.getToolRating('claude-3-5-sonnet');
    expect(rating.overallCount).toBeGreaterThan(0);
  });

  it('用户可以查看排名', async () => {
    // 1. 进入排名页
    await page.goto('/rankings');

    // 2. 选择综合榜
    await page.click('[data-testid="composite-ranking"]');

    // 3. 验证排名显示
    const rankings = await api.getRankings('composite');
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].score).toBeGreaterThanOrEqual(rankings[1].score);
  });

  it('用户可以获取场景推荐', async () => {
    // 1. 进入推荐页
    await page.goto('/recommendations');

    // 2. 输入场景描述
    await page.fill('[data-testid="scenario-input"]', '客服机器人，多轮对话，预算有限');

    // 3. 获取推荐
    await page.click('[data-testid="get-recommendations"]');

    // 4. 验证推荐结果
    const recommendations = await api.getScenarioRecommendations(
      '客服机器人，多轮对话，预算有限'
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].reason).toBeTruthy();
  });
});
```

---

## 失败处理

### 如果验收失败

1. **评分系统问题**
   - 检查评分 API
   - 检查防刷逻辑
   - 检查数据库写入

2. **排名算法问题**
   - 检查分数计算
   - 检查排序逻辑
   - 检查权重配置

3. **推荐系统问题**
   - 检查匹配算法
   - 检查推荐理由生成
   - 检查推荐排序

4. **修复命令**

```bash
# 修复评分系统
tsx scripts/fix-rating.ts

# 修复排名算法
tsx scripts/fix-ranking.ts

# 修复推荐系统
tsx scripts/fix-recommendation.ts

# 重新验证
npm run verify:phase3
```

---

## 交接清单

验收通过后，执行以下操作：

- [ ] 更新 README.md 中的动力层状态
- [ ] 标记 Phase 3 完成
- [ ] 进行集成测试
- [ ] 准备 Phase 4（第三方数据接入）

---

*相关文档: [Phase 3: 动力层实现](../phase-3-motivation-layer.md) | [Agent: 动力层](../agents/motivation-layer-agent.md)*