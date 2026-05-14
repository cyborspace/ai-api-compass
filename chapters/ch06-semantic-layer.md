# 第 6 章：对象属性定乾坤，链接接口织关系

> **核心问题**：如何定义"世界是什么"？
> **本章简介**：本章深入 Ontology 的语义层实现。从 Object Type 的设计艺术到 Property 的类型系统，从 Link Type 的关系建模到 Interface 的多态抽象，再到 Function 的计算能力——读者将掌握定义"世界是什么"的完整技术栈。每个概念均通过 AI-API-COMPASS 的真实代码进行演练，从理论到实践无缝衔接。

---

## 6.1 Object Type 设计

### 6.1.1 从业务概念到 Object Type：抽象的艺术

Object Type 是 Ontology 的基石，它将现实世界的业务概念转化为可计算的数字实体。设计一个好的 Object Type，需要平衡**业务表达力**和**技术可扩展性**。

在 AI-API-COMPASS 中，`AIGCTool` 是最核心的 Object Type。它的设计过程体现了从业务概念到技术抽象的完整路径：

**业务概念**："AI 工具"

**抽象过程**：
1. **识别核心特征**：名称、描述、价格、能力、平台...
2. **识别关系**：属于哪个分类？由谁提供？支持什么场景？
3. **识别行为**：可以被搜索、对比、评价、推荐...
4. **定义生命周期**：活跃、停用、下架...

```typescript
// backend/src/ontology/aigc-schema/object-types/aigc-tool.object-type.ts
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  displayName: 'AI工具',
  pluralDisplayName: 'AI工具列表',
  status: 'ACTIVE',
  description: 'AIGC领域的人工智能工具，支持多维度对比和智能推荐',
  icon: {
    blueprint: {
      color: '#8B5CF6',
      name: 'Bot'
    }
  },
  primaryKey: 'slug',
  titleProperty: 'name',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.object-type.aigc-tool',
  metaKind: 'Product',
  entityLevel: 'MetaEntity',
  groups: [
    { apiName: 'AIGCProduct', displayName: 'AIGC产品' },
    { apiName: 'Comparison', displayName: '对比分析' }
  ],
  aliases: ['AI工具', 'AIGC工具', '生成式AI工具'],
  // ... properties
};
```

### 6.1.2 Object Type 的元数据：名称、描述、图标、主键策略

Object Type 的元数据不仅用于技术实现，更用于**业务表达**。一个好的元数据设计，能让业务人员直观地理解这个对象是什么。

| 元数据 | 说明 | 示例 |
|--------|------|------|
| `apiName` | 程序名（PascalCase） | `AIGCTool` |
| `displayName` | 显示名（中文） | `AI工具` |
| `pluralDisplayName` | 复数显示名 | `AI工具列表` |
| `description` | 描述 | `AIGC领域的人工智能工具...` |
| `icon` | 图标 | 紫色机器人图标 |
| `primaryKey` | 主键属性 | `slug` |
| `titleProperty` | 标题属性 | `name` |
| `visibility` | 可见性 | `PROMINENT`（突出显示） |
| `aliases` | 别名 | `['AI工具', 'AIGC工具']` |

**主键策略的选择**：

| 策略 | 适用场景 | 示例 |
|------|----------|------|
| **自然键** | 有业务含义的唯一标识 | `slug`（URL 友好的标识） |
| **代理键** | 无业务含义，纯技术标识 | `id`（自增整数） |
| **复合键** | 需要多个字段联合唯一 | `toolSlug` + `platform` |

在 AI-API-COMPASS 中，我们采用**自然键**作为主键：

```typescript
primaryKey: 'slug',  // 如 "chatgpt", "midjourney"
titleProperty: 'name',  // 如 "ChatGPT", "Midjourney"
```

这种设计的优势：
1. **可读性**：`ri.aigc.main.object.aigc-tool.chatgpt` 比 `ri.aigc.main.object.aigc-tool.12345` 更易读
2. **稳定性**：业务标识通常比自增 ID 更稳定
3. **可预测性**：可以根据名称推断 RID

