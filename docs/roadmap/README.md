# AI API Compass - Roadmap 路线图

> 本项目将 Palantir Ontology 三层架构（对象层/动态层/动力层）应用于 AI 工具对比平台，构建一个可持续进化的 AI 工具知识图谱。
>
> **专注 PC 端**，充分利用大屏幕空间，提供丰富的信息展示和交互体验。

---

## 📐 项目愿景

构建一个以 **Palantir Ontology 架构** 为核心的 AI 工具对比平台：
- **对象层 (Static Layer)**：AI 工具的结构化元数据 → 构成知识图谱的静态骨架
- **动态层 (Dynamic Layer)**：用户行为数据实时注入 → 让图谱"活"起来
- **动力层 (Motivation Layer)**：社区驱动的排名与推荐 → 让图谱自我进化

---

## 🏗️ 三层架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    动力层 Motivation Layer                    │
│        社区行为 → 排名权重 → 推荐算法 → 生态飞轮              │
├─────────────────────────────────────────────────────────────┤
│                    动态层 Dynamic Layer                       │
│        用户交互 → 行为事件 → 实时数据 → 热度统计              │
├─────────────────────────────────────────────────────────────┤
│                    对象层 Static Layer                        │
│        ObjectType → Object → LinkType → Link                 │
│        Property → ValueType → Function → Action             │
│        295 工具 | 10 分类 | 303 链接关系                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 实施阶段总览

| 阶段 | 名称 | 状态 | 核心目标 |
|------|------|------|----------|
| **Phase 0** | 数据基础设施 | ✅ 已完成 | 搭建 Ontology 框架，完成基础数据迁移 |
| **Phase 1** | 数据丰富化 | ✅ 已完成 | 扩充 capabilities、pricing、benchmark 数据 |
| **Phase 2** | 排名数据接入 | ✅ 已完成 | 接入 LMSYS、Artificial Analysis 等第三方排名 |
| **Phase 3** | 动态层构建 | ✅ 已完成 | 用户行为追踪系统 + 实时热度统计 |
| **Phase 4** | 动力层构建 | ✅ 已完成 | 社区驱动排名算法 + 推荐系统 |
| **Phase 5** | 前端集成 | 🔄 进行中 | 完善前端页面，对接后端 API |
| **Phase 6** | 生态飞轮 | ⏳ 待开始 | 数据飞轮、工具提交系统、API 开放 |

---

## 🖥️ PC 端页面结构

### 已实现页面

| 页面 | 路由 | 功能 | 状态 |
|------|------|------|------|
| **首页** | `/` | AI 搜索、热门工具、智能推荐 | ✅ |
| **工具库** | `/models` | 工具列表、筛选、排序、对比选择 | ✅ |
| **工具详情** | `/models/[slug]` | 工具信息、关联展示 | ✅ |
| **对比页** | `/compare` | 多工具对比分析 | ✅ |
| **Ontology 学习** | `/ontology-learn` | 三层架构教育 + 实际数据 | ✅ |
| **Ontology 导航** | `/ontologies` | 整合所有 Ontology 相关页面入口 | ✅ |
| **Ontology 管理** | `/ontology-manager` | 管理 Ontology 对象类型、链接类型 | ✅ |
| **ObjectType 详情** | `/ontologies/[rid]/objectTypes/[apiName]` | 对象类型详情页 | ✅ |
| **Function 详情** | `/ontologies/[rid]/functions/[apiName]` | 函数详情页 | ✅ |
| **Interface 详情** | `/ontologies/[rid]/interfaces/[apiName]` | 接口详情页 | ✅ |
| **LinkType 详情** | `/ontologies/[rid]/linkTypes/[apiName]` | 链接类型详情页 | ✅ |
| **ValueType 详情** | `/ontologies/[rid]/valueTypes/[apiName]` | 值类型详情页 | ✅ |
| **ActionType 详情** | `/ontologies/[rid]/actionTypes/[apiName]` | 动作类型详情页 | ✅ |

### 待实现页面

| 页面 | 路由 | 功能 | 优先级 |
|------|------|------|--------|
| **排名页** | `/rankings` | 综合榜、性价比榜、质量榜、热度榜 | P1 |
| **收藏页** | `/favorites` | 用户收藏管理 | P1 |
| **分类浏览** | `/categories/[slug]` | 按分类浏览工具 | P2 |
| **历史记录** | `/history` | 浏览历史 | P2 |
| **工具提交** | `/submit` | 提交新工具 | P3 |

---

## 📊 后端 API 概览

### Phase 1 - 数据丰富化 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/aigc/tools` | GET | 获取工具列表 |
| `/api/aigc/tools/:id` | GET | 获取工具详情 |
| `/api/aigc/categories` | GET | 获取分类列表 |
| `/api/aigc/providers` | GET | 获取开发商列表 |
| `/api/aigc/search` | GET | 搜索工具 |

