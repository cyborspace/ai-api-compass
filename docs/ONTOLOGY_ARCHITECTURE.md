# AI API Compass - Ontology 架构实现

## 概述

本项目采用 **Palantir Ontology 架构** 作为核心设计模式，实现了数据驱动的多层架构系统。通过将业务逻辑抽象为可配置的 Actions，实现了底层代码的高度复用和灵活的业务表达能力。

## 架构层次

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│  (Fastify Routes / API Endpoints)                          │
├─────────────────────────────────────────────────────────────┤
│                    Action Layer ⭐                          │
│  (Ontology Actions - 业务逻辑的核心抽象)                    │
│  - recommendModels                                          │
│  - simulateCost                                             │
│  - compareModels                                            │
│  - searchModels                                             │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  (OntologyService / Business Facade)                        │
├─────────────────────────────────────────────────────────────┤
│                    Dynamic Layer                            │
│  (ActionExecutor / ExpressionEvaluator)                     │
│  - 13种 Logic Rules 执行引擎                                │
│  - 表达式求值系统                                           │
│  - 副作用处理系统                                           │
├─────────────────────────────────────────────────────────────┤
│                    Semantic Layer                           │
│  (Type Definitions / Action Registry)                       │
│  - ActionType 定义                                          │
│  - Operation 类型系统                                       │
│  - 参数验证系统                                             │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  (Prisma ORM / PostgreSQL)                                  │
│  - Model, Provider, Category                                │
│  - Benchmark, PriceHistory                                  │
│  - UseCaseRecommendation                                    │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. 类型系统 (`src/ontology/types.ts`)

定义了 Ontology 架构的核心类型：

- **ActionType**: Action 的完整定义，包含参数、操作链、副作用
- **Operation**: 13种 Logic Rules（fetchObject, calculate, foreach 等）
- **Expression**: 表达式系统（变量引用、模板、函数调用）
- **SideEffect**: 副作用系统（缓存、日志、Webhook、分析）

### 2. 表达式求值器 (`src/ontology/expression-evaluator.ts`)

支持动态表达式求值：

```typescript
// 变量引用
$modelId

// 模板字符串
"Hello ${name}"

// 函数调用
{ __type: 'function', function: 'calculateCost', args: [price, tokens] }
```

内置函数：
- 数学: sum, avg, min, max, round
- 字符串: concat, uppercase, lowercase
- 数组: length, first, last
- 成本: calculateCost, savingsPercent
- 条件: if

### 3. Action 执行器 (`src/ontology/action-executor.ts`)

执行 Action 的核心引擎，支持：

#### 13种 Logic Rules

1. **fetchObject** - 获取单个对象
2. **fetchObjects** - 获取多个对象
3. **filterObjects** - 过滤对象
4. **createObject** - 创建对象
5. **updateObject** - 更新对象
6. **deleteObject** - 删除对象
7. **calculate** - 计算表达式
8. **sortObjects** - 排序对象
9. **foreach** - 循环执行
10. **transform** - 数据转换（groupBy, map, reduce, flatten）
11. **graphWalk** - 图遍历
12. **loadData** - 加载数据（场景/配置/缓存）
13. **custom** - 自定义操作

#### 副作用系统

- **cache** - 数据缓存
- **log** - 日志记录
- **webhook** - 外部通知
- **notification** - 消息通知
- **analytics** - 分析事件

### 4. Action 注册中心 (`src/ontology/action-registry.ts`)

管理所有 Action 的注册和发现：

```typescript
registry.register(action);
registry.get('recommendModels');
registry.getByCategory('intelligence');
registry.getByTag('cost');
```

### 5. 预定义 Actions (`src/ontology/actions/`)

#### 智能模型推荐 (`model-recommendation.action.ts`)

```typescript
POST /api/v1/ontology/recommend
{
  "useCase": "code",
  "budgetLevel": "medium",
  "priority": "balanced",
  "limit": 3
}
```

根据使用场景、预算和优先级智能推荐 AI 模型。

#### 成本模拟器 (`cost-simulator.action.ts`)