### 6.1.3 Object Type 继承与组合

Ontology 支持两种复用机制：**继承**和**组合**。

**继承**：通过 `extends` 复用父类型的属性

```typescript
// 基础类型：可索引的实体
export const IndexableObjectType: ObjectTypeV2 = {
  apiName: 'Indexable',
  properties: {
    slug: { dataType: { type: 'string' }, required: true },
    name: { dataType: { type: 'string' }, required: true },
    description: { dataType: { type: 'string' } },
  }
};

// AIGCTool 继承 Indexable
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  extends: ['Indexable'],  // 继承基础属性
  properties: {
    // 新增属性
    pricingType: { dataType: { type: 'string' } },
    supportedModalities: { dataType: { type: 'list', innerType: { type: 'string' } } },
    // ...
  }
};
```

**组合**：通过 Interface 实现多态复用

```typescript
// AIGCTool 实现多个 Interface
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  implements: ['IIndexable', 'IRatable', 'ITrackable', 'IPriced'],
  // ...
};
```

**继承 vs 组合的选择**：

| 场景 | 推荐机制 | 原因 |
|------|----------|------|
| "是一种"关系 | 继承 | `AIGCTool` 是一种 `Indexable` |
| "有一种能力"关系 | 组合/Interface | `AIGCTool` 可以被评分、被追踪 |
| 需要多继承 | Interface | TypeScript 不支持多类继承 |

### 6.1.4 设计原则：单一职责、高内聚低耦合

**单一职责原则**：一个 Object Type 只负责一类业务概念

```typescript
// ❌ 不好的设计：一个类型包含所有信息
export const BadToolObjectType: ObjectTypeV2 = {
  apiName: 'Tool',
  properties: {
    // 工具信息
    name: { dataType: { type: 'string' } },
    // 提供商信息（应该独立为 ToolProvider）
    providerName: { dataType: { type: 'string' } },
    providerWebsite: { dataType: { type: 'string' } },
    // 评价信息（应该独立为 UserReview）
    reviewContent: { dataType: { type: 'string' } },
    reviewRating: { dataType: { type: 'integer' } },
  }
};

// ✅ 好的设计：拆分为多个类型，通过 Link 关联
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  properties: {
    name: { dataType: { type: 'string' } },
    // 只包含工具自身的属性
  }
};

export const ToolProviderObjectType: ObjectTypeV2 = {
  apiName: 'ToolProvider',
  properties: {
    name: { dataType: { type: 'string' } },
    websiteUrl: { dataType: { type: 'string' } },
  }
};

export const UserReviewObjectType: ObjectTypeV2 = {
  apiName: 'UserReview',
  properties: {
    content: { dataType: { type: 'string' } },
    rating: { dataType: { type: 'integer' } },
  }
};
```

**高内聚低耦合**：相关的属性放在一起，不相关的属性通过 Link 关联

```typescript
// AIGCTool 的属性分组
properties: {
  // 核心标识（内聚：标识信息）
  slug: { group: '核心标识' },
  name: { group: '核心标识' },
  
  // 定价信息（内聚：价格相关）
  pricingType: { group: '定价信息' },
  startingPrice: { group: '定价信息' },
  currency: { group: '定价信息' },
  
  // 能力信息（内聚：功能相关）
  supportedModalities: { group: '能力信息' },
  platform: { group: '能力信息' },
  coreCapabilities: { group: '能力信息' },
  
  // 统计信息（内聚：数据相关）
  viewCount: { group: '统计' },
  favoriteCount: { group: '统计' },
  averageRating: { group: '统计' },
}
```

🎯 **实践环节**：在 AI-API-COMPASS 中新增一个 Object Type（如 AIScenario）

