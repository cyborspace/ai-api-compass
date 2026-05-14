# 第 5 章（上）：AI-API-COMPASS 项目全景

> **核心问题**：如何用一个真实项目理解 Ontology？
> **本章简介**：本章为读者展开 AI-API-COMPASS 项目的完整画卷。从项目背景到技术选型，从后端分层架构到 Ontology 映射，从数据模型到前端路由——读者将对这个贯穿全书的实践载体建立全局认知。通过本地部署和代码阅读，为后续章节的深入实践做好准备。

---

## 5.1 项目背景与目标

### 5.1.1 为什么要做 AI 工具对比平台

2024 年，AIGC（AI Generated Content）工具呈爆发式增长。从 ChatGPT 到 Midjourney，从 Claude 到 Stable Diffusion，数以千计的 AI 工具涌现，让企业和个人用户面临一个核心问题：**如何选择最适合自己的 AI 工具？**

现有的解决方案存在明显不足：
- **搜索引擎**：信息碎片化，缺乏结构化对比
- **垂直媒体**：评测主观，更新滞后
- **官方文档**：自说自话，难以横向比较
- **社区讨论**：观点分散，可信度参差

AI-API-COMPASS 的诞生正是为了解决这一痛点。它不仅是一个工具导航网站，更是一个 **Ontology 架构的实践场**——通过 Palantir 的三层架构思想，构建一个可扩展、可演进的 AI 工具知识图谱。

### 5.1.2 项目定位：不只是网站，而是 Ontology 架构的实践场

AI-API-COMPASS 的核心定位是：**用 Ontology 思想重构 AI 工具导航**。

传统工具导航网站的数据模型通常是：

```
工具表 → 分类表 → 标签表 → 评价表
```

而 AI-API-COMPASS 采用 Ontology 模型：

```
AIGCTool → [belongsTo] → ToolCategory
         → [providedBy] → ToolProvider
         → [hasTag] → ToolTag
         → [supports] → UseCase
         → [hasPricing] → PricingPlan
         → [hasReview] → UserReview
         → [hasCapability] → ToolCapability
```

这种设计的优势在于：
1. **语义丰富**：每个关系都有明确的业务含义
2. **可扩展**：新增关系无需修改表结构
3. **可推理**：基于链接可以进行智能推荐
4. **可操作**：通过 Actions 实现业务逻辑

### 5.1.3 核心数据：295 个 AI 工具、10 个分类、303 条关联关系

截至 2024 年，AI-API-COMPASS 已收录：

| 数据维度 | 数量 | 说明 |
|----------|------|------|
| AI 工具 | 295 | 覆盖文本、图像、音频、视频、代码等模态 |
| 工具分类 | 10 | 文本生成、图像生成、音频生成、视频生成、代码辅助、知识管理、设计工具、办公效率、数据分析、多模态 |
| 关联关系 | 303 | 工具与分类、提供商、场景、能力等的关系 |
| 用户评价 | ~10,000 | 包含评分、评论、优缺点 |
| 热度指标 | ~50,000 | 按小时/天/周/月统计 |

这些数据通过 Ontology 模型进行组织，支持多维度查询和智能推荐。

---

## 5.2 技术栈详解

### 5.2.1 后端：Fastify + Prisma + PostgreSQL + Redis

**Fastify**：高性能 Node.js Web 框架

```typescript
// backend/src/server.ts
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// 注册路由
app.register(ontologyRoutes, { prefix: '/api/ontology' });
app.register(toolsRoutes, { prefix: '/api/tools' });
app.register(rankingRoutes, { prefix: '/api/ranking' });

// 启动服务器
app.listen({ port: 3001, host: '0.0.0.0' });
```

