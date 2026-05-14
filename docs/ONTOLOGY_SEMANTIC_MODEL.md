# AI API Compass — Palantir Ontology 语义模型

## 一、四要素总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ontology 语义层                               │
│                                                                 │
│  Objects (6个)          Links (10个)          Properties         │
│  ───────────            ──────────            ──────────         │
│  Provider               Provider → Model      (见各Object内部)   │
│  Model                  Model → Category                         │
│  Category               Model → Model(替代)                      │
│  Benchmark              Model → Benchmark                        │
│  UseCase                Model → UseCase(推荐)                    │
│  User                   User → Model(收藏)                      │
│                                                                 │
│  Actions (4个)           Functions (8个)       SideEffects (5个)  │
│  ───────────            ────────────          ──────────────     │
│  recommendModels        calculateCost         analytics          │
│  simulateCost           calculateScore        log                │
│  compareModels          calculateSavings      cache              │
│  searchModels           filterByPrice         webhook            │
│                         sortByPerformance     writeback          │
│                         matchCapabilities                        │
│                         rankModels                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、Objects（对象）

### Object 1: `Provider`（AI提供商）

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `slug` | string | URL友好标识 (openai, anthropic) |
| `name` | string | 显示名称 |
| `description` | string? | 描述 |
| `logoUrl` | string? | Logo URL |
| `websiteUrl` | string | 官网地址 |
| `isActive` | boolean | 是否活跃 |
| `isPopular` | boolean | 是否热门 |

### Object 2: `Model`（AI模型）⭐ 核心对象

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `slug` | string | URL友好标识 |
| `name` | string | 显示名称 |
| `fullName` | string? | 完整名称 |
| `description` | string? | 描述 |
| `contextWindow` | number? | 上下文窗口(tokens) |
| `maxOutputTokens` | number? | 最大输出tokens |
| `inputPrice` | decimal? | 输入价格($/1M tokens) |
| `outputPrice` | decimal? | 输出价格($/1M tokens) |
| `pricingModel` | enum | 定价模式 |
| `openaiCompatible` | boolean | OpenAI API兼容 |
| `availableInChina` | boolean | 国内可用 |
| `isActive` | boolean | 是否活跃 |
| `viewCount` | number | 浏览次数 |
| `capabilities` | json | 能力特性 {vision, functionCalling, jsonMode...} |

### Object 3: `Category`（分类）

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `slug` | string | URL友好标识 |
| `name` | string | 中文名称 |
| `nameEn` | string? | 英文名称 |
| `description` | string? | 描述 |
| `icon` | string? | 图标名称 |
| `sortOrder` | number | 排序 |

### Object 4: `Benchmark`（基准测试）

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `name` | string | 测试名称 (MMLU, HumanEval...) |
| `score` | decimal | 分数 |
| `rank` | number? | 排名 |
| `source` | string? | 数据来源 |

### Object 5: `UseCase`（使用场景）

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `slug` | string | URL友好标识 |
| `title` | string | 标题 |
| `description` | string? | 描述 |
| `keywords` | string[] | 关键词 |
| `viewCount` | number | 浏览次数 |

### Object 6: `User`（用户）

| Property | 类型 | 说明 |
|----------|------|------|
| `id` | string | 唯一标识 |
| `email` | string | 邮箱 |
| `name` | string? | 名称 |

---

## 三、Links（关系）

```
Provider ──1:N──→ Model
Model ──M:N──→ Category          (通过 ModelCategory)
Model ──M:N──→ Model             (通过 ModelAlternative，自引用替代关系)
Model ──1:N──→ Benchmark
Model ──M:N──→ UseCase           (通过 UseCaseRecommendation)
User ──M:N──→ Model              (通过 UserFavorite)
Model ──1:N──→ PriceHistory
Provider ──1:N──→ AffiliateLink
Model ──1:N──→ ModelAffiliateLink
```