```typescript
POST /api/v1/ontology/simulate-cost
{
  "modelIds": ["model1", "model2"],
  "inputTokens": 1000,
  "outputTokens": 500,
  "requestsPerMonth": 10000
}
```

计算不同模型的预估成本并对比。

#### 模型对比 (`model-comparison.action.ts`)

```typescript
POST /api/v1/ontology/compare
{
  "modelIds": ["model1", "model2", "model3"],
  "includeBenchmarks": true,
  "includeAlternatives": true
}
```

深度对比多个模型的性能、价格和特性。

#### 智能搜索 (`search-models.action.ts`)

```typescript
POST /api/v1/ontology/search
{
  "query": "GPT",
  "providerId": "openai",
  "maxInputPrice": 10,
  "sortBy": "price",
  "limit": 20
}
```

多维度智能搜索和过滤模型。

## API 端点

### Ontology Actions

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/ontology/recommend` | 智能模型推荐 |
| POST | `/api/v1/ontology/simulate-cost` | 成本模拟计算 |
| POST | `/api/v1/ontology/compare` | 模型深度对比 |
| POST | `/api/v1/ontology/search` | 智能搜索模型 |
| GET | `/api/v1/ontology/actions` | 获取所有 Actions |
| GET | `/api/v1/ontology/actions/:name` | 获取 Action 详情 |
| POST | `/api/v1/ontology/execute/:actionName` | 执行任意 Action |

## 优势

### 1. 数据驱动

业务逻辑通过配置（Action 定义）而非代码实现，修改业务规则只需更新数据。

### 2. 高度复用

13种 Logic Rules 可组合出任意业务场景，底层代码一次编写，多处复用。

### 3. 灵活扩展

新增业务功能只需：
1. 定义新的 Action
2. 组合现有的 Logic Rules
3. 无需修改执行引擎

### 4. 可视化友好

Action 的结构天然适合可视化编辑，未来可支持拖拽式业务逻辑编排。

### 5. 可观测性

每个 Action 的执行都有完整的元数据：
- 执行时间
- 步骤数
- 缓存命中
- 副作用记录

## 使用示例

### 定义新 Action

```typescript
export const myCustomAction: ActionType = {
  rid: 'ri.ontology.main.action.my-custom',
  apiName: 'myCustomAction',
  displayName: '我的自定义Action',
  parameters: {
    inputParam: {
      name: 'inputParam',
      type: 'string',
      required: true,
    },
  },
  operations: [
    {
      type: 'fetchObjects',
      objectType: 'Model',
      filter: { property: 'name', operator: 'contains', value: '$inputParam' },
      output: 'models',
    },
    {
      type: 'calculate',
      formula: { __type: 'function', function: 'length', args: ['$models'] },
      output: 'count',
    },
  ],
  sideEffects: [
    {
      type: 'log',
      level: 'info',
      message: 'Found ${count} models',
    },
  ],
};
```

### 执行 Action

```typescript
const result = await ontologyService.executeAction('myCustomAction', {
  inputParam: 'GPT',
});
```

## 文件结构

```
src/
├── ontology/
│   ├── types.ts                    # 核心类型定义
│   ├── expression-evaluator.ts     # 表达式求值器
│   ├── action-executor.ts          # Action执行引擎
│   ├── action-registry.ts          # Action注册中心
│   ├── index.ts                    # 模块导出
│   └── actions/
│       ├── index.ts                # Actions导出
│       ├── model-recommendation.action.ts
│       ├── cost-simulator.action.ts
│       ├── model-comparison.action.ts
│       └── search-models.action.ts
├── services/
│   └── ontology.service.ts         # Ontology服务层
└── routes/
    └── ontology.ts                 # Ontology API路由
```

## 总结

通过 Ontology 架构，AI API Compass 实现了：

1. **降维打击** - 用数据配置替代代码开发，大幅提升开发效率
2. **灵活应变** - 业务规则变化只需修改配置，无需部署代码
3. **统一抽象** - 所有业务逻辑遵循统一的 Action 模型
4. **高度可扩展** - 新增功能只需定义新的 Action，无需改动核心引擎

这是真正的 **"重武器"** 级别的架构升级！