**Prisma**：下一代 ORM，类型安全的数据库访问

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model objects {
  id           String       @id
  objectTypeId String
  rid          String?
  properties   Json         @default("{}")
  status       String       @default("active")
  object_types object_types @relation(fields: [objectTypeId], references: [id])
  
  @@unique([objectTypeId, rid])
  @@index([objectTypeId])
}
```

**PostgreSQL**：支持 JSONB 的关系型数据库

选择 PostgreSQL 的核心原因：
1. **JSONB 支持**：存储 Ontology 的 properties 和 links
2. **全文检索**：支持工具名称和描述的搜索
3. **窗口函数**：支持排名和聚合计算
4. **扩展丰富**：PostGIS、pgvector 等

**Redis**：缓存和消息队列

```typescript
// 缓存热度数据
await redis.setex(`heat:${toolRid}:24h`, 3600, JSON.stringify(heatData));

// 消息队列：异步处理事件
await redis.lpush('event-queue', JSON.stringify(event));
```

### 5.2.2 前端：Next.js 15 + TypeScript + Tailwind CSS + Zustand

**Next.js 15**：React 全栈框架

```typescript
// frontend/app/page.tsx
export default async function HomePage() {
  const tools = await fetchTools();
  const categories = await fetchCategories();
  
  return (
    <div className="container mx-auto px-4">
      <HeroSection />
      <CategoryNav categories={categories} />
      <ToolGrid tools={tools} />
    </div>
  );
}
```

**TypeScript**：类型安全

```typescript
// frontend/types/ontology.ts
interface AIGCTool {
  rid: string;
  properties: {
    name: string;
    slug: string;
    description: string;
    pricingType: 'free' | 'freemium' | 'paid' | 'subscription';
    averageRating: number;
    viewCount: number;
  };
  links: {
    categories: ToolCategory[];
    provider: ToolProvider;
  };
}
```

**Tailwind CSS**：实用优先的 CSS 框架

```html
<!-- 工具卡片 -->
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <img src={tool.logoUrl} class="w-16 h-16 rounded-full mb-4" />
  <h3 class="text-lg font-semibold text-gray-900">{tool.name}</h3>
  <p class="text-sm text-gray-600 mt-2">{tool.description}</p>
  <div class="flex items-center mt-4 space-x-2">
    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
      {tool.pricingType}
    </span>
    <span class="flex items-center text-yellow-500">
      ★ {tool.averageRating}
    </span>
  </div>
</div>
```

**Zustand**：轻量级状态管理

```typescript
// frontend/stores/tool-store.ts
import { create } from 'zustand';

