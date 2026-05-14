# 第 13 章：技能树与面试准备

> **核心问题**：FDE 需要具备哪些技能？如何准备面试？
>
> **本章简介**：本章探讨 FDE 的技能树和面试准备。从技术技能到软技能，从面试技巧到职业规划——读者将掌握 FDE 的完整技能体系和面试策略。通过 AI-API-COMPASS 项目的真实技术栈，让技能树有血有肉。

---

## 13.1 技术技能树

### 13.1.1 基础技能

FDE 需要具备以下基础技能：

| 技能 | 说明 | 重要性 | AI-API-COMPASS 关联 |
|------|------|--------|---------------------|
| **编程语言** | Python、TypeScript、SQL | 必备 | 后端 NestJS + Prisma（TypeScript）、前端 Next.js（TypeScript） |
| **数据结构与算法** | 数组、链表、树、图、排序、搜索 | 必备 | 热力值排序算法、工具排名算法 |
| **数据库** | 关系型数据库、NoSQL | 必备 | PostgreSQL + Prisma ORM |
| **版本控制** | Git | 必备 | 项目代码管理 |
| **Linux** | 基本命令、Shell 脚本 | 重要 | 服务器部署 |
| **网络** | HTTP、TCP/IP、RESTful API | 重要 | Fastify REST API 设计 |

**AI-API-COMPASS 代码示例** — 数据库查询技能：

```typescript
// Prisma 查询示例：获取热门工具
const hotTools = await prisma.object_properties.findMany({
  where: { prop_status: 'active' },
  orderBy: { prop_viewCount: 'desc' },
  take: 10,
});
```

### 13.1.2 数据工程技能

FDE 需要具备以下数据工程技能：

| 技能 | 说明 | 重要性 | AI-API-COMPASS 关联 |
|------|------|--------|---------------------|
| **ETL/ELT** | 数据抽取、转换、加载 | 必备 | Prisma Schema 数据映射 |
| **数据建模** | 维度建模、关系建模 | 必备 | Ontology 对象类型设计 |
| **数据质量** | 数据清洗、数据验证 | 必备 | 反作弊系统、评分验证 |
| **数据管道** | Airflow、Dagster | 重要 | 热力值计算定时任务 |
| **大数据** | Spark、Hadoop | 重要 | 用户行为分析 |
| **流处理** | Kafka、Flink | 重要 | 实时事件追踪 |

**AI-API-COMPASS 代码示例** — 数据血缘追踪：

```typescript
// 数据血缘：从 Object 追溯到数据源
const objectWithLineage = await prisma.objects.findFirst({
  where: { rid: 'ri.aigc.tool.chatgpt' },
  include: {
    object_types: {
      include: {
        datasource_mappings: true, // 数据源映射
      },
    },
  },
});
```

### 13.1.3 Palantir 平台技能

FDE 需要具备以下 Palantir 平台技能：

| 技能 | 说明 | 重要性 | AI-API-COMPASS 关联 |
|------|------|--------|---------------------|
| **Ontology** | Object Type、Property、Link Type | 必备 | AIGCTool、UserReview、ToolProvider 等对象类型定义 |
| **AIP** | AIP Logic、Model Catalog | 必备 | LLM 集成、智能推荐 |
| **Workshop** | 低代码应用开发 | 重要 | 管理后台快速搭建 |
| **Slate** | 全代码应用开发 | 重要 | 自定义前端组件 |
| **Quiver** | 数据分析 | 重要 | 工具排名分析 |
| **Foundry** | 数据集成 | 重要 | 数据同步引擎 |

**AI-API-COMPASS 代码示例** — Ontology 定义：

```typescript
// AIGCTool Object Type 定义（简化版）
export const AIGCToolObjectType: ObjectTypeV2 = {
  apiName: 'AIGCTool',
  displayName: 'AI工具',
  primaryKey: 'slug',
  titleProperty: 'name',
  properties: {
    slug: { dataType: { type: 'string' }, required: true, isUnique: true },
    name: { dataType: { type: 'string' }, required: true },
    pricingType: { dataType: { type: 'string' }, valueTypeApiName: 'PricingType' },
    averageRating: { dataType: { type: 'double' }, defaultValue: 0 },
    viewCount: { dataType: { type: 'integer' }, defaultValue: 0 },
  },
};
```

