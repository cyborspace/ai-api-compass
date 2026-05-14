import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 测试数据库客户端
const connectionString = process.env.DATABASE_URL || 'postgresql://paulie@localhost:5432/ai_website_test';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});

// 清理测试数据
export async function cleanupDatabase() {
  const tables = [
    'actions',
    'links',
    'objects',
    'interface_implementations',
    'interfaces',
    'functions',
    'action_types',
    'shared_properties',
    'value_types',
    'link_types',
    'object_types',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE 1=1`);
  }
}

// 创建测试数据
export async function seedTestData() {
  // 创建对象类型
  const objectType = await prisma.object_types.create({
    data: {
      id: crypto.randomUUID(),
      rid: 'ot_test_provider',
      apiName: 'test-provider',
      displayName: 'Test Provider',
      description: 'Test provider for testing',
      status: 'active',
      primaryKeys: ['name'],
      titleKeys: ['name'],
      properties: [
        { apiName: 'name', displayName: 'Name', baseType: 'String' },
        { apiName: 'websiteUrl', displayName: 'Website URL', baseType: 'String' },
      ],
      updatedAt: new Date(),
    },
  });

  // 创建对象实例
  const object = await prisma.objects.create({
    data: {
      id: crypto.randomUUID(),
      objectTypeId: objectType.id,
      rid: 'obj_test_provider_1',
      properties: {
        name: 'Test Provider',
        websiteUrl: 'https://test.com',
      },
      status: 'active',
      updatedAt: new Date(),
    },
  });

  return { objectType, object };
}