interface ToolState {
  tools: AIGCTool[];
  selectedCategory: string | null;
  searchQuery: string;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tools: [],
  selectedCategory: null,
  searchQuery: '',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
```

### 5.2.3 基础设施：Railway + Vercel（月成本 0 元）

| 服务 | 用途 | 成本 |
|------|------|------|
| Railway | PostgreSQL + Redis + 后端部署 | $0（免费额度） |
| Vercel | 前端部署 + CDN | $0（免费额度） |
| GitHub | 代码托管 + CI/CD | $0 |

这种"零成本"架构的选择体现了 FDE 的技术选型思维：**在验证阶段，优先选择托管服务，将精力集中在业务逻辑而非基础设施**。

### 5.2.4 为什么选择这些技术：FDE 的技术选型思维

FDE 的技术选型遵循"**先验证，再优化**"的原则：

1. **快速启动**：选择熟悉的、文档完善的技术栈
2. **类型安全**：TypeScript + Prisma 减少运行时错误
3. **全栈统一**：Next.js 支持前后端同构
4. **成本可控**：免费额度足够验证阶段使用
5. **可扩展**：架构支持后续迁移到更强大的基础设施

---

## 5.3 项目架构深度解析

### 5.3.1 后端分层架构：接口层 → 动作层 → 服务层 → 动态层 → 数据层

AI-API-COMPASS 的后端采用五层架构：

```
┌─────────────────────────────────────────┐
│  接口层 (Interface Layer)                │
│  REST API / GraphQL / WebSocket         │
├─────────────────────────────────────────┤
│  动作层 (Action Layer)                   │
│  Action Executor / Submission Criteria  │
├─────────────────────────────────────────┤
│  服务层 (Service Layer)                  │
│  Ranking / Heat / Recommendation        │
├─────────────────────────────────────────┤
│  动态层 (Dynamic Layer)                  │
│  Functions / Writeback / Webhooks       │
├─────────────────────────────────────────┤
│  数据层 (Data Layer)                     │
│  Prisma / PostgreSQL / Redis            │
└─────────────────────────────────────────┘
```

**接口层**：处理 HTTP 请求，路由到对应的 Action

```typescript
// backend/src/routes/ontology-simple.ts
export async function ontologyRoutes(app: FastifyInstance) {
  // 获取工具列表
  app.get('/tools', async (request, reply) => {
    const { category, search, sort } = request.query;
    const tools = await toolService.findMany({ category, search, sort });
    return { data: tools };
  });
  
  // 执行 Action
  app.post('/actions/:actionType', async (request, reply) => {
    const { actionType } = request.params;
    const result = await actionExecutor.execute(actionType, request.body);
    return result;
  });
}
```

**动作层**：执行 Ontology Actions，处理业务逻辑

```typescript
// backend/src/ontology/action-executor.ts
export class ActionExecutor {
  async execute(actionType: string, parameters: any) {
    // 1. 验证提交条件
    const criteriaResult = await this.validateCriteria(actionType, parameters);
    if (!criteriaResult.passed) {
      return { success: false, errors: criteriaResult.errors };
    }
    
    // 2. 执行 Action
    const result = await this.performAction(actionType, parameters);
    
    // 3. 处理副作用
    await this.handleSideEffects(actionType, result);
    
    return { success: true, data: result };
  }
}
```

**服务层**：核心业务逻辑

```typescript
// backend/src/services/ranking.service.ts
export class RankingService {
  async calculateRanking(type: string, perspective: string) {
    const tools = await this.getTools();
    const weights = await this.getWeights(perspective);
    
    const rankings = tools.map(tool => ({
      toolRid: tool.rid,
      score: this.calculateScore(tool, weights),
      breakdown: this.getScoreBreakdown(tool, weights),
    }));
    
    return rankings.sort((a, b) => b.score - a.score);
  }
}
```

**动态层**：Functions 和 Writeback

```typescript
// backend/src/ontology/functions/ranking-functions.ts
export const rankingFunctions: FunctionV2[] = [
  {
    apiName: 'calculateComprehensiveRanking',
    displayName: '综合排名',
    parameters: [
      { apiName: 'category', dataType: { type: 'string' } },
      { apiName: 'limit', dataType: { type: 'integer' }, defaultValue: 10 },
    ],
    returnType: { type: 'list', innerType: { type: 'object' } },
    handler: async (params) => {
      return rankingService.calculateRanking('comprehensive', params.category, params.limit);
    },
  },
];
```

**数据层**：Prisma ORM + PostgreSQL

```typescript
// backend/src/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}
  
  async findMany(where?: any): Promise<T[]> {
    return this.prisma[this.model].findMany({ where });
  }
  
  async findUnique(where: any): Promise<T | null> {
    return this.prisma[this.model].findUnique({ where });
  }
  