```typescript
// 练习：新增 AIScenario 对象类型
export const AIScenarioObjectType: ObjectTypeV2 = {
  apiName: 'AIScenario',
  displayName: 'AI应用场景',
  description: 'AI工具的具体应用场景',
  primaryKey: 'slug',
  titleProperty: 'title',
  icon: {
    blueprint: {
      color: '#10B981',
      name: 'Lightbulb'
    }
  },
  rid: 'ri.aigc.main.object-type.ai-scenario',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  
  properties: {
    slug: {
      dataType: { type: 'string' },
      required: true,
      isUnique: true,
      renderHints: { searchable: true, sortable: true }
    },
    title: {
      dataType: { type: 'string' },
      required: true,
      renderHints: { searchable: true, visibleInDefaultView: true }
    },
    description: {
      dataType: { type: 'string', maxLength: 2000 },
      renderHints: { searchable: true }
    },
    industry: {
      dataType: { type: 'string' },
      renderHints: { sortable: true, visibleInDefaultView: true }
    },
    difficulty: {
      dataType: { type: 'string' },
      valueTypeApiName: 'DifficultyLevel',
      renderHints: { sortable: true }
    },
    estimatedTime: {
      dataType: { type: 'string' },
      description: '预计完成时间'
    },
    requiredTools: {
      dataType: { type: 'list', innerType: { type: 'string' } },
      description: '所需工具列表'
    },
    steps: {
      dataType: { type: 'list', innerType: { type: 'string' } },
      description: '操作步骤'
    },
    createdAt: {
      dataType: { type: 'timestamp' },
      renderHints: { sortable: true }
    }
  }
};
```

---

## 6.2 Property 设计

### 6.2.1 Property 的类型系统：基础类型 vs 值类型（Value Type）

Property 的类型系统分为两层：**基础类型**和**值类型**。

**基础类型**：编程语言层面的数据类型

| 基础类型 | 说明 | 示例 |
|----------|------|------|
| `string` | 字符串 | `"ChatGPT"` |
| `integer` | 整数 | `100` |
| `double` | 浮点数 | `4.5` |
| `boolean` | 布尔值 | `true` |
| `date` | 日期 | `2024-01-15` |
| `timestamp` | 时间戳 | `2024-01-15T10:30:00Z` |
| `list` | 列表 | `["text", "image"]` |
| `map` | 映射 | `{"key": "value"}` |

**值类型（Value Type）**：业务语义层面的类型约束

```typescript
// backend/src/ontology/aigc-schema/value-types/aigc-value-types.ts
export const pricingTypeValueType: OntologyValueType = {
  apiName: 'PricingType',
  displayName: '定价模式',
  description: 'AI工具的收费模式',
  fieldType: { type: 'string' },
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['free', 'freemium', 'paid', 'subscription']
      }
    }
  ]
};
```

Value Type 的优势：
1. **语义约束**：`PricingType` 只能是 `free/freemium/paid/subscription`
2. **复用性**：多个 Property 可以引用同一个 Value Type
3. **可维护性**：修改 Value Type 的约束，所有引用它的 Property 自动生效

### 6.2.2 值类型（Value Type）：语义包装器与验证约束

Value Type 不仅定义了数据格式，还定义了**验证约束**。

**枚举约束**：

```typescript
export const objectStatusValueType: OntologyValueType = {
  apiName: 'ObjectStatus',
  displayName: '对象状态',
  fieldType: { type: 'string' },
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['active', 'inactive', 'deprecated', 'acquired']
      }
    }
  ]
};
```

**正则约束**：

```typescript
export const imageURLValueType: OntologyValueType = {
  apiName: 'ImageURL',
  displayName: '图片URL',
  fieldType: { type: 'string' },
  constraints: [
    {
      type: 'regex',
      regex: {
        pattern: '^(https?://)?[\w\-]+(\.[\w\-]+)+.*\.(jpg|jpeg|png|gif|webp|svg)$',
        partialMatch: false
      }
    }
  ]
};
```

**数组约束**：

```typescript
export const modalitiesValueType: OntologyValueType = {
  apiName: 'Modalities',
  displayName: 'AI模态',
  fieldType: { type: 'list', innerType: { type: 'string' } },
  constraints: [
    {
      type: 'array',
      array: {
        uniqueValues: true,  // 数组元素唯一
        valueConstraint: {
          type: 'enum',
          enum: {
            options: ['text', 'image', 'video', 'audio', 'code', '3d']
          }
        }
      }
    }
  ]
};
```