### Phase 2 - 排名数据 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/rankings/composite` | GET | 综合排名 |
| `/api/rankings/price-performance` | GET | 性价比排名 |
| `/api/rankings/quality` | GET | 质量排名 |
| `/api/rankings/popularity` | GET | 人气排名 |
| `/api/rankings/trending` | GET | 趋势排名 |

### Phase 3 - 动态层 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/events/track` | POST | 上报用户行为 |
| `/api/heat/top` | GET | 获取热度排行榜 |
| `/api/heat/tool/:id` | GET | 获取工具热度 |

### Phase 4 - 动力层 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/ratings/stats` | GET | 获取评分统计 |
| `/api/ratings/submit` | POST | 提交评分 |
| `/api/recommendations/home` | GET | 首页推荐 |
| `/api/recommendations/similar/:id` | GET | 相似工具推荐 |

---

## 🎨 PC 端布局设计

### 桌面端布局（≥1200px）

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
│ [Logo]  [工具库] [排名] [对比] [收藏] [Ontology]     [Theme] [👤]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌─────────────────────────────────────────┐ │
│  │               │  │                                         │ │
│  │   左侧边栏     │  │              主内容区                   │ │
│  │   (280px)     │  │         (max-width: 1200px)             │ │
│  │               │  │                                         │ │
│  │   • 收藏夹     │  │   • 工具列表/详情                       │ │
│  │   • 分类筛选   │  │   • 对比视图                            │ │
│  │   • 快捷操作   │  │   • 排名视图                            │ │
│  │               │  │   • Ontology 学习                       │ │
│  │               │  │                                         │ │
│  └───────────────┘  └─────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  CompareBar (浮动底部栏)                                    │ │
│  │  [已选 3 个工具] [开始对比 →]                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Footer: [关于我们] [联系方式] [隐私政策] [数据来源] © 2026       │
└─────────────────────────────────────────────────────────────────┘
```

### 关键设计决策

| 决策 | 原因 |
|------|------|
| **左侧边栏固定** | PC 端有足够空间，常用功能触手可及 |
| **三栏布局** | 充分利用大屏，信息密度高 |
| **浮动对比栏** | 不占用主内容空间，随时可操作 |
| **卡片式信息展示** | 便于快速扫描和对比 |
| **悬停详情** | 鼠标交互优先，减少点击 |

---

## 🔥 Phase 0 — 数据基础设施（已完成 ✅）

### 现状
- ✅ 使用纯 Ontology Schema (`schema.prisma`)
- ✅ 从 aigc.cn 爬取 295 个工具，10 个分类
- ✅ 303 条工具-分类关联数据
- ✅ 前端适配新数据格式，所有页面正常渲染

### 关键决策
- 删除 `schema-enhanced.prisma`，统一使用 Ontology 标准格式
- 使用 `objectTypeId` + `rid` 复合主键作为对象唯一标识
- slugify 生成 URL 友好标识符

---

## 🚀 Phase 1-4 — 后端实现（已完成 ✅）

### 现状

| 阶段 | 完成度 | 说明 |
|------|--------|------|
| Phase 1 数据丰富化 | ✅ 100% | pricing、context window、capabilities 数据 |
| Phase 2 排名数据 | ✅ 100% | LMSYS、Artificial Analysis、OpenRouter 排名 |
| Phase 3 动态层 | ✅ 100% | 热度计算、行为追踪、事件上报 |
| Phase 4 动力层 | ✅ 100% | 评分系统、排名算法、推荐引擎 |

### 后端目录结构

```
backend/
├── src/
│   ├── services/           # 业务逻辑服务
│   │   ├── heat-calculator.ts    # 热度计算
│   │   ├── ranking-calculator.ts # 排名计算
│   │   ├── rating-service.ts     # 评分服务
│   │   └── rec-engine.ts         # 推荐引擎
│   ├── routes/             # API 路由
│   │   ├── aigc.routes.ts        # 工具相关 API
│   │   ├── rankings.routes.ts    # 排名 API
│   │   ├── events.routes.ts      # 行为事件 API
│   │   ├── ratings.routes.ts     # 评分 API
│   │   └── recommendations.routes.ts # 推荐 API
│   ├── lib/                # 工具库
│   │   ├── analytics/           # 分析工具
│   │   └── utils.ts
│   └── repositories/       # 数据访问层
│       └── aigc.repository.ts
└── data/                   # 静态数据文件
    ├── pricing_data.json
    ├── context_window_data.json
    └── capabilities_data.json
