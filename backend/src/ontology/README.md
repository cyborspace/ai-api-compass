# AIGC工具导航 - Ontology Schema

## 概述

本目录包含 **AIGC工具导航平台** 的完整 Ontology 定义，严格遵循 Palantir Foundry Ontology 三层架构。

## 目录结构

```
ontology/
├── index.ts                                    # 主入口
├── aigc-schema/
│   ├── index.ts                               # Schema 主入口
│   ├── ontology-manifest.ts                   # Ontology Manifest
│   │
│   ├── object-types/                         # 语义层 - ObjectType 定义
│   │   ├── aigc-tool.object-type.ts         # AI工具
│   │   ├── tool-category.object-type.ts      # 工具分类
│   │   ├── tool-provider.object-type.ts     # 工具提供商
│   │   ├── tool-tag.object-type.ts          # 工具标签
│   │   ├── use-case.object-type.ts          # 使用场景
│   │   ├── pricing-plan.object-type.ts      # 定价方案
│   │   ├── tool-capability.object-type.ts   # 工具能力
│   │   ├── technical-spec.object-type.ts    # 技术规格
│   │   ├── user-review.object-type.ts       # 用户评价
│   │   ├── trend-metric.object-type.ts      # 趋势数据
│   │   └── competitor-analysis.object-type.ts # 竞品分析
│   │
│   ├── link-types/                          # 语义层 - LinkType 定义
│   │   └── tool-link-types.ts              # 7个LinkType
│   │
│   ├── value-types/                        # 语义层 - ValueType 定义
│   │   └── aigc-value-types.ts            # 13个ValueType
│   │
│   ├── action-types/                       # 动力层 - ActionType 定义
│   │   └── aigc-action-types.ts           # 4个ActionType
│   │
│   ├── functions/                          # 动力层 - Function 定义
│   │   └── aigc-functions.ts              # 5个Function
│   │
│   └── interfaces/                        # 接口层 - Interface 定义
│       └── aigc-interfaces.ts             # 4个Interface
```

## 三层架构

### 1. 语义层 (Semantic Layer)

**ObjectType (11个)**

| ObjectType | 说明 | Groups |
|-----------|------|--------|
| `AIGCTool` | AI工具核心实体 | AIGCProduct, Comparison |
| `ToolCategory` | 工具分类 | AIGCProduct |
| `ToolProvider` | 工具提供商 | AIGCProduct |
| `ToolTag` | 工具标签 | - |
| `UseCase` | 使用场景 | AIGCProduct |
| `PricingPlan` | 定价方案 | Comparison |
| `ToolCapability` | 工具能力 | Comparison |
| `TechnicalSpec` | 技术规格 | Comparison |
| `UserReview` | 用户评价 | Comparison |
| `TrendMetric` | 趋势数据 | Comparison |
| `CompetitorAnalysis` | 竞品分析 | Comparison |

**LinkType (7个)**

| LinkType | 源 → 目标 | 基数 |
|---------|-----------|------|
| `toolProvidedBy` | AIGCTool → ToolProvider | MANY_TO_ONE |
| `toolBelongsToCategory` | AIGCTool → ToolCategory | MANY_TO_ONE |
| `toolHasPricingPlan` | AIGCTool → PricingPlan | ONE_TO_MANY |
| `toolHasCapability` | AIGCTool → ToolCapability | ONE_TO_ONE |
| `toolSuitableFor` | AIGCTool → UseCase | MANY_TO_MANY |
| `toolCompetitorOf` | AIGCTool → AIGCTool | MANY_TO_MANY |
| `toolHasReview` | AIGCTool → UserReview | ONE_TO_MANY |

**ValueType (13个)**

- `PricingType` - 定价模式 (free/freemium/paid/subscription)
- `Currency` - 货币代码
- `Modalities` - AI模态
- `Platform` - 支持平台
- `CapabilityCategory` - 能力分类
- `RelationshipType` - 竞品关系类型
- `Region` - 地区
- `PlanType` - 方案类型
- `ObjectStatus` - 对象状态
- `ImageURL` - 图片URL
- `URL` - 网页URL
- `Color` - 颜色代码
- `SemanticVersion` - 语义化版本

### 2. 动力层 (Kinetic Layer)

**ActionType (4个)**

| ActionType | 说明 |
|-----------|------|
| `createFavorite` | 创建收藏 |
| `compareTools` | 对比工具 |
| `submitReview` | 提交评价 |
| `trackToolView` | 记录浏览 |

**Function (5个)**

| Function | 说明 | 类型 |
|---------|------|------|
| `searchTools` | 搜索工具 | QueryFunction |
| `compareTools` | 多维度对比 | QueryFunction |
| `getSimilarTools` | 相似工具推荐 | QueryFunction |
| `findCostEffectiveAlternatives` | 性价比替代 | QueryFunction |
| `incrementViewCount` | 增加浏览数 | OntologyEditFunction |

### 3. 接口层 (Interface Layer)

| Interface | 说明 | 实现类型 |
|----------|------|---------|
| `IIndexable` | 可搜索接口 | AIGCTool, ToolCategory, ToolProvider, UseCase |
| `IRatable` | 可评分接口 | AIGCTool, ToolProvider |
| `ITrackable` | 可追踪接口 | AIGCTool |
| `IPriced` | 有价格接口 | AIGCTool |

## 使用示例

### 导入 Ontology Manifest

```typescript
import { aigcOntologyManifest } from './ontology';

console.log(aigcOntologyManifest.name); // "AIGC工具导航"
console.log(aigcOntologyManifest.stats.totalObjectTypes); // 11
```

### 导入特定 ObjectType

```typescript
import { AIGCToolObjectType } from './ontology';

// 获取 AIGCTool 的所有属性
const properties = Object.keys(AIGCToolObjectType.properties);
console.log(properties);
// ['slug', 'name', 'fullName', 'tagline', ...]
```

### 导入 LinkTypes

```typescript
import { aigcLinkTypes } from './ontology';

// 获取所有 LinkType
const linkTypeNames = aigcLinkTypes.map(lt => lt.apiName);
console.log(linkTypeNames);
// ['toolProvidedBy', 'toolBelongsToCategory', 'toolHasPricingPlan', ...]
```

### 导入 Functions

```typescript
import { aigcFunctions } from './ontology';

// 查找特定 Function
const searchFunc = aigcFunctions.find(f => f.apiName === 'searchTools');
console.log(searchFunc?.parameters);
// [{ apiName: 'query', ... }, { apiName: 'category', ... }]
```

## 类型定义

所有类型定义遵循 Palantir Foundry 规范：

- **ObjectTypeV2** - 参考 `docs/packages/core/src/types/object-type.ts`
- **LinkTypeV2** - 参考 `docs/packages/core/src/types/link-type.ts`
- **ValueType** - 参考 `docs/packages/core/src/types/value-type.ts`
- **ActionTypeV2** - 参考 `docs/packages/core/src/types/action-type.ts`
- **FunctionV2** - 参考 `docs/packages/core/src/types/function.ts`
- **InterfaceType** - 参考 `docs/packages/core/src/types/interface.ts`

## 下一步

1. **创建 Repository 层** - 实现数据访问
2. **创建 Service 层** - 实现业务逻辑
3. **创建 Route 层** - 实现 API 路由
4. **创建 Seed 数据** - 初始化示例数据
5. **前端集成** - 对接前端组件

## 文档

更多设计细节请参考：

- [Palantir Ontology 官方文档](https://www.palantir.com/docs/foundry/ontology/overview/)
- [AIGC Ontology 设计文档](../docs/aigc-ontology-design.md)