### 6.2.3 共享属性（Shared Property）：跨对象类型复用

Shared Property 是定义在 Interface 上的属性，可以被多个 Object Type 复用。

```typescript
// Interface 定义共享属性
export const iRatableInterface: InterfaceType = {
  apiName: 'IRatable',
  displayName: '可评分',
  properties: {
    averageRating: {
      dataType: { type: 'double' },
      requireImplementation: true  // 必须实现
    },
    reviewCount: {
      dataType: { type: 'integer' },
      requireImplementation: true
    }
  },
  implementedByObjectTypes: ['AIGCTool', 'ToolProvider']
};

// AIGCTool 实现 IRatable
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  implements: ['IRatable'],
  properties: {
    // 必须包含 averageRating 和 reviewCount
    averageRating: {
      dataType: { type: 'double' },
      defaultValue: 0
    },
    reviewCount: {
      dataType: { type: 'integer' },
      defaultValue: 0
    }
  }
};

// ToolProvider 也实现 IRatable
export const ToolProviderObjectType: ObjectTypeV2 = {
  apiName: 'ToolProvider',
  implements: ['IRatable'],
  properties: {
    averageRating: {
      dataType: { type: 'double' },
      defaultValue: 0
    },
    reviewCount: {
      dataType: { type: 'integer' },
      defaultValue: 0
    }
  }
};
```

### 6.2.4 属性的来源追溯（Lineage）

每个 Property 都有 `rid`，用于追溯其来源和变更历史。

```typescript
name: {
  dataType: { type: 'string' },
  rid: 'ri.aigc.main.property.aigc-tool.name',
  // 这个 rid 唯一标识了这个属性
  // 可以用于：
  // 1. 追踪属性的定义来源
  // 2. 记录属性的变更历史
  // 3. 在数据血缘中标识字段
}
```

🎯 **实践环节**：为 AI-API-COMPASS 定义 Value Type 和 Shared Property

---

## 6.3 Link Type 设计

### 6.3.1 关系建模的艺术：1:1、1:N、M:N 的选择

Link Type 定义了 Object 之间的关系，是 Ontology 的"神经网络"。

**三种基本关系**：

| 关系类型 | 说明 | 示例 |
|----------|------|------|
| `ONE_TO_ONE` | 一对一 | `AIGCTool` ↔ `TechnicalSpec` |
| `ONE_TO_MANY` | 一对多 | `AIGCTool` → `PricingPlan` |
| `MANY_TO_MANY` | 多对多 | `AIGCTool` ↔ `UseCase` |
| `MANY_TO_ONE` | 多对一 | `AIGCTool` → `ToolCategory` |

**选择原则**：

```
如果一个工具只有一个技术规格 → ONE_TO_ONE
如果一个工具有多个定价方案 → ONE_TO_MANY
如果一个工具属于多个场景，一个场景有多个工具 → MANY_TO_MANY
```

### 6.3.2 Link Type 的方向性与对称性

Link Type 是**双向的**，每个关系都有 A 侧和 B 侧。

```typescript
// backend/src/ontology/aigc-schema/link-types/tool-link-types.ts
export const toolProvidedByLinkType: LinkTypeV2 = {
  apiName: 'toolProvidedBy',
  displayName: '由...提供',
  
  // A 侧：工具
  aSideObjectTypeApiName: 'AIGCTool',
  aSideDisplayName: '提供商',
  aSideLinkApiName: 'providedTools',  // 从工具看：提供商
  
  // B 侧：提供商
  bSideObjectTypeApiName: 'ToolProvider',
  bSideDisplayName: '提供的工具',
  bSideLinkApiName: 'provider',  // 从提供商看：工具
  
  cardinality: 'MANY_TO_ONE',
  linkKind: 'FOREIGN_KEY'
};
```

