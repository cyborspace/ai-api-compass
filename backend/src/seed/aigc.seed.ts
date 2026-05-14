// AUTO-GENERATED from aigc.cn scraped data
// Run: npx tsx src/seed/aigc.seed.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dataPath = path.join(__dirname, 'aigc_tools_data.json');
const raw = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(raw);

async function main() {
  console.log(`Seeding aigc.cn AI tools (${data.tools.length} tools, ${data.categories.length} categories)...`);

  const aigcTool = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
  const toolCat = await prisma.object_types.findUnique({ where: { apiName: 'ToolCategory' } });
  if (!aigcTool || !toolCat) {
    console.error('ERROR: AIGCTool or ToolCategory ObjectType not found');
    await prisma.$disconnect();
    return;
  }
  const aigcToolId = aigcTool.id;
  const toolCategoryId = toolCat.id;
  console.log(`  AIGCTool ObjectTypeId: ${aigcToolId}`);
  console.log(`  ToolCategory ObjectTypeId: ${toolCategoryId}`);

  let linkType = await prisma.link_types.findUnique({ where: { apiName: 'toolBelongsToCategory' } });
  if (!linkType) {
    linkType = await prisma.link_types.create({
      data: {
        id: `lt-${Date.now()}`,
        apiName: 'toolBelongsToCategory',
        displayName: 'Tool belongs to Category',
        sourceObjectTypeId: aigcToolId,
        targetObjectTypeId: toolCategoryId,
        status: 'active',
        visibility: 'prominent',
        cardinality: 'MANY_TO_ONE',
        updatedAt: new Date(),
      },
    });
    console.log(`  Created linkType: ${linkType.id}`);
  } else {
    console.log(`  Using linkType: ${linkType.id}`);
  }

  let catCreated = 0;
  for (const cat of data.categories) {
    const rid = `ri.aigc.main.object.tool-category.${cat.slug}`;
    const existing = await prisma.objects.findFirst({
      where: { objectTypeId: toolCategoryId, rid }
    });
    if (!existing) {
      await prisma.objects.create({
        data: { 
          id: `obj-cat-${Date.now()}-${cat.slug.replace(/[^a-zA-Z0-9]/g, '-')}`,
          objectTypeId: toolCategoryId, rid, properties: cat, status: 'active', updatedAt: new Date() 
        }
      });
      catCreated++;
    } else {
      await prisma.objects.update({
        where: { id: existing.id },
        data: { properties: cat }
      });
    }
  }
  console.log(`  Categories: ${catCreated} created, ${data.categories.length - catCreated} updated`);

  const allCats = await prisma.objects.findMany({
    where: { objectTypeId: toolCategoryId },
    select: { rid: true, id: true }
  });
  const catIdByRid = new Map(allCats.map(c => [c.rid, c.id]));
  console.log(`  Total categories in DB: ${allCats.length}`);

  let toolCreated = 0;
  let toolUpdated = 0;

  for (let i = 0; i < data.tools.length; i++) {
    const tool = data.tools[i];
    const rid = `ri.aigc.main.object.aigc-tool.${tool.slug}`;

    const existing = await prisma.objects.findFirst({
      where: { objectTypeId: aigcToolId, rid }
    });
    if (!existing) {
      await prisma.objects.create({
        data: {
          id: `obj-tool-${Date.now()}-${i}-${tool.slug.replace(/[^a-zA-Z0-9]/g, '-')}`,
          objectTypeId: aigcToolId,
          rid,
          properties: {
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            websiteUrl: tool.url,
            developer: tool.developer,
            pricingType: 'freemium',
            releaseDate: '2024-01-01',
            modalities: [],
            capabilities: [],
            platforms: [],
            viewCount: 0,
            favoriteCount: 0,
            compareCount: 0,
          },
          status: 'active',
          updatedAt: new Date(),
        },
      });
      toolCreated++;
    } else {
      const existingProps = existing.properties as Record<string, any> || {};
      await prisma.objects.update({
        where: { id: existing.id },
        data: {
          properties: {
            ...existingProps,
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            websiteUrl: tool.url,
            developer: tool.developer,
          },
        },
      });
      toolUpdated++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${data.tools.length}`);
    }
  }
  console.log(`  Tools: ${toolCreated} created, ${toolUpdated} updated`);

  console.log('  Creating links...');

  const allTools = await prisma.objects.findMany({
    where: { objectTypeId: aigcToolId },
    select: { rid: true, id: true }
  });
  const toolIdByRid = new Map(allTools.map(t => [t.rid, t.id]));

  const existingLinks = await prisma.links.findMany({
    where: { linkTypeId: linkType.id },
    select: { sourceObjectId: true, targetObjectId: true }
  });
  const existingLinkSet = new Set(existingLinks.map(l => `${l.sourceObjectId}->${l.targetObjectId}`));

  let linkCreated = 0;
  for (const tool of data.tools) {
    const toolRid = `ri.aigc.main.object.aigc-tool.${tool.slug}`;
    const toolObjId = toolIdByRid.get(toolRid);

    const catSlug = data.categories.find((c: any) => c.name === tool.category)?.slug;
    if (catSlug && toolObjId) {
      const catRid = `ri.aigc.main.object.tool-category.${catSlug}`;
      const catObjId = catIdByRid.get(catRid);

      if (catObjId && !existingLinkSet.has(`${toolObjId}->${catObjId}`)) {
        await prisma.links.create({
          data: {
            id: `link-${Date.now()}-${linkCreated}`,
            linkTypeId: linkType.id,
            sourceObjectId: toolObjId,
            targetObjectId: catObjId,
            properties: {},
            updatedAt: new Date(),
          },
        });
        linkCreated++;
        existingLinkSet.add(`${toolObjId}->${catObjId}`);
      }
    }
  }
  console.log(`  Links: ${linkCreated} created`);
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
