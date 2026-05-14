# AI API Compass

AI API 兼容性查询网站 - 帮助开发者快速比较和选择 AI API

## 项目架构

基于参考代码的 Ontology 架构设计，采用 **Vercel + Railway 免费版** 部署方案。

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐
│   Vercel Hobby   │ ───→ │  Railway Starter │ ───→ │  Upstash Redis (免费)   │
│  (Next.js前端)   │      │ (FastAPI后端+DB)  │      │   缓存/会话              │
│   100GB/月      │      │   $5额度/月      │      │   10K请求/天            │
└─────────────────┘      └─────────────────┘      └─────────────────────────┘
```

## 技术栈

### 后端 (backend/)
- **Fastify** - 高性能 Node.js Web 框架
- **Prisma** - 类型安全的数据库 ORM
- **PostgreSQL** - Railway 免费版 (500MB)
- **Redis** - Upstash 免费版 (10K请求/天)
- **TypeScript** - 类型安全

**架构模式（借鉴参考代码）:**
- **Facade 模式** - `createServices()` 统一服务入口
- **Repository 模式** - 数据访问层分离
- **Service 层** - 业务逻辑封装
- **智能缓存** - Redis + 内存缓存双层架构

### 前端 (frontend/)
- **Next.js 15** - React 框架 (App Router)
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **SWR** - 数据获取与缓存
- **Zustand** - 状态管理

## 项目结构

```
ai-api-compass/
├── backend/                    # Fastify + Prisma 后端
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型定义
│   ├── src/
│   │   ├── index.ts            # 应用入口
│   │   ├── server.ts           # Fastify 服务器配置
│   │   ├── services/           # 业务服务层
│   │   │   ├── index.ts        # Services Facade
│   │   │   ├── cache.ts        # 智能缓存服务
│   │   │   ├── model.ts        # 模型服务
│   │   │   ├── provider.ts     # 提供商服务
│   │   │   ├── category.ts     # 分类服务
│   │   │   ├── compare.ts      # 对比服务
│   │   │   ├── search.ts       # 搜索服务
│   │   │   └── use-case.ts     # 使用场景服务
│   │   ├── repositories/       # 数据访问层
│   │   │   ├── base.ts         # 基础 Repository
│   │   │   ├── model.ts        # 模型 Repository
│   │   │   ├── provider.ts     # 提供商 Repository
│   │   │   ├── category.ts     # 分类 Repository
│   │   │   ├── use-case.ts     # 使用场景 Repository
│   │   │   └── search-log.ts   # 搜索日志 Repository
│   │   ├── routes/             # API 路由
│   │   │   ├── health.ts       # 健康检查
│   │   │   ├── models.ts       # 模型路由
│   │   │   ├── providers.ts    # 提供商路由
│   │   │   ├── categories.ts   # 分类路由
│   │   │   ├── compare.ts      # 对比路由
│   │   │   ├── search.ts       # 搜索路由
│   │   │   └── use-cases.ts    # 使用场景路由
│   │   └── plugins/            # Fastify 插件
│   │       ├── request-logger.ts
│   │       └── error-handler.ts
│   ├── Procfile                # Railway 部署配置
│   ├── railway.json            # Railway 配置
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js 前端
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 组件
│   ├── lib/                    # 工具函数
│   ├── hooks/                  # 自定义 Hooks
│   ├── stores/                 # Zustand 状态管理
│   ├── vercel.json             # Vercel 配置
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
└── shared/                     # 共享类型定义
    └── types/
```

## 数据库模型

### 核心实体
- **Provider** - AI 提供商 (OpenAI, Anthropic, DeepSeek...)
- **Model** - AI 模型 (GPT-4o, Claude 3.5...)
- **Category** - 分类 (代码生成、聊天、图像...)
- **PriceHistory** - 价格历史
- **Benchmark** - 性能基准测试
- **UseCase** - 使用场景 (SEO 落地页)
- **SearchLog** - 搜索日志

## 快速开始

### 1. 克隆项目
```bash
git clone <repository>
cd ai-api-compass
```

### 2. 后端设置
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接

# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

### 3. 前端设置
```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
# 创建 .env.local 文件:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 启动开发服务器
npm run dev
```

## 部署

### 后端部署到 Railway
```bash
cd backend

# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 添加 PostgreSQL 数据库
railway add --database postgres

# 部署
railway up
```

### 前端部署到 Vercel
```bash
cd frontend

# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

## API 端点

### 模型
- `GET /api/v1/models` - 获取模型列表
- `GET /api/v1/models/:slug` - 获取模型详情
- `GET /api/v1/models/stats` - 获取模型统计

### 提供商
- `GET /api/v1/providers` - 获取提供商列表
- `GET /api/v1/providers/:slug` - 获取提供商详情

### 分类
- `GET /api/v1/categories` - 获取分类列表
- `GET /api/v1/categories/:slug` - 获取分类详情

### 对比
- `POST /api/v1/compare` - 对比多个模型

### 搜索
- `GET /api/v1/search?q=query` - 搜索模型

### 使用场景
- `GET /api/v1/use-cases` - 获取使用场景列表
- `GET /api/v1/use-cases/:slug` - 获取使用场景详情

## 成本

| 项目 | 服务 | 费用 |
|------|------|------|
| 前端托管 | Vercel Hobby | ¥0 |
| 后端托管 | Railway Starter | ¥0 |
| 数据库 | Railway Postgres | ¥0 |
| 缓存 | Upstash Redis | ¥0 |
| **总计** | | **¥0/月** |

## 参考

- 后端架构借鉴 [Ontology API](docs/packages/api/) 的 Facade + Repository 模式
- 部署方案基于 [Vercel + Railway 免费版](docs/website/技术栈与部署方案_Vercel_Railway.md)

## License

MIT