**对称关系**：当 A 侧和 B 侧是同一个类型时

```typescript
export const toolCompetitorOfLinkType: LinkTypeV2 = {
  apiName: 'toolCompetitorOf',
  displayName: '竞品关系',
  
  // A 侧和 B 侧都是 AIGCTool
  aSideObjectTypeApiName: 'AIGCTool',
  bSideObjectTypeApiName: 'AIGCTool',
  
  // 两侧显示名相同
  aSideDisplayName: '竞品',
  bSideDisplayName: '竞品',
  aSideLinkApiName: 'competitors',
  bSideLinkApiName: 'competitors',
  
  cardinality: 'MANY_TO_MANY'
};
```

### 6.3.3 多跳查询与关系链（控制在 20 跳以内）

Ontology 支持多跳查询，但建议控制在 20 跳以内以保证性能。

```typescript
// 2 跳查询：工具 → 分类 → 同分类的其他工具
async function getRelatedTools(toolSlug: string) {
  // 1. 获取工具的分类
  const tool = await prisma.objects.findFirst({
    where: { 'properties->>slug': toolSlug },
    include: {
      links: {
        where: { linkTypeApiName: 'toolBelongsToCategory' }
      }
    }
  });
  
  // 2. 获取同分类的其他工具
  const categorySlug = tool.links[0].target.properties.slug;
  const relatedTools = await prisma.objects.findMany({
    where: {
      objectTypeApiName: 'AIGCTool',
      links: {
        some: {
          linkTypeApiName: 'toolBelongsToCategory',
          target: { 'properties->>slug': categorySlug }
        }
      }
    }
  });
  
  return relatedTools;
}
```

### 6.3.4 Link Type 与查询性能优化

不同的 `linkKind` 影响查询性能：

| linkKind | 说明 | 性能 | 适用场景 |
|----------|------|------|----------|
| `FOREIGN_KEY` | 外键关联 | 高 | 1:1, M:1 |
| `OBJECT_BACKED` | 对象支撑 | 中 | 1:N |
| `JOIN_TABLE` | 连接表 | 低 | M:N |

```typescript
// FOREIGN_KEY：最高效
export const toolBelongsToCategoryLinkType: LinkTypeV2 = {
  linkKind: 'FOREIGN_KEY',
  foreignKeyPropertyApiName: 'categorySlug',  // AIGCTool.categorySlug
  primaryKeyPropertyApiName: 'slug'  // ToolCategory.slug
};

// OBJECT_BACKED：中等效率
export const toolHasPricingPlanLinkType: LinkTypeV2 = {
  linkKind: 'OBJECT_BACKED',
  backingObjectApiName: 'PricingPlan'
};

// JOIN_TABLE：最低效，但最灵活
export const toolSuitableForLinkType: LinkTypeV2 = {
  linkKind: 'JOIN_TABLE',
  joinTableDatasetRid: 'ri.aigc.main.dataset.tool-use-case-links',
  joinTableAColumn: 'tool_slug',
  joinTableBColumn: 'use_case_slug'
};
```

🎯 **实践环节**：设计 AI-API-COMPASS 的完整关系图谱

---

## 6.4 Interface 设计

### 6.4.1 Interface 的概念：多态与抽象

Interface 是 Ontology 的"契约"，它定义了一组属性和关系，要求实现它的 Object Type 必须提供这些成员。

```typescript
// backend/src/ontology/aigc-schema/interfaces/aigc-interfaces.ts
export const iRatableInterface: InterfaceType = {
  apiName: 'IRatable',
  displayName: '可评分',
  description: '支持用户评分的实体',
  
  properties: {
    averageRating: {
      dataType: { type: 'double' },
      requireImplementation: true  // 必须实现
    },
    reviewCount: {
      dataType: { type: 'integer' },
      requireImplementation: true
    }
  },
  
  // 哪些 Object Type 实现了这个 Interface
  implementedByObjectTypes: ['AIGCTool', 'ToolProvider']
};
```

