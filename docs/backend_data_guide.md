# Backend Data Guide — 前端数据使用说明

> 本文档面向前端开发者，说明后端 Ontology 数据的结构、API 使用方式和数据关系，帮助前端高效消费数据。

---

## 1. 架构概述

后端采用 **Palantir Foundry Ontology** 架构，核心概念为：

```
ObjectType (类型定义)  →  Object (类型实例)
LinkType   (关系定义)  →  Link   (关系实例)
```

前端不需要理解数据库表结构，所有数据都以 **对象 + 关系图** 的形式呈现。

### 数据层级

| 层级 | 说明 | 前端关注点 |
|------|------|-----------|
| **语义层 (Semantic)** | ObjectType, Object, LinkType, Link | 核心数据，页面渲染 |
| **动态层 (Kinetic)** | ActionType, Function | 交互操作、计算逻辑 |
| **接口层 (Interface)** | Interface, InterfaceImplementation | 多态查询、通用组件 |
| **集成层 (Integration)** | Dataset, SearchIndex | 搜索、筛选 |

---

## 2. ObjectType — 对象类型

系统定义了 **6 种对象类型**，每种类型有各自的属性字段：

### 2.1 `api-provider` — API 提供商

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `slug` | string | URL 标识 | 路由参数、API 查询 |
| `name` | string | 名称 | 列表/卡片显示 |
| `description` | text | 描述 | 详情页 |
| `logoUrl` | string | Logo URL | `<img>` 渲染 |
| `websiteUrl` | string | 官网 | 外链按钮 |
| `apiDocsUrl` | string | API 文档 | 外链按钮 |
| `isPopular` | boolean | 是否热门 | 热门标签、排序 |
| `foundedYear` | integer | 成立年份 | 详情页信息 |
| `headquarters` | string | 总部 | 详情页信息 |
| `employees` | string | 员工规模 | 详情页信息 |
| `region` | enum | 地区 (US/CN/EU/GLOBAL) | 筛选器 |

### 2.2 `ai-model` — AI 模型（核心实体）

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `slug` | string | URL 标识 | 路由参数 |
| `name` | string | 名称 | 列表/卡片标题 |
| `fullName` | string | 完整名称 | 详情页副标题 |
| `version` | string | 版本号 | 版本标签 |
| `description` | text | 描述 | 详情页、搜索摘要 |
| `releaseDate` | datetime | 发布日期 | 时间线、排序 |
| `contextWindow` | integer | 上下文窗口 | 规格对比卡片 |
| `maxOutputTokens` | integer | 最大输出 tokens | 规格对比卡片 |
| `trainingDataCutoff` | datetime | 训练数据截止 | 详情页信息 |
| `inputPrice` | decimal | 输入价格 ($/1M tokens) | 价格对比、计算器 |
| `outputPrice` | decimal | 输出价格 ($/1M tokens) | 价格对比、计算器 |
| `pricingModel` | enum | 定价模式 | 筛选器 (FREE/PAY_PER_USE 等) |
| `freeTierLimit` | string | 免费额度 | 免费标签展示 |
| `capabilities` | json | 能力特性 | 功能标签 (vision/functionCalling 等) |
| `isRecommended` | boolean | 是否推荐 | 推荐标识 |
| `availableInChina` | boolean | 国内可用 | 筛选器、标签 |
| `chinaAlternative` | string | 国内替代方案 | 不可用时的提示 |
| `openaiCompatible` | boolean | OpenAI 兼容 | 集成指南标签 |
| `apiEndpointPattern` | string | API 端点 | 代码示例 |

**capabilities 字段结构示例：**
```json
{
  "vision": true,
  "functionCalling": true,
  "jsonMode": true,
  "streaming": true,
  "audio": true,
  "reasoning": true,
  "codeInterpreter": true
}
```

### 2.3 `model-category` — 模型分类

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `slug` | string | URL 标识 | 路由、筛选 |
| `name` | string | 名称 | 分类标签 |
| `nameEn` | string | 英文名 | 国际化 |
| `description` | text | 描述 | 分类说明 |
| `icon` | string | 图标名 | Lucide 图标渲染 |
| `color` | string | 颜色代码 | 标签/卡片颜色 |
| `sortOrder` | integer | 排序 | 列表排序 |
| `metaTitle` | string | SEO 标题 | `<title>` |
| `metaDescription` | string | SEO 描述 | `<meta>` |

