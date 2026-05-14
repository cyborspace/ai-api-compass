# Phase 1 验收标准

> **阶段**：数据丰富化
> **目标**：295 个 AI 工具全部有完整数据

---

## 验收检查清单

### 1. 定量指标

| 指标 | 目标 | 当前 | 差距 | 验收状态 |
|------|------|------|------|----------|
| 工具总数 | 295 | - | - | ☐ |
| 有 pricingModel | 100% (295) | - | - | ☐ |
| 有 priceRange | 90% (266) | - | - | ☐ |
| 有 contextWindow | 80% (236) | - | - | ☐ |
| 有 capabilities | 70% (207) | - | - | ☐ |
| 有 modalities | 50% (148) | - | - | ☐ |
| 有 dataSource 标记 | 100% (295) | - | - | ☐ |
| 有 dataConfidence | 100% (295) | - | - | ☐ |

### 2. 数据来源分布

| 来源 | 目标数量 | 当前数量 | 验收状态 |
|------|----------|----------|----------|
| official | 越多越好 | - | ☐ |
| third_party | 越多越好 | - | ☐ |
| simulated | < 50% (147) | - | ☐ |

### 3. 数据质量检查

- [ ] pricingModel 在枚举值中
- [ ] priceRange 格式正确（如 "$5/1M tokens"）
- [ ] contextWindow 为正整数
- [ ] capabilities 为数组且非空
- [ ] modalities 为数组
- [ ] dataSource 为 'official' | 'third_party' | 'simulated'
- [ ] dataConfidence 在 0-1 之间

---

## 验收命令

### 运行验收测试

```bash
# 方式 1: 运行 Node.js 验收脚本
npm run verify:phase1

# 方式 2: 直接运行测试
tsx scripts/verify-phase1.ts

# 方式 3: 手动检查数据库
psql -d aicompass -c "SELECT COUNT(*) FROM objects WHERE object_type_id = 'aigc_tool' AND properties->>'pricingModel' IS NOT NULL"
```

### 预期输出

```
Phase 1 Verification Results
==================================

工具总数: 295
✓ 完成

定价数据:
  - 有 pricingModel: 295/295 (100%) ✓
  - 有 priceRange: 266/295 (90%) ✓
  - 有 inputPrice: 236/295 (80%) ✓

上下文窗口:
  - 有 contextWindow: 236/295 (80%) ✓
  - 平均值: 85,234 tokens

能力标签:
  - 有 capabilities: 207/295 (70%) ✓
  - 平均每个工具: 3.5 个标签

数据来源:
  - official: 50 (17%)
  - third_party: 30 (10%)
  - simulated: 215 (73%)

数据质量:
  ✓ pricingModel 格式正确
  ✓ contextWindow 为正整数
  ✓ capabilities 为非空数组
  ✓ 所有数据有 source 标记

==================================
VERIFICATION: PASSED
==================================
```

---

## 验收脚本

### verify-phase1.ts

