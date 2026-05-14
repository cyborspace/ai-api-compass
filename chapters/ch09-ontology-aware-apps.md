# 第 9 章：感知应用开生面，前后贯通成大器

> **核心问题**：如何基于 Ontology 构建用户真正能用的应用？
>
> **本章简介**：本章将 Ontology 的技术实现转化为用户可感的应用。从 Ontology 感知应用与传统应用的根本区别，到 Object Views、Workshop、Slate 等应用类型的选择，再到前端技术栈的深度解析——读者将掌握构建 Ontology 驱动应用的完整方法论。通过 AI-API-COMPASS 前端实战，将前后端知识贯通。

---

## 9.1 Ontology 感知应用 vs 传统应用

### 9.1.1 传统应用：API → 数据库 → UI

在传统的应用开发模式中，数据流遵循一条清晰的线性路径：

```
用户操作 → API 请求 → 数据库查询 → 业务逻辑 → 返回数据 → UI 渲染
```

这种模式的典型特征是：

- **数据与语义分离**：数据库表结构是技术性的，业务语义散落在各层代码中
- **API 是唯一的桥梁**：前后端通过 REST/GraphQL 交互，API 契约成为耦合点
- **状态管理复杂**：前端需要维护独立的缓存层，与后端数据可能不一致
- **变更成本高**：数据库 Schema 变更会波及 API、前端、文档等多个层面

以传统电商应用为例：

```typescript
// 传统模式：API 返回原始数据，前端自行组装语义
interface ProductDTO {
  id: number;
  name: string;
  price: number;
  category_id: number;  // 外键，需要二次查询
  stock: number;
}

// 前端需要自行理解 category_id 的含义
const product = await fetchProduct(123);
const category = await fetchCategory(product.category_id); // 额外的请求
```

### 9.1.2 Ontology 感知应用：Ontology → Actions → UI

Palantir 的 Ontology 感知应用（Ontology-aware Applications）彻底改变了这一范式。在这种模式下，应用不再是"调用 API 获取数据"，而是"在 Ontology 上执行 Actions"。

```
用户操作 → Action 执行 → Ontology 验证 → 数据变更 → 实时同步 → UI 更新
```

核心特征：

- **语义即数据**：Object Type 自带业务语义，无需在前端重复定义
- **Actions 驱动一切**：用户操作直接映射为 Ontology Actions，而非 API 调用
- **实时一致性**：数据变更通过 WebSocket/SSE 实时推送到前端
- **类型安全**：从 Ontology Schema 到 TypeScript 类型的端到端类型安全

```typescript
// Ontology 感知模式：直接操作语义实体
interface AIGCTool {
  rid: string;           // Ontology 资源标识
  name: string;
  pricingType: string;   // Value Type，自带语义约束
  categories: ToolCategory[];  // Link Type，自动解析关系
  averageRating: number; // Function 计算结果
}

// 前端直接操作 Ontology 实体，无需关心底层 API
const tool = await ontology.getObject('AIGCTool', 'gpt-4');
```

### 9.1.3 两种开发范式的根本区别

| 维度 | 传统应用 | Ontology 感知应用 |
|------|---------|------------------|
| **数据模型** | 数据库表 + ORM | Object Type + Property |
| **关系表达** | 外键 + JOIN | Link Type + 自动解析 |
| **用户操作** | API 调用 | Action 执行 |
| **业务规则** | 散落在各层代码 | 集中在 Submission Criteria |
| **状态同步** | 手动刷新/轮询 | 实时推送（WebSocket/SSE） |
| **类型安全** | 前后端各自维护 | Ontology Schema 生成类型 |
| **变更影响** | 多层面修改 | 修改 Ontology 定义即可 |
| **数据血缘** | 难以追踪 | 内置血缘追踪 |

### 9.1.4 为什么 Ontology 感知应用更易维护和扩展

**维护性优势**：

1. **单一事实来源**：Ontology 是唯一的 Schema 定义，消除前后端不一致
2. **变更传播自动化**：修改 Object Type 后，API、类型定义、文档自动更新
3. **业务逻辑集中**：Submission Criteria 和 Action Rules 集中管理业务规则

**扩展性优势**：

1. **新数据源即插即用**：新增 Connector 后，Ontology 自动扩展
2. **跨应用复用**：同一 Ontology 可驱动多个应用（Object View、Workshop、Slate）
3. **AI 原生集成**：AIP Logic 可直接操作 Ontology，无需额外适配层

---

## 9.2 应用类型与选择

Palantir 平台提供了多种应用构建方式，FDE 需要根据场景选择最合适的类型。

### 9.2.1 Object Views：对象的中心枢纽

Object View 是 Palantir 平台上最基础的应用类型，它为每个 Object Type 自动生成一个"中心页面"。

**核心特性**：
- 自动展示对象的所有 Properties
- 集成相关的 Link Types（关联对象）
- 嵌入可用的 Actions
- 显示 Function 计算结果
- 支持自定义布局和组件

**适用场景**：
- 单个对象的详情展示
- 对象的编辑和管理
- 作为其他应用的"锚点"