  async create(data: any): Promise<T> {
    return this.prisma[this.model].create({ data });
  }
}
```

### 5.3.2 Ontology 核心实现目录结构

```
backend/src/ontology/
├── aigc-schema/                    # AIGC Ontology 定义
│   ├── object-types/               # 对象类型定义
│   │   ├── aigc-tool.object-type.ts
│   │   ├── tool-category.object-type.ts
│   │   ├── tool-provider.object-type.ts
│   │   ├── tool-tag.object-type.ts
│   │   ├── use-case.object-type.ts
│   │   ├── pricing-plan.object-type.ts
│   │   ├── tool-capability.object-type.ts
│   │   ├── technical-spec.object-type.ts
│   │   ├── user-review.object-type.ts
│   │   ├── trend-metric.object-type.ts
│   │   └── competitor-analysis.object-type.ts
│   ├── link-types/                 # 链接类型定义
│   │   └── tool-link-types.ts
│   ├── value-types/                # 值类型定义
│   │   └── aigc-value-types.ts
│   ├── action-types/               # 动作类型定义
│   │   └── aigc-action-types.ts
│   ├── functions/                  # 函数定义
│   │   ├── aigc-functions.ts
│   │   ├── ranking-functions.ts
│   │   ├── heat-functions.ts
│   │   ├── scoring-functions.ts
│   │   ├── recommendation-functions.ts
│   │   ├── anti-gaming-functions.ts
│   │   └── scenario-functions.ts
│   ├── interfaces/                 # 接口定义
│   │   └── aigc-interfaces.ts
│   └── ontology-manifest.ts        # Ontology 清单
├── action-executor.ts              # Action 执行器
├── submission-criteria-engine.ts   # 提交条件引擎
├── writeback-webhook.ts           # Writeback 机制
└── types.ts                        # 类型定义
```

### 5.3.3 数据集成框架：同步引擎、实时引擎、双向同步

**同步引擎（Sync Engine）**：批量数据同步

```typescript
// backend/src/sync/sync-engine.ts
export class SyncEngine {
  async syncBatch(objectType: string, data: any[]) {
    const objectTypeDef = await this.getObjectType(objectType);
    
    for (const item of data) {
      // 1. 数据验证
      const validated = this.validateData(item, objectTypeDef);
      
      // 2. 数据转换
      const transformed = this.transformData(validated, objectTypeDef);
      
      // 3. 写入数据库
      await this.upsertObject(objectType, transformed);
    }
  }
}
```

**实时引擎（Realtime Engine）**：流式数据处理

```typescript
// backend/src/sync/realtime-engine.ts
export class RealtimeEngine {
  async processEvent(event: UserEvent) {
    // 1. 验证事件
    const validated = eventValidator.validate(event);
    
    // 2. 写入数据库
    await prisma.user_events.create({ data: validated });
    
    // 3. 更新实时指标
    await this.updateRealtimeMetrics(event.toolRid);
    
    // 4. 触发后续处理
    await eventBus.publish('event:processed', event);
  }
}
```

**双向同步（Bidirectional Sync）**：数据回写

```typescript
// backend/src/sync/bidirectional-sync.ts
export class BidirectionalSync {
  async syncToExternal(object: any, target: string) {
    // 1. 转换数据格式
    const externalFormat = this.transformToExternal(object, target);
    
    // 2. 调用外部 API
    const result = await fetch(target, {
      method: 'POST',
      body: JSON.stringify(externalFormat),
    });
    
    // 3. 记录同步状态
    await this.recordSyncStatus(object.rid, target, result);
  }
}
```

### 5.3.4 前端页面结构与路由设计

```
frontend/app/
├── page.tsx                    # 首页
├── layout.tsx                  # 根布局
├── globals.css                 # 全局样式
├── tools/
│   ├── page.tsx               # 工具列表页
│   └── [slug]/
│       └── page.tsx           # 工具详情页
├── compare/
│   └── page.tsx               # 对比页
├── ranking/
│   └── page.tsx               # 排名页
├── categories/
│   └── [slug]/
│       └── page.tsx           # 分类详情页
├── api/
│   └── ...                    # API 路由
└── ontology/
    └── page.tsx               # Ontology 管理页
```

🎯 **实践环节**：本地部署 AI-API-COMPASS 项目

```bash
# 1. 克隆项目
git clone https://github.com/your-org/ai-api-compass.git
cd ai-api-compass

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，配置 DATABASE_URL 和 REDIS_URL

# 4. 初始化数据库
cd backend
npx prisma migrate dev
npx prisma db seed

# 5. 启动开发服务器
# 终端 1：启动后端
cd backend && npm run dev

# 终端 2：启动前端
cd frontend && npm run dev

