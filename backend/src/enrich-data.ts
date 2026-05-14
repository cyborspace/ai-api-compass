import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('开始数据丰富化...\n');

  const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
  if (!aigcToolType) {
    console.error('ERROR: AIGCTool ObjectType not found');
    await prisma.$disconnect();
    return;
  }

  const allTools = await prisma.objects.findMany({
    where: { objectTypeId: aigcToolType.id },
    select: { id: true, rid: true, properties: true }
  });

  const toolByRid = new Map(allTools.map(t => [t.rid, t]));
  const toolByName = new Map(allTools.map(t => [(t.properties as Record<string, any>)?.name, t]));

  const pricingData = JSON.parse(fs.readFileSync('./data/pricing_data.json', 'utf-8'));
  const contextData = JSON.parse(fs.readFileSync('./data/context_window_data.json', 'utf-8'));
  const capabilitiesData = JSON.parse(fs.readFileSync('./data/capabilities_data.json', 'utf-8'));

  console.log(`加载数据: ${pricingData.stats.total} 定价, ${contextData.validation.total} 上下文, ${capabilitiesData.length} 能力\n`);

  let updated = 0;
  let skipped = 0;

  for (const tool of allTools) {
    const props = tool.properties as Record<string, any> || {};
    const name = props.name as string | undefined;
    if (!name) {
      skipped++;
      continue;
    }

    let hasUpdates = false;
    const updatedProps = { ...(props as Record<string, any>) };

    const pricing = pricingData.data.find((p: Record<string, any>) => 
      p.name === name || p.toolRid === tool.rid
    );
    if (pricing) {
      updatedProps.pricingModel = pricing.pricingModel;
      updatedProps.priceRange = pricing.priceRange;
      updatedProps.inputPrice = pricing.inputPrice;
      updatedProps.outputPrice = pricing.outputPrice;
      hasUpdates = true;
    }

    const context = contextData.data.find((c: Record<string, any>) => 
      c.name === name || c.slug === name || c.toolRid === tool.rid
    );
    if (context) {
      updatedProps.contextWindow = context.contextWindow;
      updatedProps.maxOutputTokens = context.maxOutputTokens;
      updatedProps.supportsStreaming = context.supportsStreaming;
      updatedProps.supportsFunctionCalling = context.supportsFunctionCalling;
      hasUpdates = true;
    }

    const caps = capabilitiesData.find((c: any) => 
      c.toolRid === tool.rid
    );
    if (caps) {
      updatedProps.capabilities = caps.capabilities;
      updatedProps.modalities = caps.modalities;
      hasUpdates = true;
    }

    if (hasUpdates) {
      await prisma.objects.update({
        where: { id: tool.id },
        data: { properties: updatedProps }
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n数据丰富化完成!`);
  console.log(`  更新: ${updated} 个工具`);
  console.log(`  跳过: ${skipped} 个工具`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
