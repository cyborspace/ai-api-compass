# 对象层设计 — 当前数据模型与 Ontology 架构

> 对象层是整个系统的静态骨架，定义了 AI 工具的所有结构化元数据。本文档记录当前的 Ontology 数据模型设计，以及扩展方向。

---

## 1. 当前数据模型

### 1.1 Prisma Schema 结构

```prisma
// 核心 ObjectType 模型
model ObjectType {
  id          String   @id @default(cuid())
  apiName     String   @unique  // API 友好名称，如 "aigc_tool"
  rid         String   @unique  // 资源标识符
  displayName String            // 显示名称
  description String?
  icon        String?            // 图标 URL
  color       String?            // 主题色
  status      String   @default("active")
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  objects Object[]
  linkTypesAsSource LinkType[] @relation("SourceObjectType")
  linkTypesAsTarget LinkType[] @relation("TargetObjectType")
}

// Object 实例（工具、分类等）
model Object {
  id            String   @id @default(cuid())
  objectTypeId   String
  rid           String
  ontologyRid   String?
  properties    Json     // 存储所有属性
  status        String   @default("active")
  dataSourceId  String?
  externalId    String?
  version       Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  objectType ObjectType @relation(fields: [objectTypeId], references: [id])

  // 复合唯一键
  @@unique([objectTypeId, rid])

  // 索引
  @@index([objectTypeId])
  @@index([ontologyRid])
}

// LinkType 定义对象间的关系类型
model LinkType {
  id          String   @id @default(cuid())
  apiName     String   @unique
  rid         String   @unique
  displayName String
  description String?
  sourceObjectTypeId String?
  targetObjectTypeId String?
  cardinality String   @default("one_to_many")  // one_to_one, one_to_many, many_to_many
  visibility  String   @default("public")
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sourceObjectType ObjectType? @relation("SourceObjectType", fields: [sourceObjectTypeId], references: [id])
  targetObjectType ObjectType? @relation("TargetObjectType", fields: [targetObjectTypeId], references: [id])
  links Link[]
}

// Link 实例（对象间的关系）
model Link {
  id          String   @id @default(cuid())
  linkTypeId  String
  sourceObjectId String
  targetObjectId String
  properties  Json?
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  linkType   LinkType @relation(fields: [linkTypeId], references: [id])

  // 索引
  @@index([linkTypeId])
  @@index([sourceObjectId])
  @@index([targetObjectId])
}
```

### 1.2 当前数据统计

| 数据类型 | 数量 | 说明 |
|----------|------|------|
| **ObjectType** | 2 | `aigc_tool`, `tool_category` |
| **Object (工具)** | 295 | 来自 aigc.cn 爬取的 AI 工具 |
| **Object (分类)** | 10 | 工具分类 |
| **LinkType** | 1 | `tool_belongs_to_category` |
| **Link** | 303 | 工具-分类关联关系 |

---

## 2. ObjectType 设计

### 2.1 AIGCTool ObjectType

