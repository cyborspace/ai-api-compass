/**
 * Capabilities 数据写入脚本
 * 读取 capabilities_data.json 并更新数据库中的 objects.properties
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const capabilitiesPath = path.join(__dirname, '../../data/capabilities_data.json');
  const raw = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'));
  const capData = Array.isArray(raw) ? raw : (raw.data || raw.capabilities || []);

  console.log(`Loaded ${capData.length} capability records`);

  let updated = 0;
  let skipped = 0;

  for (const entry of capData) {
    const { toolRid, slug, name, capabilities, modalities } = entry;

    const where: any = {};
    if (toolRid) {
      where.rid = toolRid;
    } else if (slug) {
      where.slug = slug;
    } else {
      skipped++;
      continue;
    }

    let obj;
    if (where.rid) {
      obj = await prisma.objects.findFirst({ where: { rid: where.rid } });
    } else {
      const found = await prisma.objects.findMany({
        where: { objectTypeId: 'AIGCTool' },
        take: 300,
      });
      obj = found.find(o => {
        const props = o.properties as any;
        return props.slug === where.slug || props.name === name;
      });
    }

    if (!obj) {
      const altSearch = await prisma.objects.findFirst({
        where: {
          objectTypeId: 'AIGCTool',
          properties: {
            path: ['name'],
            equals: name || slug || toolRid,
          },
        },
      });
      if (!altSearch) {
        skipped++;
        continue;
      }
      obj = altSearch;
    }

    const props = obj.properties as any;

    const hasCaps = Array.isArray(props.capabilities) && props.capabilities.length > 0;
    const hasMods = Array.isArray(props.modalities) && props.modalities.length > 0;

    if (hasCaps && hasMods) {
      skipped++;
      continue;
    }

    const newCaps = capabilities || props.capabilities || [];
    const newMods = modalities || props.modalities || [];

    await prisma.objects.update({
      where: {
        objectTypeId_rid: {
          objectTypeId: obj.objectTypeId,
          rid: obj.rid,
        },
      },
      data: {
        properties: {
          ...props,
          capabilities: [...new Set([...newCaps, ...(props.capabilities || [])])],
          modalities: [...new Set([...newMods, ...(props.modalities || [])])],
          supportedModalities: [...new Set([...newMods, ...(props.supportedModalities || [])])],
        },
      },
    });

    updated++;
    if (updated % 50 === 0) {
      console.log(`  Progress: ${updated} tools updated`);
    }
  }

  console.log(`\n✅ Capability update complete:`);
  console.log(`   - Updated: ${updated} tools`);
  console.log(`   - Skipped: ${skipped} tools`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());