| Link | 类型 | Source | Target | 说明 |
|------|------|--------|--------|------|
| `Provider.models` | 1:N | Provider | Model | 提供商拥有多个模型 |
| `Model.categories` | M:N | Model | Category | 模型属于多个分类 |
| `Model.alternatives` | M:N | Model | Model | 模型之间的替代关系 |
| `Model.benchmarks` | 1:N | Model | Benchmark | 模型的基准测试数据 |
| `Model.recommendations` | M:N | Model | UseCase | 模型被推荐的使用场景 |
| `User.favorites` | M:N | User | Model | 用户收藏的模型 |
| `Model.priceHistory` | 1:N | Model | PriceHistory | 模型价格变化历史 |
| `Provider.affiliateLinks` | 1:N | Provider | AffiliateLink | 提供商联盟链接 |
| `Model.affiliateLinks` | 1:N | Model | ModelAffiliateLink | 模型专属联盟链接 |
| `Model.provider` | N:1 | Model | Provider | 模型归属的提供商 |

---

## 四、Actions（动作）

### Action 1: `recommendModels`（智能推荐）

| 属性 | 值 |
|------|------|
| **rid** | `ri.ontology.main.action.recommend-models` |
| **apiName** | `recommendModels` |
| **描述** | 根据使用场景、预算、优先级推荐模型 |
| **输入参数** | `useCase`, `budgetLevel`, `priority`, `limit` |
| **Operations** | loadData → fetchObjects → calculate → sortObjects → transform |
| **SideEffects** | analytics(推荐事件), log(请求日志) |

### Action 2: `simulateCost`（成本模拟）

| 属性 | 值 |
|------|------|
| **rid** | `ri.ontology.main.action.simulate-cost` |
| **apiName** | `simulateCost` |
| **描述** | 计算多模型在不同使用量下的成本 |
| **输入参数** | `modelIds`, `inputTokens`, `outputTokens`, `requestsPerMonth` |
| **Operations** | fetchObjects → foreach(calculate) → sortObjects → transform |
| **SideEffects** | analytics(模拟事件), log(请求日志) |

### Action 3: `compareModels`（模型对比）

| 属性 | 值 |
|------|------|
| **rid** | `ri.ontology.main.action.compare-models` |
| **apiName** | `compareModels` |
| **描述** | 深度对比多个模型的性能、价格、特性 |
| **输入参数** | `modelIds`, `includeBenchmarks`, `includeAlternatives` |
| **Operations** | fetchObjects → fetchObjects(benchmarks) → graphWalk → custom(calculateScore) → transform |
| **SideEffects** | analytics(对比事件), log(请求日志), **writeback**(对比日志) |

### Action 4: `searchModels`（智能搜索）

| 属性 | 值 |
|------|------|
| **rid** | `ri.ontology.main.action.search-models` |
| **apiName** | `searchModels` |
| **描述** | 多条件搜索和过滤AI模型 |
| **输入参数** | `query`, `providerId`, `categoryId`, `maxInputPrice`, `sortBy`, `limit`, `offset` |
| **Operations** | fetchObjects → filterObjects → sortObjects → calculate(totalCount) → transform |
| **SideEffects** | analytics(搜索事件), log(搜索日志), **writeback**(搜索日志) |

---

## 五、Functions（函数）

Functions 是 Action Operations 中 `calculate` 步骤调用的计算逻辑：

| Function | 输入 | 输出 | 说明 |
|----------|------|------|------|
| `calculateCost` | `price, tokens` | `number` | 计算成本 = price × tokens / 1,000,000 |
| `calculateSavings` | `costA, costB` | `percent` | 计算节省百分比 = (A-B)/A × 100 |
| `calculateScore` | `modelId` | `number` | 综合评分 = 基准分×0.6 + 价格分×0.4 |
| `calculateRecommendationScore` | `models, recommendations, priority` | `scored[]` | 根据推荐排名和优先级计算推荐分数 |
| `filterByPrice` | `models, maxPrice` | `filtered[]` | 按价格过滤模型 |
| `sortByPerformance` | `models, benchmarkType` | `sorted[]` | 按基准测试分数排序 |
| `matchCapabilities` | `models, requiredCapabilities` | `matched[]` | 匹配所需能力 |
| `rankModels` | `models, criteria` | `ranked[]` | 多维度排名 |

---

## 六、SideEffects（副作用）

| SideEffect | 类型 | 触发场景 | 说明 |
|------------|------|----------|------|
| `analytics` | 分析事件 | 所有Action | 记录用户行为事件（推荐/搜索/对比/模拟） |
| `log` | 日志 | 所有Action | 记录请求参数和执行时间 |
| `cache` | 缓存 | recommendModels, simulateCost | 缓存计算结果（5分钟/1分钟TTL） |
| `webhook` | 外部通知 | 价格变动时 | 价格更新时通知订阅用户 |
| **`writeback`** | 数据回写 | compareModels, searchModels | **回写对比日志和搜索日志到数据库** |