Interface 的价值：
1. **多态**：可以统一处理实现了同一 Interface 的不同类型
2. **抽象**：将共性提取出来，避免重复定义
3. **约束**：确保实现类型提供必要的属性和关系

### 6.4.2 Interface 继承：extendedInterfaces

Interface 支持继承，可以构建层次化的接口体系。

```typescript
// 基础接口：可索引
export const iIndexableInterface: InterfaceType = {
  apiName: 'IIndexable',
  properties: {
    slug: { dataType: { type: 'string' }, requireImplementation: true },
    name: { dataType: { type: 'string' }, requireImplementation: true }
  }
};

// 扩展接口：可搜索（继承可索引）
export const iSearchableInterface: InterfaceType = {
  apiName: 'ISearchable',
  extendsInterfaces: ['IIndexable'],  // 继承 IIndexable
  properties: {
    description: { dataType: { type: 'string' }, requireImplementation: false },
    keywords: { dataType: { type: 'list', innerType: { type: 'string' } }, requireImplementation: false }
  }
};
```

### 6.4.3 Interface 与 Link Type 的约束

Interface 不仅可以定义属性，还可以定义关系。

```typescript
export const iPricedInterface: InterfaceType = {
  apiName: 'IPriced',
  displayName: '有价格',
  
  properties: {
    pricingType: { dataType: { type: 'string' }, requireImplementation: true },
    startingPrice: { dataType: { type: 'integer' }, requireImplementation: false }
  },
  
  // Interface 也可以定义关系
  links: {
    pricingPlans: {
      linkedEntityApiName: { objectTypeApiName: 'PricingPlan' },
      cardinality: 'ONE_TO_MANY',
      required: false
    }
  },
  
  implementedByObjectTypes: ['AIGCTool']
};
```

### 6.4.4 Interface 实现检查

Ontology 提供实现检查机制，确保 Object Type 正确实现了 Interface。

```typescript
// 实现检查
function checkInterfaceImplementation(
  objectType: ObjectTypeV2,
  interfaceType: InterfaceType
): ValidationResult {
  const errors: string[] = [];
  
  // 检查必需属性
  for (const [propName, propDef] of Object.entries(interfaceType.properties)) {
    if (propDef.requireImplementation) {
      if (!objectType.properties[propName]) {
        errors.push(`Missing required property: ${propName}`);
      }
    }
  }
  
  // 检查必需关系
  for (const [linkName, linkDef] of Object.entries(interfaceType.links || {})) {
    if (linkDef.required) {
      if (!objectType.links?.[linkName]) {
        errors.push(`Missing required link: ${linkName}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

🎯 **实践环节**：为 AI-API-COMPASS 设计 Rateable 接口

---

## 6.5 Function 设计

### 6.5.1 Function 的概念：Ontology 中的"计算能力"

Function 是 Ontology 的"计算单元"，它封装了业务逻辑，可以被 Actions 调用，也可以被前端直接调用。

```typescript
// backend/src/ontology/aigc-schema/functions/ranking-functions.ts
export const getCompositeRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-composite-rankings',
  apiName: 'getCompositeRankings',
  displayName: '综合榜',
  description: '获取AI工具的综合排名列表，考虑性能、价格、热度等多维度指标',
  
  // 函数类型
  decorator: 'QueryFunction',  // 查询函数
  
  // 参数定义
  parameters: [
    {
      apiName: 'perspective',
      displayName: '计算视角',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    },
    {
      apiName: 'category',
      displayName: '分类筛选',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 20
    }
  ],
  
  // 返回值
  returnType: {
    dataType: { type: 'object' },
    description: '综合排名列表结果'
  },
  
  // 绑定到哪些 Object Type
  boundObjectTypes: ['AIGCTool', 'ToolCategory', 'TrendMetric'],
  
  // 执行配置
  timeoutMs: 30000,
  performsEdits: false,  // 是否修改数据
  
  // 缓存配置
  metadata: {
    category: 'ranking',
    cacheConfig: {
      enabled: true,
      ttl: 300  // 5分钟缓存
    }
  }
};
```