### 2.4 `model-benchmark` — 模型评测

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `benchmarkType` | enum | 评测类型 | 评测分类标签 |
| `name` | string | 评测名称 | 评测名展示 |
| `score` | decimal | 分数 | 分数条/排名 |
| `rank` | integer | 排名 | 排名展示 |
| `totalModels` | integer | 参与模型数 | 上下文信息 |
| `testedAt` | datetime | 测试日期 | 时间信息 |
| `source` | string | 数据来源 | 引用标注 |
| `description` | text | 评测说明 | Tooltip |

**benchmarkType 枚举值：** `MMLU` | `HumanEval` | `AIME` | `MATH` | `GPQA` | `MMMU` | `SWE-bench` | `MMLU-Pro` | `BBH`

### 2.5 `use-case` — 使用场景

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `slug` | string | URL 标识 | 路由 |
| `title` | string | 标题 | 页面标题 |
| `description` | text | 描述 | 摘要 |
| `keywords` | array | 关键词 | SEO、标签 |
| `metaTitle` | string | SEO 标题 | `<title>` |
| `metaDescription` | string | SEO 描述 | `<meta>` |
| `content` | text | 内容 (Markdown) | Markdown 渲染 |
| `viewCount` | integer | 浏览量 | 热度展示 |

### 2.6 `price-history` — 价格历史

| 属性 | 类型 | 说明 | 前端用途 |
|------|------|------|---------|
| `inputPrice` | decimal | 输入价格 | 折线图 Y 轴 |
| `outputPrice` | decimal | 输出价格 | 折线图 Y 轴 |
| `recordedAt` | datetime | 记录日期 | 折线图 X 轴 |
| `note` | string | 备注 | 数据点标注 |
| `changePercent` | decimal | 变化百分比 | 涨跌标签 |

---

## 3. LinkType — 关系类型

对象之间通过 Link 建立关系。前端需要理解以下 **6 种关系**：

### 3.1 关系总览

```
┌──────────┐  model-provided-by  ┌──────────┐
│ ai-model │ ──────────────────→ │provider  │
│          │  model-belongs-to   │category  │
│          │ ──────────────────→ │          │
│          │  model-has-benchmark│benchmark │
│          │ ──────────────────→ │          │
│          │  model-recommended  │use-case  │
│          │ ──────────────────→ │          │
│          │  model-alternative  │ai-model  │
│          │ ──────────────────→ │(self)    │
│          │  model-has-price    │price-hist│
│          │ ──────────────────→ │          │
└──────────┘                     └──────────┘
```

### 3.2 详细说明

| LinkType | 源 → 目标 | 基数 | 前端场景 |
|----------|-----------|------|---------|
| `model-provided-by` | ai-model → api-provider | MANY_TO_ONE | 模型卡片显示提供商 Logo |
| `model-belongs-to-category` | ai-model → model-category | MANY_TO_MANY | 模型标签、分类筛选 |
| `model-has-benchmark` | ai-model → model-benchmark | ONE_TO_MANY | 评测分数展示、对比图 |
| `model-recommended-for` | ai-model → use-case | MANY_TO_MANY | 推荐列表、场景页 |
| `model-alternative-to` | ai-model → ai-model | MANY_TO_MANY | 替代方案推荐 |
| `model-has-price-history` | ai-model → price-history | ONE_TO_MANY | 价格趋势图 |

### 3.3 带属性的 Link

部分关系本身携带属性，前端需要额外渲染：

**`model-recommended-for` 的 Link 属性：**
```json
{
  "rank": 1,           // 推荐排名 → 排名徽章
  "reason": "推理能力最强",  // 推荐理由 → 卡片描述
  "badge": "推理最强"    // 标签 → Badge 组件
}
```

**`model-alternative-to` 的 Link 属性：**
```json
{
  "reason": "价格仅为1/18，性能接近",  // 替代理由
  "priceSaving": 94.4,                // 价格节省百分比 → 标签
  "performanceDiff": "SWE-bench更高"  // 性能差异 → 描述
}
```

---

## 4. 前端 API 使用模式

### 4.1 获取模型列表（含关联数据）

```typescript
// GET /api/models?include=provider,categories,benchmarks
// 或使用 GraphQL
query GetModels($filters: ModelFilters) {
  models(filters: $filters) {
    id
    primaryKey
    displayName
    properties {
      name
      inputPrice
      outputPrice
      contextWindow
      capabilities
      availableInChina
      isRecommended
    }
    // 通过 Link 获取关联的 Provider
    provider: linkedObject(linkType: "model-provided-by") {
      displayName
      properties { name, logoUrl }
    }
    // 通过 Link 获取关联的分类
    categories: linkedObjects(linkType: "model-belongs-to-category") {
      displayName
      properties { name, icon, color }
    }
  }
}
```

