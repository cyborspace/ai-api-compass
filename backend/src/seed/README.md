# Seed 数据导入

## 数据来源

所有 AI 工具数据来源于 [aigc.cn](https://www.aigc.cn/#term-2494)，包含真实的工具名称、官方网站 URL、开发商和描述信息。

## 文件说明

- **`aigc_tools_data.json`** — AI 工具数据（295 个工具、10 个分类）
- **`aigc.seed.ts`** — 数据导入脚本

## 导入步骤

### 1. 清理旧数据（首次导入或重新导入时执行）

```bash
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
  const types = ['AIGCTool', 'ToolCategory'];
  for (const apiName of types) {
    const ot = await prisma.objectType.findUnique({ where: { apiName } });
    if (!ot) continue;
    const objs = await prisma.object.findMany({ where: { objectTypeId: ot.id }, select: { id: true } });
    const objIds = objs.map(o => o.id);
    if (objIds.length > 0) {
      await prisma.link.deleteMany({ where: { OR: [{ sourceObjectId: { in: objIds } }, { targetObjectId: { in: objIds } }] } });
      await prisma.object.deleteMany({ where: { objectTypeId: ot.id } });
    }
    console.log('Cleared ' + objs.length + ' ' + apiName + ' objects');
  }
  await prisma.\$disconnect();
}
clear().catch(console.error);
"
```

### 2. 导入新数据

```bash
npx tsx src/seed/aigc.seed.ts
```

预期输出：
- Categories: 10 个分类
- Tools: ~295 个工具（部分 slug 重复会自动去重）
- Links: ~303 条 toolBelongsToCategory 链接

## 数据分类

| 分类 | 说明 |
|---|---|
| AI写作工具 | 文字创作、论文写作、公文撰写等 |
| AI绘画工具 | 文生图、图片编辑、AI素材等 |
| AI视频生成 | AI生成视频、数字人、换脸等 |
| AI生成PPT | 一键生成PPT、智能演示文稿 |
| AI设计工具 | UI设计、海报设计、商品图等 |
| AI智能助手 | 对话助手、搜索引擎、聊天机器人 |
| AI音乐生成 | AI作曲、AI音效、语音合成 |
| Agents开发平台 | AI Agent、低代码开发平台 |
| AI编程工具 | AI编程助手、代码生成 |
| AI应用接口API | 大模型API服务平台 |

## 重新从 aigc.cn 爬取数据

如需更新工具数据，请使用爬虫重新从 aigc.cn 抓取，生成新的 `aigc_tools_data.json`，然后重新运行 `aigc.seed.ts`。