在 AI-API-COMPASS 中，工具详情页（`/tool/[slug]`）就是一个典型的 Object View 实现：

```tsx
// app/tool/[slug]/page.tsx
export default function ToolDetailPage() {
  const { data: tool, loading, error } = useToolDetail(slug);
  const { ratings, total } = useToolRatings(slug, { limit: 5 });
  const { stats: ratingStats } = useToolRatingStats(slug);

  // Object View 的核心：展示对象属性、关系、Actions
  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* 对象标识区 */}
      <div className="flex items-start gap-6 mb-8">
        <ToolLogo tool={tool} />
        <div className="flex-1">
          <h1>{tool.name}</h1>
          <p>{tool.tagline}</p>
          <PropertyBadges tool={tool} /> {/* 属性标签 */}
        </div>
        <ActionButtons tool={tool} /> {/* 可用 Actions */}
      </div>

      {/* 属性网格 */}
      <PropertyGrid tool={tool} />

      {/* 关联对象：评价 */}
      <LinkedObjects 
        title="评价" 
        objects={ratings} 
        total={total}
      />

      {/* Function 结果：评分统计 */}
      <FunctionResults stats={ratingStats} />
    </div>
  );
}
```

### 9.2.2 Object Explorer：搜索与分析工具

Object Explorer 提供了跨 Object Type 的搜索和分析能力。

**核心特性**：
- 全文搜索跨所有 Object Types
- 高级过滤和排序
- 聚合分析（计数、分组、统计）
- 保存和分享查询

**适用场景**：
- 数据探索和分析
- 跨对象类型的关联查询
- 临时性的数据调查

AI-API-COMPASS 的首页（`/`）实现了 Object Explorer 的核心功能：

```tsx
// app/HomeContent.tsx
export default function HomeContent() {
  const filter = useAppStore((s) => s.filter);
  
  const { data: toolsData, loading } = useToolsList({
    limit: 50,
    search: filter.searchQuery || undefined,
    categories: filter.selectedCategories.length > 0 ? filter.selectedCategories : undefined,
    pricingTypes: filter.pricingTypes.length > 0 ? filter.pricingTypes : undefined,
    capabilities: filter.capabilities.length > 0 ? filter.capabilities : undefined,
    availableInChina: filter.availableInChina,
    sortBy: filter.sortBy !== 'relevance' ? filter.sortBy : undefined,
  });

  return (
    <div className="flex gap-8">
      {/* 过滤面板 */}
      <FilterPanel />
      
      {/* 搜索结果 */}
      <div className="flex-1">
        <ViewToolbar 
          layout={layout} 
          onLayoutChange={setLayout}
          count={filteredTools.length}
        />
        
        {/* 多视图切换：Grid / List / Table */}
        {layout === 'grid' && <GridView tools={filteredTools} />}
        {layout === 'list' && <ListView tools={filteredTools} />}
        {layout === 'table' && <TableView tools={filteredTools} />}
      </div>
    </div>
  );
}
```

### 9.2.3 Workshop：低代码应用构建

Workshop 是 Palantir 的低代码应用构建器，允许业务用户通过拖拽方式构建应用。

**核心特性**：
- 拖拽式界面设计
- 预置组件库（表格、图表、表单、地图）
- 与 Ontology 的深度集成
- 条件逻辑和交互配置
- 无需编写代码即可发布应用

**适用场景**：
- 业务用户自助构建应用
- 快速原型验证
- 数据仪表盘和报表
- 简单的工作流应用

**FDE 在 Workshop 中的角色**：
- 设计和优化 Ontology Schema
- 创建 Workshop 模板
- 配置复杂逻辑和 Actions
- 性能优化和最佳实践指导

### 9.2.4 Slate：全代码应用构建

Slate 是 Palantir 的全代码应用构建框架，基于 React 和 TypeScript。

**核心特性**：
- 完整的 React 开发环境
- TypeScript 类型安全
- 与 Ontology 的 SDK 集成
- 自定义组件和样式
- 版本控制和 CI/CD

**适用场景**：
- 复杂的交互式应用
- 自定义可视化需求
- 需要精细控制 UI/UX 的场景
- 与外部系统的深度集成

AI-API-COMPASS 的前端本质上就是一个 Slate 风格的 Ontology 感知应用。

### 9.2.5 Quiver：高级分析与仪表盘

Quiver 是 Palantir 的高级分析工具，专注于数据可视化和探索性分析。

**核心特性**：
- 丰富的图表类型
- 交互式数据探索
- 与 Ontology 的实时连接
- 协作和分享

**适用场景**：
- 数据分析仪表盘
- 探索性数据分析（EDA）
- 报告和演示

### 9.2.6 Map：地理空间应用

Map 是 Palantir 的地理空间可视化工具。

**核心特性**：
- 地理数据可视化
- 空间分析
- 与 Ontology 的地理属性集成

**适用场景**：
- 物流和供应链可视化
- 房地产分析
- 应急响应和指挥

### 应用类型选择决策树

