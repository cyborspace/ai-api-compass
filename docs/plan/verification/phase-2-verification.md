# Phase 2 验收标准

> **阶段**：动态层实现
> **目标**：用户行为可追踪，热度实时计算

---

## 验收检查清单

### 1. 行为追踪 SDK

| 功能 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **搜索事件** | 搜索后事件被记录 | 发送测试事件 | ☐ |
| **点击事件** | 点击后事件被记录 | 发送测试事件 | ☐ |
| **对比事件** | 对比后事件被记录 | 发送测试事件 | ☐ |
| **收藏事件** | 收藏后事件被记录 | 发送测试事件 | ☐ |
| **批量发送** | 事件批量发送到服务器 | 触发 20+ 事件 | ☐ |
| **离线缓冲** | 离线时事件不丢失 | 断开网络测试 | ☐ |

### 2. 热度计算服务

| 功能 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **热度计算** | 分数随行为变化 | 触发行为验证 | ☐ |
| **时间衰减** | 旧事件权重降低 | 验证分数变化 | ☐ |
| **趋势检测** | 正确识别上升/下降 | 注入测试数据 | ☐ |
| **多周期** | 支持 1h/24h/7d/30d | 查询各周期 | ☐ |
| **缓存更新** | 缓存正确更新 | 检查缓存 | ☐ |

### 3. 实时 UI 组件

| 组件 | 验收条件 | 测试方法 | 状态 |
|------|----------|----------|------|
| **HeatBadge** | 正确显示热度等级 | 视觉检查 | ☐ |
| **TrendIndicator** | 正确显示趋势 | 视觉检查 | ☐ |
| **LiveViewers** | 显示实时人数 | WebSocket 测试 | ☐ |
| **ToolListHeatmap** | 热度高亮效果 | 视觉检查 | ☐ |

### 4. 性能指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 事件收集延迟 | < 100ms | - | ☐ |
| 热度更新延迟 | < 1 分钟 | - | ☐ |
| 并发连接数 | 100+ | - | ☐ |
| WebSocket 延迟 | < 500ms | - | ☐ |

---

## 验收命令

### 运行验收测试

```bash
# 方式 1: 运行验收脚本
npm run verify:phase2

# 方式 2: 运行所有测试
npm test -- --grep "dynamic"

# 方式 3: 手动测试
# 打开浏览器开发者工具，控制台执行
analytics.trackSearch('test query', 10);
analytics.trackClick('tool-id', 'search');
```

### 预期输出

```
Phase 2 Verification Results
==================================

行为追踪 SDK:
  ✓ 搜索事件记录
  ✓ 点击事件记录
  ✓ 对比事件记录
  ✓ 收藏事件记录
  ✓ 批量发送正常工作
  ✓ 离线缓冲正常

热度计算服务:
  ✓ 热度计算正确
  ✓ 时间衰减正确
  ✓ 趋势检测准确
  ✓ 多周期支持
  ✓ 缓存更新正常

实时 UI 组件:
  ✓ HeatBadge 显示正确
  ✓ TrendIndicator 显示正确
  ✓ LiveViewers 工作正常
  ✓ ToolListHeatmap 正常

性能指标:
  - 事件收集延迟: 45ms ✓
  - 热度更新延迟: 30s ✓
  - 并发连接数: 150 ✓

==================================
VERIFICATION: PASSED
==================================
```

---

## 验收脚本

### verify-phase2.ts