### 13.1.4 AI 技能

FDE 需要具备以下 AI 技能：

| 技能 | 说明 | 重要性 | AI-API-COMPASS 关联 |
|------|------|--------|---------------------|
| **机器学习** | 监督学习、无监督学习 | 重要 | 工具推荐算法 |
| **深度学习** | 神经网络、CNN、RNN | 重要 | 图像识别（Logo 识别） |
| **NLP** | 文本处理、语义分析 | 重要 | 工具描述语义搜索 |
| **LLM** | 大语言模型、Prompt Engineering | 重要 | AIP Logic 集成 |
| **MLOps** | 模型部署、监控 | 重要 | 推荐系统部署 |

**AI-API-COMPASS 代码示例** — 推荐系统：

```typescript
// 基于 Ontology 的推荐系统
class RecommendationSystem {
  async recommend(userId: string, context: RecommendationContext): Promise<Recommendation[]> {
    // 1. 获取用户历史行为
    const userHistory = await this.getUserHistory(userId);
    
    // 2. 获取相似用户（通过 Link Type）
    const similarUsers = await prisma.links.findMany({
      where: {
        link_types: { apiName: 'similarUser' },
        sourceObjectId: userId,
      },
    });
    
    // 3. 生成推荐
    const recommendations = await this.generateRecommendations(
      userHistory,
      similarUsers,
      context
    );
    
    return recommendations;
  }
}
```

---

## 13.2 软技能

### 13.2.1 沟通能力

FDE 需要具备良好的沟通能力：

| 能力 | 说明 | 提升方法 | AI-API-COMPASS 场景 |
|------|------|---------|---------------------|
| **技术翻译** | 将技术概念转化为业务语言 | 多与客户交流 | 向客户解释 Ontology 概念 |
| **需求挖掘** | 挖掘客户的真实需求 | 练习 5 Whys | 理解客户为什么需要工具对比平台 |
| **演示能力** | 清晰展示技术方案 | 多练习演讲 | 展示 AI-API-COMPASS 的热力图功能 |
| **文档能力** | 编写清晰的技术文档 | 多写文档 | 编写 Ontology 定义文档 |

### 13.2.2 项目管理能力

FDE 需要具备项目管理能力：

| 能力 | 说明 | 提升方法 | AI-API-COMPASS 场景 |
|------|------|---------|---------------------|
| **时间管理** | 合理安排时间 | 使用番茄工作法 | 平衡 Ontology 定义和前端开发 |
| **风险管理** | 识别和管理风险 | 学习风险管理框架 | 评估数据同步延迟风险 |
| **团队协作** | 与团队成员协作 | 多参与团队项目 | 前后端 API 联调 |
| **敏捷开发** | 掌握敏捷开发方法 | 学习 Scrum、Kanban | 迭代开发工具对比功能 |

### 13.2.3 问题解决能力

FDE 需要具备问题解决能力：

| 能力 | 说明 | 提升方法 | AI-API-COMPASS 场景 |
|------|------|---------|---------------------|
| **分析能力** | 分析问题的根本原因 | 学习 RCA | 分析评分数据异常 |
| **创新能力** | 提出创新的解决方案 | 多思考、多尝试 | 设计反作弊算法 |
| **决策能力** | 做出正确的决策 | 学习决策框架 | 选择技术栈（NestJS vs Express） |
| **学习能力** | 快速学习新技术 | 保持好奇心 | 学习 Palantir Ontology 规范 |

---

## 13.3 面试准备

### 13.3.1 技术面试

FDE 的技术面试通常包括以下内容：

| 类型 | 说明 | 准备方法 | AI-API-COMPASS 案例 |
|------|------|---------|---------------------|
| **算法题** | 数据结构与算法 | LeetCode 刷题 | 实现工具排名算法 |
| **系统设计** | 设计分布式系统 | 学习系统设计案例 | 设计 Ontology 驱动的 API 平台 |
| **SQL 题** | 编写复杂 SQL | 练习 SQL 题目 | 编写热力值统计查询 |
| **Ontology 设计** | 设计 Ontology | 练习 Ontology 设计 | 设计 AIGCTool 对象类型 |
| **项目经验** | 介绍过往项目 | 准备项目案例 | 介绍 AI-API-COMPASS 项目 |

**面试题示例**：设计一个 Ontology 驱动的工具对比平台