# 6. 访问应用
open http://localhost:3000
```

---

## 5.4 Ontology 在项目中的映射

### 5.4.1 语义层映射：11 个 Object Type、10 种 Link Type、46 个 Function

**11 个 Object Type**：

| Object Type | 说明 | 核心属性 |
|-------------|------|----------|
| `AIGCTool` | AI 工具 | name, slug, description, pricingType, averageRating |
| `ToolCategory` | 工具分类 | name, slug, description, icon |
| `ToolProvider` | 工具提供商 | name, websiteUrl, logoUrl |
| `ToolTag` | 工具标签 | tag, color |
| `UseCase` | 使用场景 | title, description, keywords |
| `PricingPlan` | 定价方案 | pricePerMillionTokens, billingCycle |
| `ToolCapability` | 工具能力 | capabilityName, description |
| `TechnicalSpec` | 技术规格 | contextWindow, maxOutputTokens |
| `UserReview` | 用户评价 | rating, reviewContent, pros, cons |
| `TrendMetric` | 趋势指标 | metricName, value, trend |
| `CompetitorAnalysis` | 竞品分析 | competitorName, score, alignment |

**10 种 Link Type**：

| Link Type | 源对象 | 目标对象 | 关系 |
|-----------|--------|----------|------|
| `toolBelongsToCategory` | AIGCTool | ToolCategory | 属于 |
| `toolProvidedBy` | AIGCTool | ToolProvider | 提供商 |
| `toolHasTag` | AIGCTool | ToolTag | 标签 |
| `toolSupportsUseCase` | AIGCTool | UseCase | 使用场景 |
| `toolHasPricingPlan` | AIGCTool | PricingPlan | 定价方案 |
| `toolHasCapability` | AIGCTool | ToolCapability | 能力 |
| `toolHasTechnicalSpec` | AIGCTool | TechnicalSpec | 技术规格 |
| `toolHasReview` | AIGCTool | UserReview | 评价 |
| `toolHasCompetitor` | AIGCTool | CompetitorAnalysis | 竞品 |
| `toolHasTrendMetric` | AIGCTool | TrendMetric | 趋势 |

**46 个 Function**（按类别）：

| 类别 | 数量 | 示例 |
|------|------|------|
| 排名 | 8 | `calculateComprehensiveRanking`, `calculateCategoryRanking` |
| 热度 | 8 | `calculateHeatScore`, `getTrendingTools` |
| 评分 | 7 | `calculateAverageRating`, `detectRatingAnomaly` |
| 推荐 | 7 | `getHomeRecommendations`, `getScenarioRecommendations` |
| 防作弊 | 6 | `detectGamingBehavior`, `calculateRiskScore` |
| 场景 | 5 | `matchScenario`, `getScenarioTools` |
| 通用 | 5 | `searchTools`, `filterTools` |

### 5.4.2 动力层映射：13 种 Logic Rules 的 Action 执行引擎

Action 执行引擎支持 13 种 Logic Rules：

| Rule | 说明 | 示例 |
|------|------|------|
| `create` | 创建新对象 | 创建 UserReview |
| `update` | 更新对象属性 | 更新工具评分 |
| `delete` | 删除对象 | 删除过期评价 |
| `link` | 创建对象关系 | 关联工具和分类 |
| `unlink` | 解除对象关系 | 移除工具标签 |
| `function` | 执行计算函数 | 计算排名 |
| `condition` | 条件分支 | 根据评分决定是否展示 |
| `loop` | 循环执行 | 批量更新工具 |
| `parallel` | 并行执行 | 同时计算多个指标 |
| `transform` | 数据转换 | 转换数据格式 |
| `validate` | 数据验证 | 验证评分范围 |
| `notify` | 发送通知 | 通知用户评价已审核 |
| `webhook` | 外部回调 | 调用外部 API |

```typescript
// Action 执行引擎核心逻辑
export class ActionExecutor {
  async executeRule(rule: LogicRule, context: ExecutionContext) {
    switch (rule.type) {
      case 'create':
        return await this.createObject(rule.objectType, context);
      case 'update':
        return await this.updateObject(rule.objectId, rule.properties, context);
      case 'function':
        return await this.executeFunction(rule.functionName, rule.parameters, context);
      case 'validate':
        return await this.validateData(rule.field, rule.constraints, context);
      // ... 其他规则
    }
  }
}
```

### 5.4.3 接口层映射：Interface 定义与多态实现

```typescript
// backend/src/ontology/aigc-schema/interfaces/aigc-interfaces.ts
export const aigcInterfaces: InterfaceType[] = [
  {
    apiName: 'Rankable',
    displayName: '可排名',
    description: '支持排名计算的对象',
    sharedProperties: [
      { apiName: 'rank', dataType: { type: 'integer' } },
      { apiName: 'score', dataType: { type: 'double' } },
    ],
  },
  {
    apiName: 'Rateable',
    displayName: '可评分',
    description: '支持用户评分的对象',
    sharedProperties: [
      { apiName: 'averageRating', dataType: { type: 'double' } },
      { apiName: 'reviewCount', dataType: { type: 'integer' } },
    ],
  },
  {
    apiName: 'Trackable',
    displayName: '可追踪',
    description: '支持行为追踪的对象',
    sharedProperties: [
      { apiName: 'viewCount', dataType: { type: 'integer' } },
      { apiName: 'favoriteCount', dataType: { type: 'integer' } },
    ],
  },
];
```

### 5.4.4 业务化扩展：动力层 → 动态层 → 对象层

Ontology 的三层架构支持自上而下的业务扩展：

```
业务需求：新增"工具对比"功能
    ↓
