# AI API Compass - 数据库迁移指南

## 🚀 快速开始

### 1. 重置数据库并应用新 Schema

```bash
# 进入后端目录
cd backend

# 重置数据库（会删除所有数据！）
npx prisma migrate reset --force

# 或者创建新的迁移
npx prisma migrate dev --name add_affiliate_and_alternatives
```

### 2. 生成 Prisma Client

```bash
npm run db:generate
```

### 3. 运行扩展种子数据

```bash
# 使用新的扩展种子脚本
npm run db:seed:extended

# 或者使用原来的种子脚本
npm run db:seed
```

---

## 📊 Schema 变更摘要

### 新增模型

| 模型 | 用途 |
|------|------|
| `ModelAlternative` | 模型之间的替代关系 |
| `AffiliateLink` | 提供商级别的联盟链接 |
| `ModelAffiliateLink` | 模型特定的联盟链接 |
| `UseCaseRecommendation` | 使用场景推荐（替代原来的JSON字段） |
| `User` | 用户系统（简化版） |
| `UserFavorite` | 用户收藏 |
| `SearchLog` | 搜索日志分析 |
| `CompareLog` | 对比日志分析 |

### 新增字段

#### Model 表
- `openaiCompatible` - 是否与OpenAI API兼容
- `apiEndpointPattern` - API端点模式
- `pricingModel` - 定价模型枚举
- `freeTierLimit` - 免费额度说明
- `viewCount` / `compareCount` - 统计字段

#### Provider 表
- `apiDocsUrl` - API文档链接
- `isPopular` - 是否热门提供商

#### Category 表
- `nameEn` - 英文名称
- `icon` - Lucide图标名称
- `color` - 分类颜色

---

## 🌱 种子数据说明

### 扩展种子数据包含

| 数据类型 | 数量 | 说明 |
|----------|------|------|
| Providers | 10 | OpenAI, Anthropic, DeepSeek, Google, 阿里, 百度, 智谱, 月之暗面, SiliconFlow, OpenRouter |
| Categories | 6 | 代码生成、聊天对话、图像理解、推理分析、长上下文、高性价比 |
| Models | 15 | GPT-4o, Claude 3.5, DeepSeek-V3, Gemini 1.5, Kimi等 |
| Alternatives | 8 | 模型替代关系，包含价格节省百分比 |
| Benchmarks | 12 | MMLU, HumanEval, MATH等基准测试数据 |
| Use Cases | 5 | 代码生成、聊天、视觉、推理、高性价比推荐 |
| Recommendations | 15 | 每个使用场景的Top 3推荐 |
| Affiliate Links | 6 | 各平台注册链接 |

---

## 🔄 从旧版本迁移

如果你已有旧数据，需要保留：

### 步骤 1: 备份数据

```bash
# 导出当前数据
npx prisma db pull
npx prisma migrate dev --create-only --name backup
```

### 步骤 2: 创建迁移

```bash
npx prisma migrate dev --name add_new_features
```

### 步骤 3: 手动迁移数据

编写脚本将旧数据映射到新结构：

```typescript
// src/migrate-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  // 1. 更新现有模型的 API 兼容性字段
  await prisma.model.updateMany({
    where: { providerId: 'prov_openai' },
    data: { openaiCompatible: true }
  });

  await prisma.model.updateMany({
    where: { providerId: 'prov_deepseek' },
    data: { openaiCompatible: true }
  });

  // 2. 为现有 UseCase 创建 Recommendation 记录
  // ... 根据你的实际数据编写

  console.log('Migration completed!');
}

migrate();
```

---

## 📝 关键查询示例

### 获取模型及其替代品

```typescript
const modelWithAlternatives = await prisma.model.findUnique({
  where: { slug: 'gpt-4o' },
  include: {
    alternatives: {
      include: {
        alternative: true
      }
    }
  }
});
```

### 获取使用场景推荐

```typescript
const recommendations = await prisma.useCaseRecommendation.findMany({
  where: { useCaseId: 'uc_code' },
  include: { model: true },
  orderBy: { rank: 'asc' }
});
```

### 按能力筛选模型

```typescript
const visionModels = await prisma.model.findMany({
  where: {
    capabilities: {
      path: ['vision'],
      equals: true
    }
  }
});
```

### 获取高性价比模型（按价格排序）

```typescript
const cheapModels = await prisma.model.findMany({
  where: { isActive: true },
  orderBy: { inputPrice: 'asc' },
  take: 10
});
```

---

## 🎯 下一步建议

1. **运行种子数据**：`npm run db:seed:extended`
2. **验证数据**：打开 Prisma Studio `npm run db:studio`
3. **更新 API 路由**：根据新 schema 更新后端接口
4. **添加更多数据**：根据实际业务需求继续补充模型和基准数据

---

## ❓ 常见问题

### Q: 运行种子脚本时报错？

确保数据库连接正常：
```bash
# 检查 .env 文件
DATABASE_URL="postgresql://user:password@localhost:5432/ai_api_compass"
```

### Q: 如何只添加新数据而不删除旧数据？

修改 `seed-extended.ts`，注释掉 `deleteMany` 部分，然后使用 `create` 或 `upsert`。

### Q: 如何更新现有数据？

使用 `prisma.model.update` 或 `prisma.model.upsert`：

```typescript
await prisma.model.upsert({
  where: { slug: 'gpt-4o' },
  update: { inputPrice: 2.50 },
  create: { /* 新数据 */ }
});
```

---

*最后更新: 2025-05-07*