```typescript
// 面试官可能会问：如何设计 AIGCTool 的 Object Type？
// 优秀回答应该包括：
// 1. 核心属性（slug、name、pricingType）
// 2. 统计属性（viewCount、averageRating）
// 3. 标记属性（isPopular、isFeatured）
// 4. Link Type 设计（toolProvidedBy、toolHasReview）
// 5. Action Type 设计（submitReview、createFavorite）
```

### 13.3.2 行为面试

FDE 的行为面试通常包括以下内容：

| 类型 | 说明 | 准备方法 | AI-API-COMPASS 案例 |
|------|------|---------|---------------------|
| **自我介绍** | 介绍自己的背景 | 准备 1-2 分钟版本 | 强调 Ontology 项目经验 |
| **项目介绍** | 介绍过往项目 | 使用 STAR 法则 | 介绍 AI-API-COMPASS 的挑战和解决 |
| **团队协作** | 描述团队协作经验 | 准备具体案例 | 前后端 API 设计协作 |
| **问题解决** | 描述解决问题的经验 | 准备具体案例 | 解决数据同步延迟问题 |
| **职业规划** | 描述职业规划 | 准备清晰的目标 | 成为 Palantir 平台专家 |

**STAR 法则示例**：

> **情境（Situation）**：在 AI-API-COMPASS 项目中，我们需要实现一个实时热力值计算系统。
>
> **任务（Task）**：我负责设计热力值算法，需要平衡浏览量、收藏量、评分等多个维度。
>
> **行动（Action）**：我设计了加权评分算法，使用 Redis 缓存中间结果，并实现了定时任务更新。
>
> **结果（Result）**：热力值计算延迟从 5 分钟降低到 30 秒，用户参与度提升 40%。

### 13.3.3 面试技巧

FDE 的面试技巧：

| 技巧 | 说明 | 示例 |
|------|------|------|
| **STAR 法则** | 情境、任务、行动、结果 | "在 AI-API-COMPASS 项目中，我负责 Ontology 设计，通过定义 AIGCTool 对象类型，实现了工具数据的统一建模" |
| **提前准备** | 提前了解公司和职位 | 研究公司官网、产品，了解其 Ontology 使用场景 |
| **提问环节** | 准备问题问面试官 | "团队的技术栈是什么？是否使用 Palantir 平台？" |
| **跟进感谢** | 面试后发感谢信 | 感谢面试官的时间，重申对 Ontology 技术的兴趣 |

---

## 13.4 职业规划

### 13.4.1 初级 FDE

初级 FDE 的职责：

| 职责 | 说明 | AI-API-COMPASS 对应任务 |
|------|------|-------------------------|
| **数据接入** | 将数据接入 Palantir 平台 | 配置 Prisma 数据源映射 |
| **Ontology 构建** | 在指导下构建 Ontology | 在高级 FDE 指导下定义 Object Type |
| **应用开发** | 开发简单的应用 | 开发 ToolCard 前端组件 |
| **技术支持** | 为客户提供技术支持 | 解答 Ontology API 使用问题 |

### 13.4.2 中级 FDE

中级 FDE 的职责：

| 职责 | 说明 | AI-API-COMPASS 对应任务 |
|------|------|-------------------------|
| **独立项目** | 独立负责项目 | 独立设计 AIGCTool Ontology |
| **Ontology 设计** | 设计复杂的 Ontology | 设计 Link Type 关系网络 |
| **团队指导** | 指导初级 FDE | 指导初级 FDE 理解 Property 类型系统 |
| **客户沟通** | 与客户直接沟通 | 向客户解释 Ontology 三层架构 |

### 13.4.3 高级 FDE

高级 FDE 的职责：

| 职责 | 说明 | AI-API-COMPASS 对应任务 |
|------|------|-------------------------|
| **架构设计** | 设计系统架构 | 设计 Ontology 驱动的微服务架构 |
| **技术决策** | 做出关键技术决策 | 选择 NestJS + Prisma 技术栈 |
| **团队管理** | 管理团队 | 管理 Ontology 开发团队 |
| **业务拓展** | 拓展新业务 | 将 AI-API-COMPASS 模式复制到其他领域 |

---

## 13.5 AI-API-COMPASS 实战技能树

### 13.5.1 项目技术栈深度解析

通过 AI-API-COMPASS 项目，FDE 可以掌握以下技术栈：