### 4.2 获取模型详情（含所有关联）

```typescript
// GET /api/models/:slug?include=provider,categories,benchmarks,alternatives,priceHistory,useCases
query GetModelDetail($slug: String!) {
  model(slug: $slug) {
    id
    displayName
    properties { ... }  // 所有模型属性

    provider: linkedObject(linkType: "model-provided-by") { ... }

    categories: linkedObjects(linkType: "model-belongs-to-category") { ... }

    benchmarks: linkedObjects(linkType: "model-has-benchmark") {
      displayName
      properties { name, score, rank, benchmarkType }
    }

    alternatives: linkedObjects(linkType: "model-alternative-to") {
      displayName
      properties { name, inputPrice, outputPrice }
      linkProperties { reason, priceSaving, performanceDiff }
    }

    priceHistory: linkedObjects(linkType: "model-has-price-history") {
      properties { inputPrice, outputPrice, recordedAt, note }
    }

    useCases: linkedObjects(linkType: "model-recommended-for") {
      displayName
      properties { title, slug }
      linkProperties { rank, reason, badge }
    }
  }
}
```

### 4.3 按分类筛选模型

```typescript
// GET /api/categories/:slug/models
query GetModelsByCategory($categorySlug: String!) {
  category(slug: $categorySlug) {
    displayName
    models: linkedObjects(linkType: "model-belongs-to-category", direction: "incoming") {
      displayName
      properties { name, inputPrice, outputPrice, contextWindow }
    }
  }
}
```

### 4.4 模型对比

```typescript
// POST /api/actions/compare-models
mutation CompareModels($input: CompareModelsInput!) {
  executeAction(actionType: "compare-models", input: $input) {
    result {
      models { name, inputPrice, outputPrice, contextWindow }
      benchmarks { name, scores: { model, score } }
    }
  }
}
```

### 4.5 成本模拟

```typescript
// POST /api/actions/simulate-cost
mutation SimulateCost($input: SimulateCostInput!) {
  executeAction(actionType: "simulate-cost", input: $input) {
    result {
      dailyCost
      monthlyCost
      yearlyCost
      perRequestCost
    }
  }
}
```

### 4.6 寻找替代模型

```typescript
// POST /api/actions/find-alternatives
mutation FindAlternatives($input: FindAlternativesInput!) {
  executeAction(actionType: "find-alternatives", input: $input) {
    result {
      alternatives {
        name
        inputPrice
        outputPrice
        priceSaving
        performanceDiff
      }
    }
  }
}
```

---

## 5. 前端组件数据映射

### 5.1 模型卡片 (ModelCard)

```typescript
interface ModelCardData {
  id: string
  name: string           // properties.name
  provider: string       // linkedObject("model-provided-by").properties.name
  providerLogo: string   // linkedObject("model-provided-by").properties.logoUrl
  inputPrice: number     // properties.inputPrice
  outputPrice: number    // properties.outputPrice
  contextWindow: number  // properties.contextWindow
  capabilities: string[] // Object.keys(properties.capabilities).filter(k => v)
  isRecommended: boolean // properties.isRecommended
  availableInChina: boolean // properties.availableInChina
  categories: string[]   // linkedObjects("model-belongs-to-category").map(c => c.properties.name)
}
```

### 5.2 模型对比表 (ModelComparisonTable)

```typescript
interface ModelComparisonRow {
  field: string
  label: string
  values: Record<string, string | number | boolean>
}

// 从 benchmark links 构建
interface BenchmarkScore {
  benchmarkName: string   // benchmark.properties.name
  benchmarkType: string   // benchmark.properties.benchmarkType
  score: number           // benchmark.properties.score
  rank: number            // benchmark.properties.rank
}
```

### 5.3 价格趋势图 (PriceTrendChart)

```typescript
interface PriceDataPoint {
  date: string       // priceHistory.properties.recordedAt
  inputPrice: number // priceHistory.properties.inputPrice
  outputPrice: number// priceHistory.properties.outputPrice
  note: string       // priceHistory.properties.note
  changePercent: number | null // priceHistory.properties.changePercent
}
```

### 5.4 推荐列表 (RecommendationList)

```typescript
interface RecommendationItem {
  rank: number         // linkProperties.rank
  model: {
    name: string
    inputPrice: number
    outputPrice: number
    slug: string
  }
  reason: string       // linkProperties.reason
  badge: string        // linkProperties.badge
}
```