```typescript
// scripts/verify-phase2.ts
import { prisma } from '../lib/prisma';

interface VerificationResult {
  passed: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}

async function verifyPhase2(): Promise<VerificationResult> {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  console.log('Phase 2 Dynamic Layer Verification\n');
  console.log('==================================\n');

  // 1. 测试行为追踪 SDK
  console.log('1. Testing Behavior Tracker SDK...');
  checks['sdk-search'] = await testSearchEvent();
  checks['sdk-click'] = await testClickEvent();
  checks['sdk-compare'] = await testCompareEvent();
  checks['sdk-batch'] = await testBatchSend();
  console.log('');

  // 2. 测试热度计算
  console.log('2. Testing Heat Calculator...');
  checks['calc-basic'] = await testHeatCalculation();
  checks['calc-decay'] = await testTimeDecay();
  checks['calc-trend'] = await testTrendDetection();
  checks['calc-multi-period'] = await testMultiPeriod();
  console.log('');

  // 3. 测试 UI 组件
  console.log('3. Testing UI Components...');
  checks['ui-heatbadge'] = await testHeatBadge();
  checks['ui-trend'] = await testTrendIndicator();
  checks['ui-liveviewers'] = await testLiveViewers();
  console.log('');

  // 4. 性能测试
  console.log('4. Performance Tests...');
  const perfResults = await testPerformance();
  checks['perf-collection'] = perfResults.collectionLatency < 100;
  checks['perf-update'] = perfResults.updateLatency < 60000;
  console.log('');

  // 输出结果
  console.log('==================================\n');
  const allPassed = Object.values(checks).every(c => c);

  for (const [name, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✓' : '✗'} ${name}`);
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log(`\n==================================`);
  console.log(`VERIFICATION: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log('==================================\n');

  return { passed: allPassed, checks, errors };
}

// 测试搜索事件
async function testSearchEvent(): Promise<boolean> {
  // 模拟发送搜索事件
  const event = {
    eventType: 'search',
    sessionId: 'test-session',
    properties: { query: 'test', resultCount: 10 },
  };

  // 验证事件被记录
  const count = await prisma.userBehaviorEvent.count({
    where: { eventType: 'search' },
  });

  return count > 0;
}

// 测试热度计算
async function testHeatCalculation(): Promise<boolean> {
  const calculator = new HeatCalculator();

  // 生成测试事件
  const events = generateTestEvents(50, 'click');

  // 计算热度
  const score = calculator.calculateHeatScore(events, 24);

  return score > 0 && score <= 100;
}

// 测试时间衰减
async function testTimeDecay(): Promise<boolean> {
  const calculator = new HeatCalculator();

  // 最近的事件
  const recentEvents = generateTestEvents(30, 'click', Date.now());

  // 旧事件
  const oldEvents = generateTestEvents(30, 'click', Date.now() - 12 * 60 * 60 * 1000);

  // 计算分数
  const recentScore = calculator.calculateHeatScore([...recentEvents, ...oldEvents], 24);
  const oldOnlyScore = calculator.calculateHeatScore(oldEvents, 24);

  return recentScore > oldOnlyScore;
}

// 验证趋势检测
async function testTrendDetection(): Promise<boolean> {
  const calculator = new HeatCalculator();

  const rising = calculator.calculateTrend(100, 50);
  const falling = calculator.calculateTrend(50, 100);
  const stable = calculator.calculateTrend(100, 95);

  return rising === 'rising' && falling === 'falling' && stable === 'stable';
}

// 生成测试事件
function generateTestEvents(count: number, type: EventType, timestamp?: number): BehaviorEvent[] {
  const events: BehaviorEvent[] = [];

  for (let i = 0; i < count; i++) {
    events.push({
      id: `test-${i}`,
      eventType: type,
      toolRid: `test-tool-${i % 10}`,
      sessionId: 'test-session',
      timestamp: new Date(timestamp || Date.now()),
      properties: {},
    });
  }

  return events;
}

verifyPhase2().catch(console.error);
```

---

## 集成测试

### 端到端测试

```typescript
// tests/e2e-dynamic-layer.test.ts
describe('Dynamic Layer E2E', () => {
  it('用户搜索后热度更新', async () => {
    // 1. 搜索
    await page.fill('[data-testid="search-input"]', '文本生成');
    await page.click('[data-testid="search-button"]');

    // 2. 点击结果
    await page.click('[data-testid="tool-card"]:first-child');

    // 3. 等待热度更新
    await page.waitForTimeout(65000);

    // 4. 验证热度变化
    const heat = await api.getToolHeat(selectedToolId);
    expect(heat.heatScore24h).toBeGreaterThan(initialHeat);
  });

  it('对比行为被记录', async () => {
    // 1. 添加工具到对比
    await page.click('[data-testid="add-to-compare"]:first-child');
    await page.click('[data-testid="add-to-compare"]:nth-child(2)');

    // 2. 开始对比
    await page.click('[data-testid="start-compare"]');

    // 3. 选择胜出者
    await page.click('[data-testid="winner-selector"]');

    // 4. 验证事件被记录
    const events = await api.getRecentEvents('compare');
    expect(events.length).toBeGreaterThan(0);
  });
});
```

---

## 失败处理

### 如果验收失败

1. **检查失败原因**
   - SDK 问题：检查控制台错误
   - 计算问题：检查日志
   - UI 问题：检查组件代码

2. **修复步骤**
   - 修复代码问题
   - 重新运行验收测试
   - 验证修复效果

3. **修复命令**

```bash
# 修复行为追踪
tsx scripts/fix-behavior-sdk.ts

# 修复热度计算
tsx scripts/fix-heat-calculator.ts

# 修复 UI 组件
tsx scripts/fix-dynamic-ui.ts

# 重新验证
npm run verify:phase2
```

---

## 交接清单

验收通过后，执行以下操作：

- [ ] 更新 README.md 中的动态层状态
- [ ] 标记 Phase 2 完成
- [ ] 通知下一阶段负责人
- [ ] 归档验收报告

---

*相关文档: [Phase 2: 动态层实现](../phase-2-dynamic-layer.md) | [Agent: 动态层](../agents/dynamic-layer-agent.md)*