/**
 * Enrich Tool Properties
 *
 * 将 pricing_data.json 和 context_window_data.json 的数据合并到工具属性中
 * 同时生成 heatScore 和 averageRating
 *
 * Run: npx tsx src/seed/enrich-tools.seed.ts
 */

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

interface PricingData {
  toolRid: string;
  name: string;
  pricingModel: string;
  priceRange: string;
  inputPrice: number;
  outputPrice: number;
  source: string;
  confidence: number;
}

interface ContextWindowData {
  toolRid: string;
  slug: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  source: string;
  confidence: number;
}

async function main() {
  console.log('Enriching tool properties with pricing and context window data...\n');

  const aigcToolType = await prisma.object_types.findUnique({
    where: { apiName: 'AIGCTool' }
  });

  if (!aigcToolType) {
    console.error('ERROR: AIGCTool ObjectType not found');
    await prisma.$disconnect();
    return;
  }

  // Load pricing data
  const pricingPath = path.join(__dirname, '../../data/pricing_data.json');
  const pricingRaw = fs.readFileSync(pricingPath, 'utf-8');
  const pricingData = JSON.parse(pricingRaw).data as PricingData[];
  const pricingByRid = new Map(pricingData.map((p: PricingData) => [p.toolRid, p]));
  console.log(`Loaded ${pricingData.length} pricing records`);

  // Load context window data
  const contextPath = path.join(__dirname, '../../data/context_window_data.json');
  const contextRaw = fs.readFileSync(contextPath, 'utf-8');
  const contextData = JSON.parse(contextRaw).data as ContextWindowData[];
  const contextByRid = new Map(contextData.map((c: ContextWindowData) => [c.toolRid, c]));
  console.log(`Loaded ${contextData.length} context window records`);

  const tools = await prisma.objects.findMany({
    where: {
      objectTypeId: aigcToolType.id,
      status: 'active'
    }
  });

  console.log(`Found ${tools.length} tools to enrich\n`);

  let enriched = 0;
  let skipped = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const props = (tool.properties as Record<string, any>) || {};
    const rid = tool.rid;

    const pricing = pricingByRid.get(rid);
    const context = contextByRid.get(rid);

    if (!pricing && !context) {
      skipped++;
      continue;
    }

    const newProps = {
      ...props,
      ...(pricing && {
        inputPrice: pricing.inputPrice,
        outputPrice: pricing.outputPrice,
        pricingModel: pricing.pricingModel,
      }),
      ...(context && {
        contextWindow: context.contextWindow,
        maxOutputTokens: context.maxOutputTokens,
      }),
      // Generate simulated ratings and heat if not present
      ...(props.averageRating === undefined && {
        averageRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 500) + 10,
      }),
      ...(props.heatScore === undefined && {
        heatScore: Math.round((20 + Math.random() * 80) * 100) / 100,
        viewCount: Math.floor(Math.random() * 10000) + 100,
      }),
      // Ensure required arrays exist
      capabilities: props.capabilities || [],
      modalities: props.modalities || [],
      supportedModalities: props.supportedModalities || props.modalities || [],
      platforms: props.platforms || [],
      platform: props.platform || props.platforms || [],
      availableInChina: props.availableInChina ?? true,
      openaiCompatible: props.openaiCompatible ?? false,
    };

    await prisma.objects.update({
      where: { id: tool.id },
      data: { properties: newProps }
    });

    enriched++;

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${tools.length} (enriched: ${enriched}, skipped: ${skipped})`);
    }
  }

  console.log(`\n✅ Enrichment complete:`);
  console.log(`   - Enriched: ${enriched} tools`);
  console.log(`   - Skipped: ${skipped} tools (no matching data)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