```
需要自定义 UI/UX？
├── 是 → 需要复杂交互？
│   ├── 是 → Slate（全代码）
│   └── 否 → Object View（自定义布局）
└── 否 → 业务用户自助构建？
    ├── 是 → Workshop（低代码）
    └── 否 → 纯数据分析？
        ├── 是 → Quiver（分析仪表盘）
        └── 否 → Object Explorer（搜索探索）
```

---

## 9.3 前端技术栈

### 9.3.1 TypeScript：类型安全的基础

TypeScript 是 Ontology 感知应用的首选语言，因为它提供了：

1. **端到端类型安全**：从 Ontology Schema 生成 TypeScript 类型
2. **IDE 智能提示**：属性名、类型、关系自动补全
3. **编译时错误检测**：避免运行时类型错误
4. **代码重构安全**：重命名属性时自动更新所有引用

AI-API-COMPASS 的类型定义严格对应后端 Ontology：

```typescript
// src/types/api.ts
export interface AIGCTool {
  rid: string;                    // Ontology 资源标识
  slug: string;                   // URL 友好标识
  name: string;
  tagline?: string;
  description?: string;
  developer: string;
  pricingType: string;            // Value Type 约束
  averageRating: number;          // Function 计算结果
  viewCount: number;
  favoriteCount: number;
  compareCount: number;
  reviewCount: number;
  heatScore?: number;             // Function 计算结果
  categories: ToolCategory[];     // Link Type 解析
  capabilities: string[];         // 多值属性
  modalities?: string[];
  platforms?: string[];
  availableInChina?: boolean;
  technicalSpec?: TechnicalSpec;  // 嵌套对象
  pricingPlans?: PricingPlan[];
}

export interface ToolCategory {
  rid: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  toolCount?: number;             // Function 计算结果
}
```

**类型生成最佳实践**：

```typescript
// 从 Ontology Schema 自动生成类型（概念示例）
// 实际项目中可通过 Palantir SDK 的 generate-types 命令实现

// 1. 定义 Ontology Schema
const ontologySchema = {
  objectTypes: {
    AIGCTool: {
      properties: {
        name: { type: 'string', required: true },
        pricingType: { type: 'string', valueType: 'PricingType' },
        averageRating: { type: 'number', function: 'calculateAverageRating' },
      },
      links: {
        categories: { target: 'ToolCategory', cardinality: 'many' },
      },
    },
  },
};

// 2. 生成 TypeScript 类型
generateTypes(ontologySchema, {
  output: './src/types/generated.ts',
  strict: true,
});
```

### 9.3.2 React：组件化 UI 开发

React 是 Palantir 平台的前端框架选择，其组件化思想与 Ontology 的 Object Type 概念高度契合。

**组件与 Ontology 的映射关系**：

| Ontology 概念 | React 组件 |
|--------------|-----------|
| Object Type | 页面/详情组件 |
| Property | 属性展示组件 |
| Link Type | 关联组件/嵌套组件 |
| Action Type | 操作按钮/表单组件 |
| Function | 计算结果展示组件 |

AI-API-COMPASS 的组件设计遵循 Ontology 驱动原则：

```tsx
// src/components/ToolCard.tsx - Object 卡片组件
interface ToolCardProps {
  tool: AIGCTool;           // 直接接收 Ontology 对象
  variant?: 'default' | 'compact' | 'ranking';
}

export function ToolCard({ tool, variant = 'default' }: ToolCardProps) {
  const pricing = getPricingLabel(tool.pricingType);
  const heat = tool.heatScore ? getHeatLevel(tool.heatScore) : null;

  return (
    <div className="rounded-xl bg-[#1c1c1e] border border-[#2c2c2e] p-4">
      {/* 对象标识 */}
      <div className="flex items-start gap-3">
        <ToolLogo src={tool.logoUrl} name={tool.name} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#f5f5f7]">{tool.name}</h3>
          <p className="text-xs text-[#636366] truncate">{tool.tagline}</p>
        </div>
      </div>

      {/* 属性标签 */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        <PropertyBadge 
          label={pricing.label} 
          color={pricing.color} 
        />
        {tool.availableInChina && (
          <PropertyBadge label="国内可用" color="#30d158" />
        )}
        {heat && (
          <PropertyBadge label={heat.label} color={heat.color} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2c2c2e]">
        <ActionButton 
          action="addToCompare" 
          objectRid={tool.rid}
          icon={<BarChart3 className="w-3.5 h-3.5" />}
        >
          对比
        </ActionButton>
        <ActionButton 
          action="addToFavorite" 
          objectRid={tool.rid}
          icon={<Star className="w-3.5 h-3.5" />}
        >
          收藏
        </ActionButton>
      </div>
    </div>
  );
}
```

### 9.3.3 状态管理：Zustand 的简洁哲学

AI-API-COMPASS 选择 Zustand 作为状态管理库，原因如下：

1. **简洁**：无需 Provider 包裹，API 极简
2. **TypeScript 友好**：类型推导完善
3. **持久化**：内置 persist 中间件
4. **不可变更新**：与 React 的不可变数据流一致