```typescript
// AIGCTool 的 ObjectType 定义
const AIGCToolObjectType = {
  apiName: 'aigc_tool',
  rid: 'objecttype:aigc-tool',
  displayName: 'AI 工具',
  description: 'AI 生成内容相关的工具和服务',
  icon: '🤖',
  color: '#6366F1',

  // 核心属性（存储在 Object.properties JSON 中）
  properties: {
    // 基础信息
    name: { type: 'string', required: true, displayName: '工具名称' },
    slug: { type: 'string', required: true, unique: true, displayName: 'URL 标识' },
    description: { type: 'string', displayName: '描述' },

    // 开发商信息
    developer: { type: 'string', displayName: '开发商' },
    developerUrl: { type: 'string', displayName: '开发商官网' },

    // 网站信息
    website: { type: 'string', displayName: '官方网站' },
    documentation: { type: 'string', displayName: '文档链接' },
    apiEndpoint: { type: 'string', displayName: 'API 地址' },

    // 分类
    categories: {
      type: 'array',
      items: { type: 'string' },  // 存储分类 Object 的 rid
      displayName: '所属分类',
    },

    // 定价
    pricingModel: {
      type: 'enum',
      values: ['free', 'subscription', 'per_token', 'per_call', 'freemium', 'contact_sales', 'unknown'],
      displayName: '定价模型',
    },
    priceRange: { type: 'string', displayName: '价格区间' },
    priceDetails: { type: 'json', displayName: '详细定价' },

    // 技术规格
    contextWindow: { type: 'number', displayName: '上下文窗口 (tokens)' },
    maxOutputTokens: { type: 'number', displayName: '最大输出 tokens' },
    supportedModalities: {
      type: 'array',
      items: { type: 'enum', values: ['text', 'image', 'audio', 'video', 'code'] },
      displayName: '支持模态',
    },
    capabilities: {
      type: 'array',
      items: { type: 'string' },
      displayName: '能力标签',
    },

    // 状态
    status: { type: 'enum', values: ['active', 'deprecated', 'beta', 'unknown'], displayName: '状态' },

    // 扩展字段
    releaseDate: { type: 'date', displayName: '发布日期' },
    lastUpdated: { type: 'date', displayName: '最后更新' },
  },
};
```

### 2.2 ToolCategory ObjectType

```typescript
const ToolCategoryObjectType = {
  apiName: 'tool_category',
  rid: 'objecttype:tool-category',
  displayName: '工具分类',
  description: 'AI 工具的分类目录',
  icon: '📁',
  color: '#10B981',

  properties: {
    name: { type: 'string', required: true, displayName: '分类名称' },
    slug: { type: 'string', required: true, unique: true, displayName: 'URL 标识' },
    description: { type: 'string', displayName: '分类描述' },
    parentCategoryRid: { type: 'string', displayName: '父分类' },
    toolCount: { type: 'number', displayName: '工具数量' },
    icon: { type: 'string', displayName: '分类图标' },
    color: { type: 'string', displayName: '主题色' },
  },
};
```

### 2.3 现有分类数据

| 分类名称 | Slug | 工具数量 | 图标 |
|----------|------|----------|------|
| AI对话 | ai-chatbots | 35 | 💬 |
| AI写作 | ai-writing | 28 | ✍️ |
| AI图像 | ai-image | 45 | 🎨 |
| AI视频 | ai-video | 22 | 🎬 |
| AI音频 | ai-audio | 18 | 🎵 |
| AI代码 | ai-code | 25 | 💻 |
| AI设计 | ai-design | 20 | 🎨 |
| AI办公 | ai-office | 15 | 📊 |
| AI营销 | ai-marketing | 12 | 📈 |
| AI搜索 | ai-search | 10 | 🔍 |

---

## 3. LinkType 设计

### 3.1 现有 LinkType

```typescript
const toolBelongsToCategory = {
  apiName: 'tool_belongs_to_category',
  rid: 'linktype:tool-belongs-to-category',
  displayName: '工具属于分类',
  description: '工具与其所属分类的关系',
  cardinality: 'many_to_many',  // 一个工具可属于多个分类
  visibility: 'public',
};
```

### 3.2 计划中的 LinkType

```typescript
// 计划添加的 LinkType
const PLANNED_LINK_TYPES = [
  {
    apiName: 'tool_is_similar_to',
    displayName: '工具相似',
    description: '功能相似的工具',
    cardinality: 'many_to_many',
  },
  {
    apiName: 'tool_is_alternative_to',
    displayName: '工具替代',
    description: '可互相替代的工具',
    cardinality: 'many_to_many',
  },
  {
    apiName: 'tool_is_competitor_of',
    displayName: '工具竞争',
    description: '同一赛道的竞争对手',
    cardinality: 'many_to_many',
  },
  {
    apiName: 'tool_uses_model',
    displayName: '工具使用模型',
    description: '工具底层使用的 AI 模型',
    cardinality: 'many_to_one',
    targetObjectType: 'ai_model',
  },
  {
    apiName: 'tool_provides_capability',
    displayName: '工具提供能力',
    description: '工具提供的具体能力',
    cardinality: 'many_to_many',
    targetObjectType: 'capability',
  },
];
```