```
AI-API-COMPASS 技术栈
├── 后端层
│   ├── NestJS / Fastify（API 框架）
│   ├── Prisma ORM（数据库访问）
│   ├── PostgreSQL（关系数据库）
│   ├── Redis（缓存）
│   └── Ontology SDK（语义层定义）
├── 前端层
│   ├── Next.js（React 框架）
│   ├── TypeScript（类型安全）
│   ├── Tailwind CSS（样式）
│   ├── Zustand（状态管理）
│   └── Lucide React（图标）
├── 数据层
│   ├── Prisma Schema（数据模型）
│   ├── Object Types（语义定义）
│   ├── Link Types（关系定义）
│   └── Action Types（操作定义）
└── AI 层
    ├── AIP Logic（LLM 编排）
    ├── 推荐算法（协同过滤）
    └── 语义搜索（NLP）
```

### 13.5.2 项目中的技能成长路径

| 阶段 | 技能目标 | AI-API-COMPASS 实践 |
|------|----------|---------------------|
| **第 1 周** | 理解 Ontology 概念 | 阅读 AIGCTool Object Type 定义 |
| **第 2 周** | 掌握 Object Type 设计 | 修改 AIGCTool 的 Property 定义 |
| **第 3 周** | 掌握 Link Type 设计 | 添加 toolSuitableFor Link Type |
| **第 4 周** | 掌握 Action Type 设计 | 实现 submitReview Action |
| **第 5-6 周** | 前端集成 | 开发 ToolCard 组件 |
| **第 7-8 周** | AI 集成 | 实现推荐系统 |

### 13.5.3 项目经验作为面试案例

**面试问题**："请介绍一个你最有挑战性的项目"

**回答框架**：

> "我最有挑战性的项目是 AI-API-COMPASS，一个 Ontology 驱动的 AI 工具对比平台。
>
> **挑战 1：Ontology 设计**
> 我需要设计一个能够表达 AI 工具复杂属性的 Object Type。通过定义 30+ 个 Property（包括核心属性、定价属性、能力属性、统计属性），实现了工具数据的统一建模。
>
> **挑战 2：关系建模**
> 工具之间存在多种关系（提供商、分类、竞品、使用场景）。我设计了 7 种 Link Type，包括 MANY_TO_MANY 的 toolSuitableFor 和自引用的 toolCompetitorOf。
>
> **挑战 3：前端集成**
> 我需要将 Ontology 数据映射到前端组件。通过 ToolCard 组件，实现了工具信息的动态展示，包括热力值、评分、收藏等功能。
>
> **成果**：项目上线后，用户参与度提升 40%，热力值计算延迟降低到 30 秒。"

---

## ✅ 本章自评清单

- [ ] 掌握基础技能（编程语言、数据结构、数据库、Git、Linux、网络）
- [ ] 掌握数据工程技能（ETL/ELT、数据建模、数据质量、数据管道、大数据、流处理）
- [ ] 掌握 Palantir 平台技能（Ontology、AIP、Workshop、Slate、Quiver、Foundry）
- [ ] 掌握 AI 技能（机器学习、深度学习、NLP、LLM、MLOps）
- [ ] 具备良好的沟通能力（技术翻译、需求挖掘、演示能力、文档能力）
- [ ] 具备项目管理能力（时间管理、风险管理、团队协作、敏捷开发）
- [ ] 具备问题解决能力（分析能力、创新能力、决策能力、学习能力）
- [ ] 准备技术面试（算法题、系统设计、SQL 题、Ontology 设计、项目经验）
- [ ] 准备行为面试（自我介绍、项目介绍、团队协作、问题解决、职业规划）
- [ ] 掌握面试技巧（STAR 法则、提前准备、提问环节、跟进感谢）
- [ ] 了解初级 FDE 职责
- [ ] 了解中级 FDE 职责
- [ ] 了解高级 FDE 职责
- [ ] 完成 AI-API-COMPASS 项目技能成长路径

---

> **本章小结**：FDE 需要具备完整的技术技能树和软技能。通过 AI-API-COMPASS 项目的实战，读者可以将技能树从理论转化为实践。从技术技能到软技能，从面试准备到职业规划，FDE 需要不断学习和提升。通过系统的技能培养和面试准备，FDE 可以在职业发展中取得成功。