```

---

## ⚡ Phase 5 — 前端集成（进行中 🔄）

### 目标
将 Phase 1-4 实现的后端 API 与前端页面集成，实现完整的数据流和交互。

### 前端目录结构（目标）

```
frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页
│   ├── models/
│   │   ├── page.tsx        # 工具库
│   │   └── [slug]/
│   │       └── page.tsx    # 工具详情
│   ├── compare/
│   │   └── page.tsx        # 对比页
│   ├── rankings/
│   │   └── page.tsx        # 🔴 待实现：排名页
│   ├── favorites/
│   │   └── page.tsx        # 🔴 待实现：收藏页
│   ├── categories/
│   │   └── [slug]/
│   │       └── page.tsx    # 🔴 待实现：分类页
│   ├── history/
│   │   └── page.tsx        # 🔴 待实现：历史记录
│   ├── ontology-learn/
│   │   └── page.tsx        # ✅ Ontology 学习
│   ├── ontologies/
│   │   ├── page.tsx        # ✅ 导航中心
│   │   ├── index/
│   │   └── [rid]/          # ✅ Ontology 详情
│   └── ontology-manager/
│       └── page.tsx        # ✅ 管理器
│
├── src/
│   ├── components/         # 组件（统一到 src/）
│   │   ├── layout/         # 布局组件
│   │   ├── ui/             # 基础 UI
│   │   ├── dynamic/        # 动态层组件
│   │   ├── rating/         # 评分组件
│   │   ├── ranking/        # 排名组件
│   │   ├── recommendation/ # 推荐组件
│   │   └── ontologies/     # ✅ 保留
│   ├── hooks/              # React Hooks
│   │   ├── useTools.ts           # 🔴 待实现
│   │   ├── useHeatScore.ts       # 🔴 待实现
│   │   ├── useRankings.ts        # 🔴 待实现
│   │   ├── useRatings.ts         # 🔴 待实现
│   │   └── useRecommendations.ts # 🔴 待实现
│   ├── stores/             # Zustand Stores
│   │   ├── app.store.ts    # 🔴 待实现
│   │   └── compare.store.ts # 🔴 待实现
│   └── lib/
│       ├── api.ts          # 统一 API 层
│       └── ontology-api.ts # Ontology API
│
├── components/             # 保留部分
│   └── ontologies/         # ✅ 保留：Ontology 相关组件
│
└── lib/                    # 迁移到 src/lib/
    └── ontology-api.ts     # 🔴 待迁移
```

### 实施优先级

| 优先级 | 任务 | 说明 |
|--------|------|------|
| **P0** | 修复编译阻断 | AppLayout + ThemeProvider 已完成 ✅ |
| **P0** | 目录结构统一 | 迁移 lib/ → src/lib/ |
| **P0** | ToolCard 组件 | 工具卡片（已引用，缺失） |
| **P1** | SWR 数据获取 | 启用 SWR Hooks |
| **P1** | 排名页 | 对接 rankings API |
| **P1** | 收藏页 | 对接 favorites API |
| **P2** | 分类浏览页 | 按分类筛选 |
| **P2** | 历史记录页 | 浏览历史 |
| **P3** | 工具提交页 | 用户贡献 |

---

## 🔄 Phase 6 — 生态飞轮（待开始 ⏳）

### 飞轮机制

```
用户访问 → 获得价值（对比工具/看排名）→ 贡献数据（评分/提交工具）
    ↑                                              ↓
← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
        系统数据更丰富 → 用户获得更多价值
```

### 功能规划

| 功能 | 说明 |
|------|------|
| **工具提交** | 用户可提交新工具（审核后上线） |
| **数据纠错** | 用户可纠正工具信息错误 |
| **使用场景分享** | 用户分享使用心得 |
| **专家评测** | 专家级用户的深度评测 |

---

## 📊 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + CSS Variables
- **状态**: Zustand
- **数据获取**: SWR
- **图标**: Lucide React

### 后端
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma
- **缓存**: Redis
- **调度**: node-cron

---

## 🛠️ 技术债务与风险

### 当前技术债务
- [ ] 前端组件大量使用 `(tool as any)` 类型断言，需要逐步完善 ToolView 接口
- [ ] 搜索功能依赖模糊匹配，缺少全文搜索索引
- [ ] 目录结构需要统一（lib/ 和 src/lib/ 并存）

### 风险项
- ⚠️ aigc.cn 数据源变更或反爬限制 → 需准备备用数据源
- ⚠️ 第三方排名数据 API 变更 → 需监控 + 降级方案
- ⚠️ 用户隐私合规（行为数据收集）→ 需明确隐私政策

---

## 📁 文档结构

```
docs/
├── roadmap/
│   ├── README.md           ← 本文件，总览所有内容
│   ├── static-layer.md     ← 对象层设计（现有数据模型）
│   ├── dynamic-layer.md    ← 动态层设计（用户行为追踪）
│   ├── motivation-layer.md ← 动力层设计（排名与推荐）
│   └── data-collection.md  ← 数据采集规划（分阶段）
│
└── plan/
    └── ui-design-review-and-optimization.md  ← UI 设计与架构优化方案
```

---

## 🔗 相关链接

- 项目地址：[GitHub Repository]
- 在线演示：[Demo URL]
- 文档：[Docs URL]

---

*Last updated: 2026-05-09*
*Maintainer: AI API Compass Team*
*专注 PC 端 · 大屏体验优先*