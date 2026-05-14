import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { aigcOntologyManifest } from './ontology/aigc-schema/ontology-manifest.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Initializing AI API Compass Ontology...\n');

  console.log('1. Creating ObjectTypes...');
  for (const ot of aigcOntologyManifest.objectTypes) {
    const existing = await prisma.object_types.findUnique({ where: { apiName: ot.apiName } });
    if (existing) {
      console.log(`   [SKIP] ${ot.apiName} (already exists)`);
      continue;
    }

    await prisma.object_types.create({
      data: {
        id: `ot-${Date.now()}-${ot.apiName.toLowerCase()}`,
        rid: ot.rid,
        apiName: ot.apiName,
        displayName: ot.displayName,
        description: ot.description || '',
        status: ot.status.toLowerCase(),
        icon: ot.icon?.blueprint?.name,
        color: ot.icon?.blueprint?.color,
        primaryKeys: [ot.primaryKey],
        titleKeys: [ot.titleProperty],
        properties: Object.entries(ot.properties || {}).map(([key, prop]: [string, any]) => ({
          apiName: key,
          displayName: prop.displayName,
          description: prop.description,
          baseType: prop.dataType.type,
        })),
        updatedAt: new Date(),
      },
    });
    console.log(`   [CREATED] ${ot.apiName}`);
  }

  console.log('\n2. Creating LinkTypes...');
  for (const lt of aigcOntologyManifest.linkTypes) {
    const existing = await prisma.link_types.findUnique({ where: { apiName: lt.apiName } });
    if (existing) {
      console.log(`   [SKIP] ${lt.apiName} (already exists)`);
      continue;
    }

    const sourceType = await prisma.object_types.findUnique({ where: { apiName: lt.sourceObjectTypeApiName } });
    const targetType = await prisma.object_types.findUnique({ where: { apiName: lt.targetObjectTypeApiName } });

    if (!sourceType || !targetType) {
      console.log(`   [SKIP] ${lt.apiName} (source/target type not found)`);
      continue;
    }

    await prisma.link_types.create({
      data: {
        id: `lt-${Date.now()}-${lt.apiName.toLowerCase()}`,
        rid: lt.rid,
        apiName: lt.apiName,
        displayName: lt.displayName,
        description: lt.description || '',
        status: lt.status.toLowerCase(),
        visibility: lt.visibility.toLowerCase(),
        sourceObjectTypeId: sourceType.id,
        targetObjectTypeId: targetType.id,
        cardinality: lt.cardinality,
        updatedAt: new Date(),
      },
    });
    console.log(`   [CREATED] ${lt.apiName}`);
  }

  console.log('\n3. Creating ValueTypes...');
  for (const vt of aigcOntologyManifest.valueTypes) {
    const existing = await prisma.value_types.findUnique({ where: { apiName: vt.apiName } });
    if (existing) {
      console.log(`   [SKIP] ${vt.apiName} (already exists)`);
      continue;
    }

    await prisma.value_types.create({
      data: {
        id: `vtype-${Date.now()}-${vt.apiName.toLowerCase()}`,
        rid: vt.rid,
        apiName: vt.apiName,
        displayName: vt.displayName,
        description: vt.description || '',
        baseType: vt.baseType,
        constraints: vt.constraints || {},
        status: 'active',
        updatedAt: new Date(),
      },
    });
    console.log(`   [CREATED] ${vt.apiName}`);
  }

  console.log('\n✅ Ontology initialization complete!');
  console.log('\nNext: Run npm run db:seed to populate with tool data');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