---

## 七、Writeback（数据回写）⭐ 关键设计

Writeback 是 Ontology 架构中 Action 执行后对数据层的写操作。在 AI API Compass 中：

| Writeback | 触发Action | 写入Object | 写入内容 |
|-----------|-----------|-----------|----------|
| `recordCompareLog` | compareModels | CompareLog | modelIds[], ipAddress, userAgent |
| `recordSearchLog` | searchModels | SearchLog | query, filters, resultsCount, ipAddress |
| `incrementViewCount` | compareModels, searchModels | Model | viewCount += 1 |
| `incrementCompareCount` | compareModels | Model | compareCount += 1 |
| `recordAffiliateClick` | 前端点击联盟链接 | AffiliateLink / ModelAffiliateLink | clicks += 1 |
| `recordUserFavorite` | 用户收藏 | UserFavorite | userId, modelId |

### Writeback 实现方式

在 ActionExecutor 的 SideEffect 中实现：

```typescript
// 在 action-executor.ts 的 executeSideEffects 中
case 'writeback':
  await this.executeWritebackEffect(effect, evaluator);
  break;
```

```typescript
// Writeback SideEffect 类型定义（需添加到 types.ts）
interface WritebackSideEffect extends BaseSideEffect {
  type: 'writeback';
  objectType: 'CompareLog' | 'SearchLog' | 'Model' | 'AffiliateLink';
  operation: 'create' | 'update' | 'increment';
  data: Record<string, unknown>;  // 写入的数据
}
```

---

## 八、完整数据流示例

### 用户搜索模型

```
用户输入 "GPT" → searchModels Action
  │
  ├─ Operation 1: fetchObjects(Model, filter={name contains "GPT"})
  ├─ Operation 2: filterObjects(price <= maxInputPrice)
  ├─ Operation 3: sortObjects(by=inputPrice, order=asc)
  ├─ Operation 4: calculate(totalCount = length(results))
  ├─ Operation 5: transform(map to UI fields)
  │
  ├─ SideEffect: analytics({event: 'model_search', query: 'GPT'})
  ├─ SideEffect: log({message: '搜索: GPT, 结果: 5条'})
  └─ SideEffect: writeback({  ← 数据回写
       objectType: 'SearchLog',
       operation: 'create',
       data: {query: 'GPT', resultsCount: 5, ipAddress: '...'}
     })
```

### 用户对比模型

```
用户选择 3个模型 → compareModels Action
  │
  ├─ Operation 1: fetchObjects(Model, ids=[...])
  ├─ Operation 2: fetchObjects(Benchmark, modelIds=[...])
  ├─ Operation 3: graphWalk(edges=[alternatives, benchmarks])
  ├─ Operation 4: custom(calculateModelScore) ← Function调用
  ├─ Operation 5: transform(map to comparison view)
  │
  ├─ SideEffect: analytics({event: 'model_comparison', modelCount: 3})
  ├─ SideEffect: log({message: '对比: 3个模型'})
  └─ SideEffect: writeback({  ← 数据回写
       objectType: 'CompareLog',
       operation: 'create',
       data: {modelIds: [...], ipAddress: '...'}
     })
  └─ SideEffect: writeback({  ← 同时更新模型统计
       objectType: 'Model',
       operation: 'increment',
       data: {field: 'compareCount', ids: [...]}
     })
```

---

## 九、总结

| Ontology要素 | 数量 | 说明 |
|-------------|------|------|
| **Objects** | 6个 | Provider, Model, Category, Benchmark, UseCase, User |
| **Properties** | 50+ | 分布在各Object上 |
| **Links** | 10条 | 1:N 和 M:N 关系 |
| **Actions** | 4个 | recommend, simulateCost, compare, search |
| **Functions** | 8个 | 计算、过滤、排序、匹配 |
| **SideEffects** | 5类 | analytics, log, cache, webhook, writeback |
| **Writebacks** | 6个 | 搜索日志、对比日志、浏览计数、收藏等 |