### 5.5 替代方案卡片 (AlternativeCard)

```typescript
interface AlternativeItem {
  model: {
    name: string
    slug: string
    inputPrice: number
    outputPrice: number
  }
  reason: string          // linkProperties.reason
  priceSaving: number     // linkProperties.priceSaving (%)
  performanceDiff: string // linkProperties.performanceDiff
}
```

---

## 6. 筛选与排序

### 6.1 可用筛选维度

| 筛选器 | 字段 | 类型 | 可选值 |
|--------|------|------|--------|
| 提供商 | `provider.slug` | string | openai, anthropic, deepseek, google, meta, zhipu, mistral, xai, moonshot, qwen |
| 分类 | `category.slug` | string | code-generation, chat, vision, reasoning, long-context, cost-effective, multimodal |
| 定价模式 | `pricingModel` | enum | FREE, FREEMIUM, SUBSCRIPTION, PAY_PER_USE |
| 国内可用 | `availableInChina` | boolean | true, false |
| 最低上下文 | `contextWindow` | integer | min 值 |
| 最高价格 | `inputPrice` | decimal | max 值 |
| 能力 | `capabilities.*` | boolean | vision, functionCalling, reasoning 等 |

### 6.2 可用排序维度

| 排序 | 字段 | 方向 |
|------|------|------|
| 价格升序 | `inputPrice` | ASC |
| 价格降序 | `inputPrice` | DESC |
| 上下文窗口 | `contextWindow` | DESC |
| 发布日期 | `releaseDate` | DESC |
| 推荐优先 | `isRecommended` | DESC |

---

## 7. Actions — 用户可执行的操作

| Action | 参数 | 前端触发场景 |
|--------|------|-------------|
| `compare-models` | modelIds[], metrics[] | 模型列表勾选 → "对比"按钮 |
| `find-alternatives` | modelId, priority | 模型详情页 → "寻找替代"按钮 |
| `simulate-cost` | modelId, inputTokens, outputTokens, requestsPerDay | 模型详情页 → "成本计算器" |
| `recommend-model` | useCase, budget, availableInChina | 首页 → 场景选择器 |

---

## 8. Functions — 可调用的计算函数

| Function | 类型 | 输入 | 输出 | 前端用途 |
|----------|------|------|------|---------|
| `calculate-price-per-1k` | COMPUTATION | inputPrice, outputPrice | averagePrice | 价格卡片辅助计算 |
| `rank-by-benchmark` | QUERY | benchmarkName, limit | 模型排名列表 | 排行榜页面 |
| `find-best-value` | QUERY | benchmarkType, maxBudget | 性价比排名 | 性价比推荐 |

---

## 9. 搜索

搜索索引配置如下，前端搜索时可直接调用：

| 索引 | 对象类型 | 索引字段 | 向量搜索 |
|------|---------|---------|---------|
| 模型搜索 | ai-model | name, description, slug, fullName | ✅ description |
| 提供商搜索 | api-provider | name, description, slug | ❌ |

```typescript
// 搜索 API
GET /api/search?q=deepseek&type=ai-model&limit=10
```

---

## 10. 前端开发注意事项

### 10.1 数据获取策略

- **列表页**：使用 `include` 参数一次性获取关联的 provider 和 categories，避免 N+1 查询
- **详情页**：按需加载 benchmarks、priceHistory、alternatives（可懒加载）
- **对比页**：批量获取多个模型的完整数据

### 10.2 价格显示格式

```
$2.50 / $10.00 per 1M tokens
  ↑输入      ↑输出

免费模型显示: "免费"
开源模型显示: "开源免费"
```

### 10.3 上下文窗口格式化

```
128K → "128K"
1000000 → "1M"
10000000 → "10M"
```

### 10.4 评测分数展示

- 分数保留 1 位小数
- 排名第 1 显示 🥇，第 2 🥈，第 3 🥉
- 同一评测类型下比较才有意义（不同 benchmarkType 不可直接对比）

### 10.5 国内可用标识

- `availableInChina: true` → 显示 🇨🇳 标签
- `availableInChina: false` → 显示 `chinaAlternative` 提示文字

### 10.6 capabilities 标签映射

```typescript
const capabilityLabels: Record<string, string> = {
  vision: "视觉",
  functionCalling: "函数调用",
  jsonMode: "JSON 模式",
  streaming: "流式输出",
  audio: "音频",
  reasoning: "推理",
  codeInterpreter: "代码执行",
  realTimeInfo: "实时信息"
}
```