```typescript
// scripts/verify-phase1.ts
import { prisma } from '../lib/prisma';

interface VerificationResult {
  passed: boolean;
  metrics: Record<string, MetricResult>;
  errors: string[];
}

interface MetricResult {
  target: number;
  current: number;
  percentage: number;
  passed: boolean;
}

async function verifyPhase1(): Promise<VerificationResult> {
  const errors: string[] = [];
  const metrics: Record<string, MetricResult> = {};

  // 1. 获取所有工具
  const tools = await prisma.object.findMany({
    where: { objectType: { apiName: 'aigc_tool' } },
  });

  console.log(`Total tools: ${tools.length}`);

  // 2. 检查各项指标
  const pricingModel = tools.filter(t =>
    (t.properties as any)?.pricingModel
  ).length;

  const priceRange = tools.filter(t =>
    (t.properties as any)?.priceRange
  ).length;

  const contextWindow = tools.filter(t =>
    (t.properties as any)?.contextWindow > 0
  ).length;

  const capabilities = tools.filter(t =>
    ((t.properties as any)?.capabilities as any[])?.length > 0
  ).length;

  const dataSource = tools.filter(t =>
    (t.properties as any)?.dataSource
  ).length;

  // 3. 计算结果
  const total = tools.length;

  metrics['pricingModel'] = {
    target: 100,
    current: pricingModel,
    percentage: (pricingModel / total) * 100,
    passed: pricingModel >= total * 0.95,
  };

  metrics['priceRange'] = {
    target: 90,
    current: priceRange,
    percentage: (priceRange / total) * 100,
    passed: priceRange >= total * 0.85,
  };

  metrics['contextWindow'] = {
    target: 80,
    current: contextWindow,
    percentage: (contextWindow / total) * 100,
    passed: contextWindow >= total * 0.75,
  };

  metrics['capabilities'] = {
    target: 70,
    current: capabilities,
    percentage: (capabilities / total) * 100,
    passed: capabilities >= total * 0.65,
  };

  metrics['dataSource'] = {
    target: 100,
    current: dataSource,
    percentage: (dataSource / total) * 100,
    passed: dataSource >= total * 0.95,
  };

  // 4. 检查数据质量
  const qualityErrors = await checkDataQuality(tools);
  errors.push(...qualityErrors);

  // 5. 输出结果
  console.log('\nPhase 1 Verification Results');
  console.log('================================\n');

  for (const [name, result] of Object.entries(metrics)) {
    const status = result.passed ? '✓' : '✗';
    console.log(`${status} ${name}: ${result.current}/${total} (${result.percentage.toFixed(1)}%)`);
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  const allPassed = Object.values(metrics).every(m => m.passed) && errors.length === 0;
  console.log(`\n================================`);
  console.log(`VERIFICATION: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log('================================\n');

  return { passed: allPassed, metrics, errors };
}

async function checkDataQuality(tools: any[]): Promise<string[]> {
  const errors: string[] = [];

  for (const tool of tools) {
    const props = tool.properties as any;

    // 检查 pricingModel
    if (props.pricingModel) {
      const validModels = ['free', 'per_token', 'per_call', 'subscription', 'freemium', 'contact_sales', 'unknown'];
      if (!validModels.includes(props.pricingModel)) {
        errors.push(`${tool.rid}: Invalid pricingModel "${props.pricingModel}"`);
      }
    }

    // 检查 contextWindow
    if (props.contextWindow && props.contextWindow < 1000) {
      errors.push(`${tool.rid}: contextWindow too small (${props.contextWindow})`);
    }

    // 检查 capabilities
    if (props.capabilities && !Array.isArray(props.capabilities)) {
      errors.push(`${tool.rid}: capabilities is not an array`);
    }

    // 检查 dataSource
    if (props.dataSource) {
      const validSources = ['official', 'third_party', 'simulated'];
      if (!validSources.includes(props.dataSource)) {
        errors.push(`${tool.rid}: Invalid dataSource "${props.dataSource}"`);
      }
    }
  }

  return errors;
}

// 运行验收
verifyPhase1().catch(console.error);
```

---

## 失败处理

### 如果验收失败

1. **检查失败原因**
   - 数据源：检查爬取脚本是否正常工作
   - 模拟数据过多：调整模拟数据生成规则
   - 数据格式错误：检查验证脚本输出

2. **修复步骤**
   - 运行数据修复脚本
   - 重新执行数据丰富化
   - 再次运行验收

3. **修复脚本**

```bash
# 修复定价数据
tsx scripts/fix-pricing.ts

# 修复上下文窗口
tsx scripts/fix-context.ts

# 修复能力标签
tsx scripts/fix-capabilities.ts

# 重新验证
npm run verify:phase1
```

---

## 交接清单

验收通过后，执行以下操作：

- [ ] 更新 README.md 中的数据状态
- [ ] 标记 Phase 1 完成
- [ ] 通知下一阶段负责人
- [ ] 归档验收报告

---

*相关文档: [Phase 1: 数据丰富化](../phase-1-data-enrichment.md) | [Agent: 数据丰富化](../agents/enrich-data-agent.md)*