```typescript
// src/stores/app.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // 对比状态（对应 Link Type：compare）
  compare: {
    selectedTools: AIGCTool[];
    maxTools: number;
  };
  addToCompare: (tool: AIGCTool) => void;
  removeFromCompare: (slug: string) => void;

  // 收藏状态（对应 Link Type：favorite）
  favorite: {
    toolSlugs: string[];
  };
  addToFavorite: (slug: string) => void;
  removeFromFavorite: (slug: string) => void;

  // 过滤状态（对应 Object Explorer 查询参数）
  filter: {
    searchQuery: string;
    selectedCategories: string[];
    pricingTypes: string[];
    capabilities: string[];
    availableInChina: boolean | null;
    sortBy: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'heat';
  };
  setSearchQuery: (query: string) => void;
  toggleCategory: (slug: string) => void;

  // 视图状态
  view: {
    layout: 'grid' | 'list' | 'table';
    sidebarCollapsed: boolean;
  };
  setLayout: (layout: ViewState['layout']) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 对比操作
      compare: { selectedTools: [], maxTools: 4 },
      addToCompare: (tool) =>
        set((state) => {
          if (state.compare.selectedTools.length >= state.compare.maxTools) {
            return state; // 提交条件检查
          }
          return {
            compare: {
              ...state.compare,
              selectedTools: [...state.compare.selectedTools, tool],
            },
          };
        }),

      // 收藏操作
      favorite: { toolSlugs: [] },
      toggleFavorite: (slug) => {
        const state = get();
        if (state.favorite.toolSlugs.includes(slug)) {
          get().removeFromFavorite(slug);
        } else {
          get().addToFavorite(slug);
        }
      },

      // 过滤操作
      filter: DEFAULT_FILTER,
      toggleCategory: (slug) =>
        set((state) => ({
          filter: {
            ...state.filter,
            selectedCategories: state.filter.selectedCategories.includes(slug)
              ? state.filter.selectedCategories.filter((s) => s !== slug)
              : [...state.filter.selectedCategories, slug],
          },
        })),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        compare: state.compare,
        favorite: state.favorite,
        activeRankingType: state.activeRankingType,
      }),
    }
  )
);
```

**Zustand 与 Ontology 的映射**：

| Zustand 概念 | Ontology 概念 |
|-------------|--------------|
| Store State | Object 实例集合 |
| Actions | Action Type 执行 |
| Selectors | Object Set 查询 |
| Persist | 状态持久化/Writeback |

### 9.3.4 数据获取：SWR 的缓存与重新验证策略

AI-API-COMPASS 使用 SWR（Stale-While-Revalidate）进行数据获取，这是 Palantir 推荐的数据获取模式。

**SWR 的核心优势**：

1. **自动缓存**：相同请求自动复用缓存
2. **自动重新验证**：窗口聚焦时自动刷新
3. **乐观更新**：先更新 UI，再请求后端
4. **错误重试**：自动重试失败请求
5. **去重**：同时发出的相同请求只发送一次