---

## 4. 扩展 ObjectType 规划

### 4.1 AI Model ObjectType（Phase 2）

```typescript
const AIModelObjectType = {
  apiName: 'ai_model',
  rid: 'objecttype:ai-model',
  displayName: 'AI 模型',
  description: '底层的 AI 大模型',

  properties: {
    name: { type: 'string', required: true, displayName: '模型名称' },
    provider: { type: 'string', displayName: '模型提供商' },
    version: { type: 'string', displayName: '版本号' },
    contextWindow: { type: 'number', displayName: '上下文窗口' },
    capabilities: { type: 'array', items: { type: 'string' }, displayName: '能力' },
    benchmarkScores: { type: 'json', displayName: '基准分数' },
    releaseDate: { type: 'date', displayName: '发布日期' },
  },

  links: {
    usedBy: { targetObjectType: 'aigc_tool', description: '使用此模型的工具' },
    parentModel: { targetObjectType: 'ai_model', description: '父模型（如果是微调版本）' },
  },
};
```

### 4.2 PricingTier ObjectType（Phase 1）

```typescript
const PricingTierObjectType = {
  apiName: 'pricing_tier',
  rid: 'objecttype:pricing-tier',
  displayName: '价格档位',
  description: '工具的定价档位信息',

  properties: {
    name: { type: 'string', required: true, displayName: '档位名称' },
    // 如 "Free", "Pro", "Enterprise"
    price: { type: 'number', displayName: '价格' },
    currency: { type: 'string', displayName: '货币', default: 'USD' },
    unit: { type: 'enum', values: ['per_month', 'per_token', 'per_call', 'per_user'], displayName: '计费单位' },
    pricePerUnit: { type: 'number', displayName: '每单位价格' },
    features: { type: 'array', items: { type: 'string' }, displayName: '包含功能' },
    limits: { type: 'json', displayName: '限制条件' },
    // 如 { requests: 1000, tokens: 1000000 }
  },

  links: {
    tierOf: { targetObjectType: 'aigc_tool', description: '该档位所属工具' },
  },
};
```

### 4.3 BenchmarkScore ObjectType（Phase 2）

```typescript
const BenchmarkScoreObjectType = {
  apiName: 'benchmark_score',
  rid: 'objecttype:benchmark-score',
  displayName: '基准测试分数',
  description: 'AI 模型在各基准测试中的分数',

  properties: {
    benchmarkName: { type: 'string', required: true, displayName: '基准测试名称' },
    // 如 "MMLU", "HellaSwag", "HumanEval", "MATH"
    score: { type: 'number', displayName: '分数' },
    scoreType: { type: 'enum', values: ['accuracy', 'pass_at_k', 'auc'], displayName: '分数类型' },
    rank: { type: 'number', displayName: '排名' },
    source: { type: 'string', displayName: '数据来源' },
    testDate: { type: 'date', displayName: '测试日期' },
  },

  links: {
    scores: { targetObjectType: 'aigc_tool', description: '分数所属工具' },
    ranks: { targetObjectType: 'ai_model', description: '分数所属模型' },
  },
};
```

### 4.4 RankingRecord ObjectType（Phase 2）