### 6.5.2 Function 的分类：排名、热度、评分、推荐、防作弊

AI-API-COMPASS 的 46 个 Function 按业务领域分类：

| 类别 | 数量 | 示例 |
|------|------|------|
| **排名** | 8 | `getCompositeRankings`, `getPerformanceRankings` |
| **热度** | 8 | `calculateHeatScore`, `getTrendingTools` |
| **评分** | 7 | `calculateAverageRating`, `detectRatingAnomaly` |
| **推荐** | 7 | `getHomeRecommendations`, `getScenarioRecommendations` |
| **防作弊** | 6 | `detectGamingBehavior`, `calculateRiskScore` |
| **场景** | 5 | `matchScenario`, `getScenarioTools` |
| **通用** | 5 | `searchTools`, `filterTools` |

### 6.5.3 Function 的参数与返回值

**参数设计原则**：

```typescript
parameters: [
  {
    apiName: 'category',  // 程序名（camelCase）
    displayName: '分类筛选',  // 显示名（中文）
    description: '按工具分类slug筛选',  // 描述
    dataType: { type: 'string' },  // 数据类型
    required: false,  // 是否必需
    defaultValue: null  // 默认值
  }
]
```

**返回值设计**：

```typescript
returnType: {
  dataType: { type: 'object' },
  description: '综合排名列表结果',
  // 可以定义更复杂的返回结构
  schema: {
    rankings: {
      type: 'list',
      items: {
        type: 'object',
        properties: {
          toolRid: { type: 'string' },
          rank: { type: 'integer' },
          score: { type: 'double' },
          breakdown: { type: 'object' }
        }
      }
    }
  }
}
```

### 6.5.4 Function 执行引擎的设计

Function 执行引擎负责：
1. **参数解析**：验证和转换输入参数
2. **权限检查**：验证调用者是否有权限
3. **缓存查询**：检查缓存是否命中
4. **执行计算**：调用实际的业务逻辑
5. **结果缓存**：将结果写入缓存
6. **返回结果**：格式化并返回

```typescript
// Function 执行引擎
export class FunctionExecutor {
  async execute(functionApiName: string, parameters: any) {
    // 1. 获取函数定义
    const funcDef = await this.registry.getFunction(functionApiName);
    
    // 2. 验证参数
    const validatedParams = this.validateParameters(parameters, funcDef.parameters);
    
    // 3. 检查缓存
    const cacheKey = this.generateCacheKey(functionApiName, validatedParams);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 4. 执行函数
    const result = await this.invokeFunction(funcDef, validatedParams);
    
    // 5. 写入缓存
    if (funcDef.metadata?.cacheConfig?.enabled) {
      await this.cache.set(cacheKey, result, funcDef.metadata.cacheConfig.ttl);
    }
    
    // 6. 返回结果
    return result;
  }
}
```

🎯 **实践环节**：实现 AI-API-COMPASS 的一个新 Function

```typescript
// 练习：实现 getNewArrivals 函数（获取新上架工具）
export const getNewArrivalsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-new-arrivals',
  apiName: 'getNewArrivals',
  displayName: '新上架',
  description: '获取最近30天内新上架的AI工具',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'days',
      displayName: '天数',
      description: '最近多少天内',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 30
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 10
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '新上架工具列表'
  },
  
  boundObjectTypes: ['AIGCTool'],
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'discovery',
    cacheConfig: {
      enabled: true,
      ttl: 3600  // 1小时缓存
    }
  }
};
```

---

## 本章小结

本章深入介绍了 Ontology 语义层的核心组件：

1. **Object Type**：业务实体的数字映射，包含元数据、属性、关系
2. **Property**：带语义的字段，支持基础类型和 Value Type
3. **Link Type**：对象之间的关系，支持 1:1、1:N、M:N
4. **Interface**：多态与抽象的契约，支持继承和实现检查
5. **Function**：Ontology 的计算能力，支持参数、返回值、缓存

通过 AI-API-COMPASS 的真实代码，我们看到了这些概念如何从理论落地到实践。