```typescript
// src/hooks/useTools.ts
import useSWR from 'swr';

export function useToolsList(params?: {
  limit?: number;
  search?: string;
  categories?: string[];
  // ...
}) {
  const key = `tools?${searchParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<AIGCTool>>(
    key,
    toolsFetcher,
    {
      revalidateOnFocus: false,      // 窗口聚焦时不自动刷新
      dedupingInterval: 5000,        // 5 秒内去重
      refreshInterval: 30000,        // 每 30 秒自动刷新
      errorRetryCount: 3,            // 错误重试 3 次
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,                  // 手动刷新
  };
}
```

**SWR 与 Ontology 的集成模式**：

```typescript
// Ontology 感知的数据获取 Hook
export function useOntologyObject(
  objectType: string,
  objectRid: string
) {
  const { data, error, mutate } = useSWR(
    objectRid ? `${objectType}:${objectRid}` : null,
    () => ontologyApi.getObject(objectType, objectRid),
    {
      // Ontology 数据通常变化不频繁
      revalidateOnFocus: false,
      // 但 Actions 执行后需要刷新
      refreshInterval: 0,
    }
  );

  // 执行 Action 后自动刷新
  const executeAction = async (actionType: string, params: any) => {
    const result = await ontologyApi.executeAction(actionType, params);
    if (result.success) {
      // Action 成功后刷新数据
      await mutate();
    }
    return result;
  };

  return { data, error, executeAction };
}
```

---

## 9.4 AI-API-COMPASS 前端实战

### 9.4.1 首页设计：AI 工具库的展示逻辑

首页是 AI-API-COMPASS 的核心入口，实现了 Object Explorer 的功能。

**设计原则**：
1. **信息密度适中**：网格视图展示关键属性，列表视图展示更多细节
2. **即时反馈**：搜索和过滤实时响应
3. **渐进式披露**：从概览到详情的自然过渡

```tsx
// app/HomeContent.tsx
export default function HomeContent() {
  const filter = useAppStore((s) => s.filter);
  const layout = useAppStore((s) => s.view.layout);

  // 数据获取：对应 Object Set 查询
  const { data: toolsData, loading } = useToolsList({
    limit: 50,
    search: filter.searchQuery || undefined,
    categories: filter.selectedCategories.length > 0 ? filter.selectedCategories : undefined,
    pricingTypes: filter.pricingTypes.length > 0 ? filter.pricingTypes : undefined,
    capabilities: filter.capabilities.length > 0 ? filter.capabilities : undefined,
    availableInChina: filter.availableInChina,
    sortBy: filter.sortBy !== 'relevance' ? filter.sortBy : undefined,
  });

  // 推荐数据：对应 Function 执行
  const { data: recommendations } = useHomeRecommendations({ limit: 6 });

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      {/* 搜索栏 */}
      <SearchBar initialValue={filter.searchQuery} />

      {/* 推荐区：Function 结果展示 */}
      {recommendations?.items && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-4">
            推荐工具
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.items.map((item) => (
              <ToolCard key={item.tool.slug} tool={item.tool} />
            ))}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex gap-8">
        {/* 过滤面板 */}
        <FilterPanel />

        {/* 工具列表 */}
        <div className="flex-1">
          <ViewToolbar layout={layout} count={filteredTools.length} />
          
          {/* 多视图切换 */}
          {layout === 'grid' && <GridView tools={filteredTools} />}
          {layout === 'list' && <ListView tools={filteredTools} />}
          {layout === 'table' && <TableView tools={filteredTools} />}
        </div>
      </div>
    </div>
  );
}
```

### 9.4.2 工具详情页：Object View 的实现

工具详情页是 Object View 的完整实现，展示了 Ontology 感知应用的核心模式。

```tsx
// app/tool/[slug]/page.tsx
export default function ToolDetailPage() {
  const slug = params.slug as string;

  // 对象数据获取
  const { data: tool, loading, error } = useToolDetail(slug);
  
  // 关联对象获取（Link Type）
  const { ratings, total } = useToolRatings(slug, { limit: 5 });
  
  // Function 结果获取
  const { stats: ratingStats } = useToolRatingStats(slug);

  if (loading) return <LoadingState />;
  if (error || !tool) return <ErrorState message={error || "工具不存在"} />;

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      {/* ====== 对象标识区 ====== */}
      <div className="flex items-start gap-6 mb-8">
        <ObjectLogo 
          src={tool.logoUrl} 
          name={tool.name} 
          size="large"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <p className="text-sm text-[#636366]">{tool.tagline}</p>
          
          {/* 属性标签 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <PropertyBadge 
              property="pricingType" 
              value={tool.pricingType} 
            />
            {tool.availableInChina && (
              <PropertyBadge 
                property="availableInChina" 
                value={true} 
              />
            )}
            <HeatBadge score={tool.heatScore} />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <ActionButton 
            action="visitWebsite"
            params={{ url: tool.websiteUrl }}
            variant="primary"
          >
            访问官网
          </ActionButton>
          <ActionButton 
            action="viewApiDocs"
            params={{ url: tool.apiDocsUrl }}
            variant="secondary"
          >
            API 文档
          </ActionButton>
        </div>
      </div>

      {/* ====== 属性网格 ====== */}
      <PropertyGrid>
        <PropertyCard 
          label="输入价格" 
          value={formatPrice(tool.inputPrice)}
        />
        <PropertyCard 
          label="输出价格" 
          value={formatPrice(tool.outputPrice)}
        />
        <PropertyCard 
          label="上下文窗口" 
          value={formatNumber(tool.contextWindow)}
        />
        <PropertyCard 
          label="最大输出" 
          value={formatNumber(tool.maxOutputTokens)}
        />
      </PropertyGrid>

      {/* ====== 关联对象：评价 ====== */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-[#636366] uppercase tracking-wider mb-3">
          评价 ({total})
        </h2>
        <LinkedObjectList 
          objects={ratings}
          renderItem={(rating) => (
            <RatingCard rating={rating} />
          )}
        />
      </div>

      {/* ====== Function 结果：评分统计 ====== */}
      {ratingStats && (
        <div className="mt-8">
          <FunctionResultCard 
            functionName="calculateAverageRating"
            result={ratingStats}
            visualization="barChart"
          />
        </div>
      )}
    </div>
  );
}
```

### 9.4.3 对比页：多对象关联展示

对比页展示了如何处理多个 Object 的关联展示，这是 Ontology 感知应用的典型场景。

```tsx
// app/compare/page.tsx
export default function ComparePage() {
  // 从全局状态获取对比列表（对应 Link Type：compare）
  const selectedTools = useAppStore((s) => s.compare.selectedTools);
  const removeFromCompare = useAppStore((s) => s.removeFromCompare);

  if (selectedTools.length === 0) {
    return <EmptyState message="请在工具库中选择要对比的工具" />;
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">对比</h1>
          <p className="text-sm text-[#636366]">
            并排对比 {selectedTools.length} 个 AI 工具
          </p>
        </div>
        <ActionButton action="clearCompare">清除全部</ActionButton>
      </div>

      {/* 对比表格 */}
      <div className="rounded-xl border border-[#2c2c2e] overflow-hidden overflow-x-auto">
        <CompareTable tools={selectedTools}>
          {/* 属性行 */}
          <CompareRow
            label="价格模型"
            property="pricingType"
            render={(tool) => getPricingLabel(tool.pricingType).label}
          />
          <CompareRow
            label="输入价格"
            property="inputPrice"
            render={(tool) => formatPrice(tool.inputPrice)}
            highlight
          />
          <CompareRow
            label="上下文窗口"
            property="contextWindow"
            render={(tool) => formatNumber(tool.contextWindow)}
            highlight
          />
          
          {/* 能力对比 */}
          <CompareRow
            label="能力"
            property="capabilities"
            render={(tool) => (
              <div className="flex flex-wrap gap-1">
                {tool.capabilities?.map((cap) => (
                  <CapabilityBadge key={cap} capability={cap} />
                ))}
              </div>
            )}
          />

          {/* Function 结果对比 */}
          <CompareRow
            label="评分"
            property="averageRating"
            render={(tool) => (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#ff9f0a] fill-current" />
                <span>{tool.averageRating?.toFixed(1)}</span>
              </div>
            )}
            highlight
          />
        </CompareTable>
      </div>
    </div>
  );
}
```

### 9.4.4 排名页：Function 结果的可视化

排名页展示了 Function 执行结果的可视化，这是 Ontology 感知应用的独特能力。

```tsx
// app/rankings/page.tsx
export default function RankingsPage() {
  const [rankingType, setRankingType] = useState<RankingType>('composite');
  const [perspective, setPerspective] = useState<PerspectiveType>('default');

  // Function 执行：获取排名结果
  const { data: rankingData, loading } = useRankings(rankingType, {
    perspective,
    limit: 50,
  });

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">排行榜</h1>
        <p className="text-sm text-[#636366]">
          基于 {rankingType} 算法的实时排名
        </p>
      </div>

      {/* 排名类型选择 */}
      <div className="flex gap-2 mb-6">
        {RANKING_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setRankingType(type.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm",
              rankingType === type.value
                ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                : "text-[#8e8e93] hover:text-[#f5f5f7]"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 排名列表 */}
      <div className="space-y-2">
        {rankingData?.entries.map((entry, index) => (
          <RankingCard
            key={entry.rid}
            rank={entry.rank}
            tool={entry}
            previousRank={entry.previousRank}
            rankChange={entry.rankChange}
            trend={entry.trend}
            breakdown={entry.breakdown}  // Function 计算细节
          />
        ))}
      </div>
    </div>
  );
}
```

### 9.4.5 Ontology 管理页：元数据的管理界面

Ontology 管理页是 FDE 的核心工作界面，展示了 Ontology 的完整结构。

```tsx
// app/ontology-manager/page.tsx
export default function OntologyManagerPage() {
  const [selectedOntology, setSelectedOntology] = useState<Ontology | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  if (!selectedOntology) {
    return <OntologyList onSelect={setSelectedOntology} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 主内容区 */}
      <MainContent ontology={selectedOntology} activeTab={activeTab} />
      
      {/* 右侧导航 */}
      <RightSidebar
        ontology={selectedOntology}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

// 右侧导航：展示 Ontology 的所有组件
function RightSidebar({ ontology, activeTab, onTabChange }) {
  const NAV_ITEMS = [
    { key: "overview", label: "概览", icon: Eye, count: ontology.objectTypesCount },
    { key: "objectTypes", label: "Object Types", icon: Box, count: ontology.objectTypesCount },
    { key: "linkTypes", label: "Link Types", icon: Link2, count: ontology.linkTypesCount },
    { key: "valueTypes", label: "Value Types", icon: Hash, count: ontology.valueTypesCount },
    { key: "interfaces", label: "Interfaces", icon: Layers, count: ontology.interfacesCount },
    { key: "actionTypes", label: "Action Types", icon: Zap, count: ontology.actionTypesCount },
    { key: "functions", label: "Functions", icon: Code, count: ontology.functionsCount },
  ];

  const EXECUTION_ITEMS = [
    { key: "actionExecution", label: "Action 执行", icon: Play },
    { key: "functionExecution", label: "Function 执行", icon: Code },
    { key: "writeback", label: "Writeback 日志", icon: Activity },
  ];

  return (
    <aside className="w-56 flex-shrink-0 border-l border-[#2c2c2e] bg-[#141416]">
      {/* Schema 导航 */}
      <div className="p-2">
        <div className="text-[10px] font-medium text-[#636366] uppercase tracking-wider px-3 mb-1">
          Schema
        </div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm",
                activeTab === item.key
                  ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                  : "text-[#8e8e93] hover:text-[#f5f5f7]"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2c2c2e]">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 执行导航 */}
      <div className="p-2 border-t border-[#2c2c2e]">
        <div className="text-[10px] font-medium text-[#636366] uppercase tracking-wider px-3 mb-1">
          执行 & Writeback
        </div>
        <nav className="space-y-0.5">
          {EXECUTION_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm",
                activeTab === item.key
                  ? "bg-[#30d158]/10 text-[#30d158]"
                  : "text-[#8e8e93] hover:text-[#f5f5f7]"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
```

---

## 9.5 API 设计原则

### 9.5.1 RESTful API 设计：资源导向

AI-API-COMPASS 的 API 设计遵循 RESTful 原则，同时与 Ontology 概念对齐。

**资源命名规范**：

```
GET    /api/aigc/tools              # Object Set 查询
GET    /api/aigc/tools/:slug        # 单个 Object 获取
GET    /api/aigc/categories         # 关联 Object Type 查询
GET    /api/aigc/tools/:slug/ratings # Link Type 关联查询
POST   /api/aigc/ratings            # Action 执行：提交评价
GET    /api/aigc/rankings/:type     # Function 执行：获取排名
POST   /api/aigc/recommendations/scenario # Function 执行：场景推荐
```

**API 响应格式**：

```typescript
// 统一响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 分页响应格式
interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

// 示例：工具列表响应
{
  "success": true,
  "data": [
    {
      "rid": "ri.aigc.main.object-type.aigc-tool.001",
      "slug": "gpt-4",
      "name": "GPT-4",
      "pricingType": "subscription",
      "averageRating": 4.5,
      "categories": [
        { "rid": "...", "slug": "llm", "name": "大语言模型" }
      ]
    }
  ],
  "total": 295,
  "hasMore": true
}
```

### 9.5.2 GraphQL：灵活的查询语言

虽然 AI-API-COMPASS 目前使用 REST API，但 Palantir 平台原生支持 GraphQL，这是 Ontology 感知应用的推荐查询方式。

**GraphQL 与 Ontology 的天然契合**：

```graphql
# 查询工具及其关联对象
query GetToolWithRelations($slug: String!) {
  aigcTool(slug: $slug) {
    rid
    name
    pricingType
    
    # Link Type：自动解析关联对象
    categories {
      name
      description
    }
    
    # Function 结果：自动计算
    averageRating
    heatScore
    
    # Link Type：评价
    ratings(limit: 5) {
      overallRating
      reviewContent
      createdAt
    }
    
    # Function 结果：评分统计
    ratingStats {
      averageRating
      totalRatings
      distribution
    }
  }
}

# 执行 Action
mutation SubmitRating($input: SubmitRatingInput!) {
  submitRating(input: $input) {
    success
    ratingId
    isFlagged
  }
}
```

**REST vs GraphQL 选择指南**：

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 简单 CRUD | REST | 简单直观，缓存友好 |
| 复杂关联查询 | GraphQL | 一次请求获取所有需要的数据 |
| 移动端应用 | GraphQL | 减少请求次数，节省流量 |
| 实时数据 | GraphQL Subscriptions | 原生支持实时推送 |
| 文件上传 | REST | 更好的二进制支持 |
| 缓存优化 | REST | HTTP 缓存机制成熟 |

### 9.5.3 API 版本管理策略

**URL 版本控制**：

```
/api/v1/aigc/tools      # 版本 1
/api/v2/aigc/tools      # 版本 2
```

**Header 版本控制**：

```
GET /api/aigc/tools
Accept-Version: v2
```

**Ontology 版本与 API 版本的关系**：

- Ontology Schema 变更时，API 版本可能需要升级
- 向后兼容的变更（新增可选字段）不需要版本升级
- 破坏性变更（字段删除、类型改变）需要版本升级

### 9.5.4 API 文档与 Swagger 集成

AI-API-COMPASS 使用 OpenAPI/Swagger 自动生成 API 文档。

```typescript
// 使用 @fastify/swagger 自动生成文档
import fastifySwagger from '@fastify/swagger';

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'AI-API-COMPASS API',
      description: 'Ontology 驱动的 AI 工具对比平台 API',
      version: '1.0.0',
    },
    tags: [
      { name: 'Tools', description: 'AI 工具管理' },
      { name: 'Rankings', description: '排名算法' },
      { name: 'Recommendations', description: '推荐引擎' },
      { name: 'Actions', description: 'Ontology Actions' },
    ],
  },
});