```typescript
const RankingRecordObjectType = {
  apiName: 'ranking_record',
  rid: 'objecttype:ranking-record',
  displayName: '排名记录',
  description: '工具在各个排名榜单中的位置',

  properties: {
    source: { type: 'string', required: true, displayName: '排名来源' },
    // 如 "lmsys", "artificial_analysis", "openrouter"
    rankingType: { type: 'enum', values: ['composite', 'speed', 'quality', 'price', 'popularity'], displayName: '排名类型' },
    rank: { type: 'number', displayName: '排名' },
    score: { type: 'number', displayName: '分数' },
    sampleSize: { type: 'number', displayName: '样本量' },
    capturedAt: { type: 'datetime', displayName: '采集时间' },
  },

  links: {
    ranks: { targetObjectType: 'aigc_tool', description: '排名记录的工具' },
  },
};
```

### 4.5 UserRating ObjectType（Phase 4）

```typescript
const UserRatingObjectType = {
  apiName: 'user_rating',
  rid: 'objecttype:user-rating',
  displayName: '用户评分',
  description: '社区用户对工具的评分',

  properties: {
    overallScore: { type: 'number', min: 1, max: 5, displayName: '综合评分' },
    easeOfUseScore: { type: 'number', min: 1, max: 5, displayName: '易用性评分' },
    performanceScore: { type: 'number', min: 1, max: 5, displayName: '性能评分' },
    valueScore: { type: 'number', min: 1, max: 5, displayName: '性价比评分' },
    review: { type: 'string', displayName: '评测文字' },
    useCase: { type: 'string', displayName: '使用场景' },
    helpfulVotes: { type: 'number', displayName: '有帮助票数' },
    createdAt: { type: 'datetime', displayName: '评分时间' },
  },

  links: {
    rates: { targetObjectType: 'aigc_tool', description: '评分的工具' },
    reviewer: { targetObjectType: 'user', description: '评分用户' },
  },
};
```

---

## 5. 数据示例

### 5.1 AIGCTool Object 示例

```json
{
  "id": "clw1234567890abcdef",
  "objectTypeId": "clwaigctool123",
  "rid": "aigc-tool:claude-3-5-sonnet",
  "ontologyRid": "aigc-tool:claude-3-5-sonnet",
  "properties": {
    "name": "Claude 3.5 Sonnet",
    "slug": "claude-3-5-sonnet",
    "developer": "Anthropic",
    "developerUrl": "https://www.anthropic.com",
    "website": "https://claude.ai",
    "description": "Anthropic 最新一代 AI 助手，在编程和复杂推理任务上表现卓越",
    "pricingModel": "per_token",
    "priceRange": "$3/1M tokens (input), $15/1M tokens (output)",
    "contextWindow": 200000,
    "supportedModalities": ["text", "image"],
    "capabilities": [
      "code_generation",
      "complex_reasoning",
      "creative_writing",
      "data_analysis",
      "multimodal"
    ],
    "status": "active",
    "releaseDate": "2024-06-21"
  },
  "status": "active",
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-06-21T00:00:00Z"
}
```

### 5.2 ToolCategory Object 示例