动力层：定义 compareTools Action
    ↓
动态层：实现 compareTools Function
    ↓
对象层：创建 CompareSession Object
    ↓
前端：开发对比页面
```

🎯 **实践环节**：阅读并理解 Prisma Schema 中的 Ontology 模型

---

## 5.5 项目路线图与学习路径

### 5.5.1 Phase 0-4：已完成的基础设施

| Phase | 内容 | 状态 |
|-------|------|------|
| **Phase 0** | 项目初始化、技术选型 | ✅ 完成 |
| **Phase 1** | Ontology 核心模型定义 | ✅ 完成 |
| **Phase 2** | 后端 API 开发 | ✅ 完成 |
| **Phase 3** | 前端页面开发 | ✅ 完成 |
| **Phase 4** | 数据集成与同步 | ✅ 完成 |

### 5.5.2 Phase 5-6：进行中的前端集成与生态飞轮

| Phase | 内容 | 状态 |
|-------|------|------|
| **Phase 5** | 前端 Ontology 集成 | 🔄 进行中 |
| **Phase 6** | 生态飞轮（推荐、排名、热度） | 🔄 进行中 |

### 5.5.3 如何通过贡献项目来学习 FDE 技能

**入门任务**：
1. 修复 Bug、完善文档、添加测试
2. 优化现有功能的性能

**进阶任务**：
1. 新增 Object Type（如 AIScenario）
2. 实现新的 Action（如批量导入）
3. 开发新的前端页面

**高级任务**：
1. 优化排名算法
2. 集成 LLM 能力
3. 构建生态飞轮

**架构任务**：
1. 性能优化
2. 安全加固
3. 多租户支持

🎯 **实践环节**：选择一个 Phase 任务开始动手

---

## 本章小结

本章全面介绍了 AI-API-COMPASS 项目：

1. **项目背景**：解决 AI 工具选择痛点，Ontology 架构实践场
2. **技术栈**：Fastify + Prisma + PostgreSQL + Redis + Next.js + TypeScript + Tailwind + Zustand
3. **架构设计**：五层架构（接口层 → 动作层 → 服务层 → 动态层 → 数据层）
4. **Ontology 映射**：11 个 Object Type、10 种 Link Type、46 个 Function、13 种 Logic Rules
5. **学习路径**：从入门到架构的渐进式贡献路径

通过本地部署和代码阅读，读者已经为后续章节的深入实践做好了准备。