// 路由定义自动生成文档
app.get('/api/aigc/tools', {
  schema: {
    tags: ['Tools'],
    summary: '获取 AI 工具列表',
    querystring: {
      type: 'object',
      properties: {
        search: { type: 'string', description: '搜索关键词' },
        categories: { type: 'string', description: '分类过滤（逗号分隔）' },
        sortBy: { 
          type: 'string', 
          enum: ['relevance', 'rating', 'price_asc', 'price_desc', 'heat'],
          description: '排序方式'
        },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'array', items: { $ref: 'AIGCTool#' } },
          total: { type: 'number' },
          hasMore: { type: 'boolean' },
        },
      },
    },
  },
}, async (request, reply) => {
  // 处理逻辑
});
```

---

## 🎯 实践环节：为 AI-API-COMPASS 开发一个新的 Ontology 感知页面

### 任务：开发"场景推荐"页面

**目标**：创建一个页面，允许用户描述使用场景，系统返回推荐的 AI 工具。

**步骤**：

1. **创建页面组件**：

```tsx
// app/scenarios/page.tsx
"use client";

import { useState } from "react";
import { useScenarioRecommendations } from "@/hooks";
import { useAppStore } from "@/stores/app.store";

export default function ScenariosPage() {
  const [scenario, setScenario] = useState("");
  const [constraints, setConstraints] = useState({
    maxPrice: undefined as number | undefined,
    modalities: [] as string[],
  });

  // Function 执行：场景推荐
  const { data: recommendations, loading, execute } = useScenarioRecommendations();

  const handleSubmit = async () => {
    await execute({
      scenario,
      constraints,
      limit: 10,
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">场景推荐</h1>
        <p className="text-sm text-[#636366]">
          描述你的使用场景，AI 为你推荐最合适的工具
        </p>
      </div>

      {/* 场景输入 */}
      <div className="mb-6">
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="例如：我需要处理大量 PDF 文档，提取关键信息并生成摘要..."
          className="w-full h-32 p-4 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* 约束条件 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#636366] mb-3">约束条件</h3>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="最高月费（USD）"
            value={constraints.maxPrice || ""}
            onChange={(e) => setConstraints({ ...constraints, maxPrice: Number(e.target.value) })}
            className="px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg text-sm"
          />
          {/* 模态选择 */}
          <select
            multiple
            value={constraints.modalities}
            onChange={(e) => setConstraints({ 
              ...constraints, 
              modalities: Array.from(e.target.selectedOptions, o => o.value)
            })}
            className="px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg text-sm"
          >
            <option value="text">文本</option>
            <option value="image">图像</option>
            <option value="audio">音频</option>
            <option value="video">视频</option>
          </select>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={!scenario || loading}
        className="px-6 py-3 bg-[#ff3b30] text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "分析中..." : "获取推荐"}
      </button>

      {/* 推荐结果 */}
      {recommendations?.items && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            推荐结果（{recommendations.total} 个）
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.items.map((item) => (
              <RecommendationCard
                key={item.tool.slug}
                tool={item.tool}
                score={item.score}
                reasons={item.reasons}
                matchedCapabilities={item.matchedCapabilities}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

2. **创建 Hook**：

```tsx
// src/hooks/useRecommendations.ts
import useSWR from 'swr';
import { fetchScenarioRecommendations } from '@/lib/api';

export function useScenarioRecommendations() {
  const [params, setParams] = useState<{
    scenario: string;
    constraints?: any;
    limit?: number;
  } | null>(null);

  const { data, error, isLoading } = useSWR(
    params ? `recommendations:${params.scenario}` : null,
    () => fetchScenarioRecommendations(params!),
    {
      revalidateOnFocus: false,
    }
  );

  const execute = async (input: {
    scenario: string;
    constraints?: any;
    limit?: number;
  }) => {
    setParams(input);
  };

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    execute,
  };
}
```

3. **添加到导航**：

```tsx
// src/components/Shell.tsx
const NAV_ITEMS = [
  { href: "/", label: "工具库", icon: Database },
  { href: "/rankings", label: "排行榜", icon: Trophy },
  { href: "/compare", label: "对比", icon: BarChart3 },
  { href: "/categories", label: "分类", icon: Hexagon },
  { href: "/favorites", label: "收藏", icon: Star },
  { href: "/scenarios", label: "场景推荐", icon: Sparkles },  // 新增
  { href: "/ontology-manager", label: "Ontology", icon: Box },
];
```

---

## 📚 延伸阅读

### 推荐资源

1. **Palantir 官方文档**：Ontology-aware Applications
2. **React 官方文档**：Thinking in React
3. **SWR 文档**：Data Fetching with SWR
4. **Zustand 文档**：State Management Made Simple

### 关键概念总结

| 概念 | 说明 | 在 AI-API-COMPASS 中的体现 |
|------|------|------------------------|
| Ontology 感知应用 | 直接操作语义实体，而非 API | 所有页面直接操作 AIGCTool 对象 |
| Object View | 单个对象的中心页面 | `/tool/[slug]` 页面 |
| Object Explorer | 跨对象搜索和分析 | 首页搜索和过滤 |
| Actions | 用户操作映射为 Ontology 操作 | 对比、收藏、评分 |
| Functions | 计算结果实时展示 | 排名、热度、推荐 |
| Link Types | 关联对象自动解析 | 工具的分类、评价 |

---

## ✅ 本章自评清单

- [ ] 理解 Ontology 感知应用与传统应用的根本区别
- [ ] 掌握 Palantir 平台的各种应用类型及其适用场景
- [ ] 理解 TypeScript 在 Ontology 感知应用中的重要性
- [ ] 掌握 React 组件与 Ontology 概念的映射关系
- [ ] 理解 Zustand 状态管理与 Ontology 的对应关系
- [ ] 掌握 SWR 数据获取模式及其在 Ontology 应用中的使用
- [ ] 能够分析 AI-API-COMPASS 前端架构的 Ontology 感知设计
- [ ] 理解 RESTful API 与 GraphQL 在 Ontology 应用中的选择
- [ ] 完成实践环节：开发场景推荐页面

---

> **本章小结**：Ontology 感知应用是 Palantir 平台的核心创新，它将数据语义从底层数据库提升到应用层，使应用开发从"操作 API"进化为"操作语义实体"。通过 AI-API-COMPASS 的前端实战，我们看到了这种范式的实际价值：类型安全、实时同步、业务语义内聚。掌握 Ontology 感知应用的开发方法，是 FDE 从"数据工程师"进化为"应用架构师"的关键一步。