```json
{
  "id": "clwcategory123456",
  "objectTypeId": "clwcat123",
  "rid": "tool-category:ai-chatbots",
  "ontologyRid": "tool-category:ai-chatbots",
  "properties": {
    "name": "AI对话",
    "slug": "ai-chatbots",
    "description": "AI 对话助手和聊天机器人",
    "icon": "💬",
    "color": "#6366F1",
    "toolCount": 35
  },
  "status": "active",
  "version": 1,
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### 5.3 Link 示例

```json
{
  "id": "clwlink123456",
  "linkTypeId": "clwlinktype123",
  "sourceObjectId": "clw1234567890abcdef",
  "targetObjectId": "clwcategory123456",
  "properties": {
    "isPrimaryCategory": true,
    "addedAt": "2024-01-15T10:30:00Z"
  },
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 6. ObjectType 创建流程

```typescript
// 创建新的 ObjectType
async function createObjectType(
  name: string,
  displayName: string,
  description: string,
  properties: PropertyDefinition[]
): Promise<ObjectType> {
  // 1. 生成唯一的 RID
  const rid = `objecttype:${name.toLowerCase().replace(/\s+/g, '-')}`;

  // 2. 创建 ObjectType 记录
  const objectType = await prisma.objectType.create({
    data: {
      apiName: name,
      rid,
      displayName,
      description,
      icon: '📦',
      color: '#6366F1',
      status: 'active',
    },
  });

  // 3. 更新 properties schema（可以存储在外部配置中）
  // properties 定义存储在代码中，不直接存入数据库

  return objectType;
}

// 创建 Object 实例
async function createObject(
  objectTypeId: string,
  rid: string,
  properties: Record<string, any>
): Promise<Object> {
  return await prisma.object.create({
    data: {
      objectTypeId,
      rid,
      ontologyRid: rid,  // 当前 RID 和 ontologyRid 相同
      properties,
      status: 'active',
    },
  });
}
```

---

## 7. 查询接口设计

### 7.1 基础查询

```typescript
// 获取所有工具
async function getAllTools(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<AIGCTool[]> {
  return await prisma.object.findMany({
    where: {
      objectType: { apiName: 'aigc_tool' },
      ...(options?.category && {
        properties: {
          path: ['categories'],
          array_contains: options.category,
        },
      }),
    },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

// 获取工具详情
async function getToolBySlug(slug: string): Promise<AIGCTool | null> {
  return await prisma.object.findFirst({
    where: {
      objectType: { apiName: 'aigc_tool' },
      properties: {
        path: ['slug'],
        equals: slug,
      },
    },
  });
}

// 获取分类及其工具
async function getCategoryWithTools(categorySlug: string): Promise<CategoryWithTools> {
  const category = await prisma.object.findFirst({
    where: {
      objectType: { apiName: 'tool_category' },
      properties: { path: ['slug'], equals: categorySlug },
    },
  });

  if (!category) return null;

  const tools = await prisma.object.findMany({
    where: {
      objectType: { apiName: 'aigc_tool' },
      properties: {
        path: ['categories'],
        array_contains: category.rid,
      },
    },
  });

  return { ...category, tools };
}
```

### 7.2 高级查询

```typescript
// 按属性筛选工具
async function queryTools(filters: {
  pricingModel?: string;
  minContextWindow?: number;
  capabilities?: string[];
  developer?: string;
}): Promise<AIGCTool[]> {
  const where: any = {
    objectType: { apiName: 'aigc_tool' },
  };

  if (filters.pricingModel) {
    where.properties = {
      ...where.properties,
      path: ['pricingModel'],
      equals: filters.pricingModel,
    };
  }

  if (filters.minContextWindow) {
    where.properties = {
      ...where.properties,
      path: ['contextWindow'],
      gte: filters.minContextWindow,
    };
  }

  return await prisma.object.findMany({
    where,
    take: 100,
  });
}
```

---

## 8. 数据迁移策略

### 8.1 从 JSON 迁移到数据库

```typescript
// scripts/migrate_from_json.ts
async function migrateToolsFromJSON(jsonData: AIGCToolJSON[]) {
  const objectType = await getObjectType('aigc_tool');

  for (const tool of jsonData) {
    // 检查是否已存在
    const existing = await prisma.object.findFirst({
      where: {
        objectTypeId: objectType.id,
        rid: tool.rid,
      },
    });

    if (existing) {
      // 更新
      await prisma.object.update({
        where: { id: existing.id },
        data: {
          properties: tool.properties,
          updatedAt: new Date(),
        },
      });
    } else {
      // 创建
      await prisma.object.create({
        data: {
          objectTypeId: objectType.id,
          rid: tool.rid,
          ontologyRid: tool.rid,
          properties: tool.properties,
          status: 'active',
        },
      });
    }
  }
}
```

---

*Last updated: 2026-05-09*
*相关文档: [数据采集规划](./data-collection.md) | [动态层设计](./dynamic-layer.md)*