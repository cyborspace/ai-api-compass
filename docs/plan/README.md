# AI API Compass - 执行计划

> 多 Agent 并行执行计划，用于快速搭建并验证完整的 Palantir 三层架构系统。

---

## 📋 计划概述

### 核心调整

| 调整项 | 原计划 | 新计划 |
|--------|--------|--------|
| **Phase 2 优先级** | 第 2-3 月执行 | 放到最后（Phase 4） |
| **Phase 1 数据策略** | 仅手动调研 | 先尝试自动获取，获取失败则使用模拟数据，后续替换 |
| **目标** | 分阶段实现 | 快速验证所有功能的数据都具备，再逐步优化 |

### 新的实施阶段

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: 数据丰富化 (Week 1-3)                                  │
│  ├── 为每个工具补充：定价、上下文、标签、能力                      │
│  ├── 先自动获取 → 失败则模拟数据 → 确保功能完整                    │
│  └── 验收：295 个工具全部有数据                                  │
├─────────────────────────────────────────────────────────────────┤
│  Phase 2: 动态层实现 (Week 4-6)                                  │
│  ├── 用户行为追踪 SDK                                             │
│  ├── 热度计算服务                                                │
│  └── 实时 UI 组件                                                │
│  └── 验收：搜索、点击、对比行为可追踪                             │
├─────────────────────────────────────────────────────────────────┤
│  Phase 3: 动力层实现 (Week 7-10)                                 │
│  ├── 社区评分系统                                                │
│  ├── 排名算法 (综合、性价比、热度等)                              │
│  ├── 推荐系统                                                    │
│  └── 验收：评分、排名、推荐功能完整                               │
├─────────────────────────────────────────────────────────────────┤
│  Phase 4: 第三方排名接入 (Week 11+)                              │
│  ├── LMSYS Chatbot Arena                                         │
│  ├── Artificial Analysis                                        │
│  └── OpenRouter Stats                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 文档结构

```
docs/plan/
├── README.md              ← 本文件，总体计划
├── phase-1-data-enrichment.md    ← Phase 1: 数据丰富化
├── phase-2-dynamic-layer.md      ← Phase 2: 动态层实现
├── phase-3-motivation-layer.md    ← Phase 3: 动力层实现
├── phase-4-third-party.md         ← Phase 4: 第三方排名接入
├── agents/                        ← Agent 任务定义
│   ├── enrich-data-agent.md        ← 数据丰富化 Agent
│   ├── dynamic-layer-agent.md      ← 动态层 Agent
│   └── motivation-layer-agent.md    ← 动力层 Agent
└── verification/                   ← 验收标准
    ├── phase-1-verification.md
    ├── phase-2-verification.md
    └── phase-3-verification.md
```

---

## 🤖 Agent 并行策略

### Agent 分工

```
┌─────────────────────────────────────────────────────────────────┐
│                         Master (你)                              │
│                    协调所有 Agent 的执行                          │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Data Enrichment│    │ Dynamic Layer │    │ Motivation Layer│
│    Agent       │    │    Agent       │    │    Agent       │
│               │    │               │    │               │
│ • 爬取定价信息 │    │ • 行为 SDK    │    │ • 评分系统    │
│ • 补充上下文   │    │ • 热度服务    │    │ • 排名算法    │
│ • 生成模拟数据 │    │ • UI 组件     │    │ • 推荐系统    │
│ • 验证数据    │    │ • 验证        │    │ • 验证        │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  集成测试 & 验收  │
                    └─────────────────┘
```

### 并行执行说明

1. **Phase 1 并行任务**：数据丰富化可以并行处理多个分类的工具
2. **Phase 2-3 顺序依赖**：动态层是动力层的基础，需要先完成
3. **Agent 输出规范**：每个 Agent 必须产出可验证的中间结果

---

## 🎯 执行顺序

### 第一批：Phase 1 数据丰富化

| Agent | 任务 | 输出 |
|-------|------|------|
| EnrichAgent-1 | 爬取/模拟定价数据 | `pricing_data.json` |
| EnrichAgent-2 | 补充上下文窗口 | `context_window_data.json` |
| EnrichAgent-3 | 标注能力标签 | `capabilities_data.json` |

### 第二批：Phase 2 动态层

| Agent | 任务 | 输出 |
|-------|------|------|
| DynamicAgent-1 | 行为追踪 SDK | `behavior-sdk.ts` |
| DynamicAgent-2 | 热度计算服务 | `heat-service.ts` |
| DynamicAgent-3 | UI 组件 | `heat-components.tsx` |

### 第三批：Phase 3 动力层

| Agent | 任务 | 输出 |
|-------|------|------|
| MotivationAgent-1 | 评分系统 | `rating-system.ts` |
| MotivationAgent-2 | 排名算法 | `ranking-algorithm.ts` |
| MotivationAgent-3 | 推荐系统 | `recommendation-engine.ts` |

---

## 📊 验收里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|----------|
| M1: 数据完整 | Week 1 末 | 295 工具全部有定价、上下文、标签 |
| M2: 动态层可用 | Week 4 末 | 搜索/点击/对比行为可追踪 |
| M3: 动力层可用 | Week 7 末 | 评分/排名/推荐功能完整 |
| M4: 集成验证 | Week 10 末 | 端到端用户流程验证 |
| M5: 第三方数据 | Week 11+ | LMSYS/AA/OpenRouter 数据接入 |

---

## 🔧 使用方法

### 启动 Agent

```bash
# Phase 1: 数据丰富化
# 在终端中并行启动多个 Agent 任务

# Agent 1: 定价数据
tsx agents/enrich-pricing.ts

# Agent 2: 上下文窗口
tsx agents/enrich-context.ts

# Agent 3: 能力标签
tsx agents/enrich-capabilities.ts

# Phase 2: 动态层
tsx agents/dynamic-layer.ts

# Phase 3: 动力层
tsx agents/motivation-layer.ts
```

### 验证执行结果

```bash
# 运行验收测试
npm run verify:phase1
npm run verify:phase2
npm run verify:phase3
```

---

*Last updated: 2026-05-09*
*Maintainer: AI API Compass Team*