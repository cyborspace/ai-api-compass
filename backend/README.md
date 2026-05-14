# AIGC 工具导航 - 后端 API

基于 **Palantir Foundry Ontology** 架构的 AI 工具导航平台后端。

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    API Routes Layer                      │
│              (Fastify + OpenAPI)                        │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                         │
│        (ToolService, CompareService, etc.)               │
├─────────────────────────────────────────────────────────┤
│                 Repository Layer                        │
│              (Prisma ORM + PostgreSQL)                  │
├─────────────────────────────────────────────────────────┤
│                 Ontology Schema                        │
│   ObjectType | LinkType | ValueType | ActionType |      │
│   Function | Interface                                 │
└─────────────────────────────────────────────────────────┘
```

## 📦 项目结构

```
backend/
├── src/
│   ├── ontology/                     # Ontology Schema
│   │   ├── aigc-schema/             # AIGC Schema
│   │   │   ├── object-types/        # 11 个 ObjectType
│   │   │   ├── link-types/          # 7 个 LinkType
│   │   │   ├── value-types/          # 13 个 ValueType
│   │   │   ├── action-types/         # 4 个 ActionType
│   │   │   ├── functions/            # 5 个 Function
│   │   │   └── interfaces/           # 4 个 Interface
│   │   └── index.ts
│   │
│   ├── repositories/                 # 数据访问层
│   │   └── aigc.repository.ts
│   │
│   ├── services/                    # 业务逻辑层
│   │   └── aigc.service.ts
│   │
│   ├── routes/                      # API 路由层
│   │   └── aigc.routes.ts
│   │
│   ├── seed/                        # 数据初始化
│   │   └── aigc.seed.ts
│   │
│   └── server.ts                    # 主入口
│
├── prisma/
│   └── schema.prisma               # Prisma Schema
│
├── start.sh                        # 快速启动脚本
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 设置数据库
export DATABASE_URL="postgresql://user:password@localhost:5432/aigc_db"

# 运行启动脚本
chmod +x start.sh
./start.sh
```

### 2. 手动启动

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 同步数据库
npx prisma db push

# 导入 AI 工具数据（来自 aigc.cn）
npm run db:seed

# 启动开发服务器
npm run dev
```

## 📚 API 文档

启动后访问: http://localhost:8000/documentation

### AIGC 工具 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/aigc/tools` | 搜索工具列表 |
| GET | `/api/aigc/tools/:slug` | 获取工具详情 |
| GET | `/api/aigc/tools/:slug/similar` | 获取相似工具 |
| GET | `/api/aigc/tools/:slug/alternatives` | 性价比替代 |
| GET | `/api/aigc/tools/:slug/reviews` | 获取评价 |
| POST | `/api/aigc/tools/:slug/view` | 记录浏览 |

### 对比 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/aigc/compare` | 对比工具 |
| POST | `/api/aigc/compare/report` | 生成对比报告 |

### 分类 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/aigc/categories` | 获取所有分类 |
| GET | `/api/aigc/categories/:slug/tools` | 分类下的工具 |

### Ontology API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/aigc/ontology` | 获取 Ontology Manifest |
| GET | `/api/aigc/object-types` | 获取所有 ObjectType |
| GET | `/api/aigc/link-types` | 获取所有 LinkType |

## 🔍 API 示例

### 搜索工具

```bash
curl "http://localhost:8000/api/aigc/tools?query=AI&pricingType=free&limit=10"
```

### 对比工具

```bash
curl -X POST "http://localhost:8000/api/aigc/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "toolSlugs": ["doubao-ai", "kimi-ai"],
    "dimension": "all"
  }'
```

### 获取相似工具

```bash
curl "http://localhost:8000/api/aigc/tools/doubao-ai/similar?limit=5"
```

## 📊 Ontology Schema

### ObjectTypes (11个)

- `AIGCTool` - AI工具核心实体 (48个属性)
- `ToolCategory` - 工具分类
- `ToolProvider` - 工具提供商
- `ToolTag` - 工具标签
- `UseCase` - 使用场景
- `PricingPlan` - 定价方案
- `ToolCapability` - 能力矩阵
- `TechnicalSpec` - 技术规格
- `UserReview` - 用户评价
- `TrendMetric` - 趋势数据
- `CompetitorAnalysis` - 竞品分析

### LinkTypes (7个)

- `toolProvidedBy` - 工具→提供商 (MANY_TO_ONE)
- `toolBelongsToCategory` - 工具→分类 (MANY_TO_ONE)
- `toolHasPricingPlan` - 工具→定价 (ONE_TO_MANY)
- `toolHasCapability` - 工具→能力 (ONE_TO_ONE)
- `toolSuitableFor` - 工具→场景 (MANY_TO_MANY)
- `toolCompetitorOf` - 工具→竞品 (MANY_TO_MANY)
- `toolHasReview` - 工具→评价 (ONE_TO_MANY)

### Functions (5个)

- `searchTools` - 搜索工具
- `compareTools` - 多维度对比
- `getSimilarTools` - 相似工具推荐
- `findCostEffectiveAlternatives` - 性价比替代
- `incrementViewCount` - 增加浏览数

## 🛠️ 开发

### 添加新的 ObjectType

1. 创建文件: `src/ontology/aigc-schema/object-types/{name}.object-type.ts`
2. 定义 ObjectType
3. 在 `ontology-manifest.ts` 中导出
4. 在 Prisma Schema 中添加 Model

### 添加新的 Function

1. 在 `src/ontology/aigc-schema/functions/` 中定义
2. 在 Service 层实现
3. 在 Route 层暴露 API

## 📖 参考

- [Palantir Ontology Documentation](https://www.palantir.com/docs/foundry/ontology/overview/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)

## 📝 License

MIT
