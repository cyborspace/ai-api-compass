/**
 * Full Ontology Seed Script (DEPRECATED)
 * 
 * ⚠️ 此文件已废弃，请使用 manifest-sync.ts
 * 
 * 原因：
 * 1. manifest-sync.ts 从 ontology-manifest.ts 同步所有组件（46 Functions 等）
 * 2. ontology-full.seed.ts 只包含部分组件（5 Functions）
 * 
 * Run: npx tsx src/seed/manifest-sync.ts
 * 
 * 保留此文件仅用于向后兼容，不建议使用
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkStatus() {
  console.log('=== Ontology Components Status ===\n');
  
  const objectTypes = await prisma.object_types.count();
  const objects = await prisma.objects.count();
  const linkTypes = await prisma.link_types.count();
  const links = await prisma.links.count();
  const valueTypes = await prisma.value_types.count();
  const actionTypes = await prisma.action_types.count();
  const functions = await prisma.functions.count();
  const interfaces = await prisma.interfaces.count();
  const sharedProperties = await prisma.shared_properties.count();
  
  console.log('Semantic Layer:');
  console.log(`  ✅ Object Types: ${objectTypes}`);
  console.log(`  ✅ Objects: ${objects}`);
  console.log(`  ✅ Link Types: ${linkTypes}`);
  console.log(`  ✅ Links: ${links}`);
  console.log(`  ${valueTypes > 0 ? '✅' : '❌'} Value Types: ${valueTypes}`);
  
  console.log('\nKinetic Layer:');
  console.log(`  ${actionTypes > 0 ? '✅' : '❌'} Action Types: ${actionTypes}`);
  console.log(`  ${functions > 0 ? '✅' : '❌'} Functions: ${functions}`);
  
  console.log('\nInterface Layer:');
  console.log(`  ${interfaces > 0 ? '✅' : '❌'} Interfaces: ${interfaces}`);
  console.log(`  ${sharedProperties > 0 ? '✅' : '❌'} Shared Properties: ${sharedProperties}`);
  
  return { objectTypes, objects, linkTypes, links, valueTypes, actionTypes, functions, interfaces, sharedProperties };
}

async function seedValueTypes() {
  console.log('\n\nSeeding Value Types...');
  
  const existing = await prisma.value_types.count();
  if (existing > 0) {
    console.log(`  Value Types already exist (${existing}), skipping.`);
    return;
  }
  
  const valueTypes = [
    { id: 'vt-rating', rid: 'ri.aigc.main.value-type.rating', apiName: 'Rating', displayName: '评分', description: '1-5星评分', baseType: 'integer', status: 'active', updatedAt: new Date() },
    { id: 'vt-price', rid: 'ri.aigc.main.value-type.price', apiName: 'Price', displayName: '价格', description: '价格（单位：分）', baseType: 'integer', status: 'active', updatedAt: new Date() },
    { id: 'vt-context-window', rid: 'ri.aigc.main.value-type.context-window', apiName: 'ContextWindow', displayName: '上下文窗口', description: '上下文窗口大小(tokens)', baseType: 'integer', status: 'active', updatedAt: new Date() },
    { id: 'vt-timestamp', rid: 'ri.aigc.main.value-type.timestamp', apiName: 'Timestamp', displayName: '时间戳', description: 'ISO8601时间戳', baseType: 'timestamp', status: 'active', updatedAt: new Date() },
    { id: 'vt-slug', rid: 'ri.aigc.main.value-type.slug', apiName: 'Slug', displayName: 'Slug', description: 'URL友好的唯一标识符', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'vt-rid', rid: 'ri.aigc.main.value-type.rid', apiName: 'Rid', displayName: 'RID', description: '资源标识符', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'vt-url', rid: 'ri.aigc.main.value-type.url', apiName: 'URL', displayName: 'URL', description: 'HTTP/HTTPS URL', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'vt-percentage', rid: 'ri.aigc.main.value-type.percentage', apiName: 'Percentage', displayName: '百分比', description: '0-100百分比', baseType: 'double', status: 'active', updatedAt: new Date() },
    { id: 'vt-token-price', rid: 'ri.aigc.main.value-type.token-price', apiName: 'TokenPrice', displayName: 'Token价格', description: '每1M Token价格(分)', baseType: 'double', status: 'active', updatedAt: new Date() },
    { id: 'vt-latency', rid: 'ri.aigc.main.value-type.latency', apiName: 'Latency', displayName: '延迟', description: '毫秒', baseType: 'integer', status: 'active', updatedAt: new Date() },
    { id: 'vt-throughput', rid: 'ri.aigc.main.value-type.throughput', apiName: 'Throughput', displayName: '吞吐量', description: 'Tokens/秒', baseType: 'integer', status: 'active', updatedAt: new Date() },
    { id: 'vt-version', rid: 'ri.aigc.main.value-type.version', apiName: 'SemanticVersion', displayName: '语义版本', description: '语义版本号', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'vt-score', rid: 'ri.aigc.main.value-type.score', apiName: 'Score', displayName: '评分', description: '0-100综合评分', baseType: 'double', status: 'active', updatedAt: new Date() },
  ];
  
  for (const vt of valueTypes) {
    await prisma.value_types.upsert({
      where: { apiName: vt.apiName },
      update: vt,
      create: vt,
    });
  }
  
  console.log(`  ✅ Created ${valueTypes.length} Value Types`);
}

async function seedActionTypes() {
  console.log('\nSeeding Action Types...');
  
  const existing = await prisma.action_types.count();
  if (existing > 0) {
    console.log(`  Action Types already exist (${existing}), skipping.`);
    return;
  }
  
  const actionTypes = [
    {
      id: 'at-submit-review',
      rid: 'ri.aigc.main.action-type.submit-review',
      apiName: 'submitReview',
      displayName: '提交评价',
      description: '用户提交对AI工具的评价',
      status: 'active',
      applicableObjectTypes: ['AIGCTool'],
      parameters: JSON.stringify([
        { apiName: 'toolRid', displayName: '工具RID', dataType: { type: 'string' }, required: true },
        { apiName: 'rating', displayName: '评分', dataType: { type: 'integer' }, required: true },
        { apiName: 'reviewContent', displayName: '评价内容', dataType: { type: 'string' }, required: false },
      ]),
      rules: JSON.stringify([]),
      submissionCriteria: JSON.stringify([
        { type: 'field required', field: 'toolRid' },
        { type: 'field required', field: 'rating' },
        { type: 'field comparison', field: 'rating', operator: 'gte', value: 1 },
        { type: 'field comparison', field: 'rating', operator: 'lte', value: 5 },
      ]),
      sideEffects: JSON.stringify([
        { type: 'notification', config: { message: 'New review submitted' } },
        { type: 'webhook', url: process.env.SLACK_WEBHOOK_URL },
      ]),
      permissions: JSON.stringify({}),
      updatedAt: new Date(),
    },
    {
      id: 'at-compare-tools',
      rid: 'ri.aigc.main.action-type.compare-tools',
      apiName: 'compareTools',
      displayName: '对比工具',
      description: '对比多个AI工具的能力和价格',
      status: 'active',
      applicableObjectTypes: ['AIGCTool'],
      parameters: JSON.stringify([
        { apiName: 'toolSlugs', displayName: '工具列表', dataType: { type: 'list' }, required: true },
        { apiName: 'comparisonType', displayName: '对比类型', dataType: { type: 'string' }, required: false },
      ]),
      rules: JSON.stringify([]),
      submissionCriteria: JSON.stringify([
        { type: 'field required', field: 'toolSlugs' },
      ]),
      sideEffects: JSON.stringify([]),
      permissions: JSON.stringify({}),
      updatedAt: new Date(),
    },
    {
      id: 'at-track-event',
      rid: 'ri.aigc.main.action-type.track-event',
      apiName: 'trackEvent',
      displayName: '追踪事件',
      description: '记录用户行为事件',
      status: 'active',
      applicableObjectTypes: ['AIGCTool'],
      parameters: JSON.stringify([
        { apiName: 'toolRid', displayName: '工具RID', dataType: { type: 'string' }, required: true },
        { apiName: 'eventType', displayName: '事件类型', dataType: { type: 'string' }, required: true },
      ]),
      rules: JSON.stringify([]),
      submissionCriteria: JSON.stringify([]),
      sideEffects: JSON.stringify([]),
      permissions: JSON.stringify({}),
      updatedAt: new Date(),
    },
    {
      id: 'at-calculate-heat',
      rid: 'ri.aigc.main.action-type.calculate-heat',
      apiName: 'calculateHeat',
      displayName: '计算热度',
      description: '计算工具的热度分数',
      status: 'active',
      applicableObjectTypes: ['AIGCTool'],
      parameters: JSON.stringify([
        { apiName: 'toolRid', displayName: '工具RID', dataType: { type: 'string' }, required: false },
        { apiName: 'period', displayName: '周期', dataType: { type: 'string' }, required: false },
      ]),
      rules: JSON.stringify([]),
      submissionCriteria: JSON.stringify([]),
      sideEffects: JSON.stringify([]),
      permissions: JSON.stringify({ adminOnly: true }),
      updatedAt: new Date(),
    },
  ];
  
  for (const at of actionTypes) {
    await prisma.action_types.upsert({
      where: { apiName: at.apiName },
      update: at,
      create: at,
    });
  }
  
  console.log(`  ✅ Created ${actionTypes.length} Action Types`);
}

async function seedFunctions() {
  console.log('\nSeeding Functions...');
  
  const existing = await prisma.functions.count();
  if (existing > 0) {
    console.log(`  Functions already exist (${existing}), skipping.`);
    return;
  }
  
  const functions = [
    // Search Functions
    {
      id: 'fn-search-tools',
      rid: 'ri.aigc.main.function.search-tools',
      apiName: 'searchTools',
      displayName: '搜索工具',
      description: '搜索AI工具',
      status: 'active',
      language: 'TYPESCRIPT',
      executionMode: 'SERVERLESS',
      parameters: JSON.stringify([
        { apiName: 'query', displayName: '搜索词', dataType: { type: 'string' }, required: true },
        { apiName: 'category', displayName: '分类', dataType: { type: 'string' }, required: false },
        { apiName: 'limit', displayName: '限制', dataType: { type: 'integer' }, required: false },
      ]),
      returnType: JSON.stringify({ type: 'list', objectTypeApiName: 'AIGCTool' }),
      boundObjectTypes: ['AIGCTool'],
      version: 1,
      timeoutMs: 30000,
      performsEdits: false,
      updatedAt: new Date(),
    },
    // Recommendation Functions
    {
      id: 'fn-get-similar-tools',
      rid: 'ri.aigc.main.function.get-similar-tools',
      apiName: 'getSimilarTools',
      displayName: '相似工具',
      description: '获取相似工具推荐',
      status: 'active',
      language: 'TYPESCRIPT',
      executionMode: 'SERVERLESS',
      parameters: JSON.stringify([
        { apiName: 'toolRid', displayName: '工具RID', dataType: { type: 'string' }, required: true },
        { apiName: 'limit', displayName: '限制', dataType: { type: 'integer' }, required: false },
      ]),
      returnType: JSON.stringify({ type: 'list', objectTypeApiName: 'AIGCTool' }),
      boundObjectTypes: ['AIGCTool', 'ToolCategory'],
      version: 1,
      timeoutMs: 30000,
      performsEdits: false,
      updatedAt: new Date(),
    },
    {
      id: 'fn-compare-tools',
      rid: 'ri.aigc.main.function.compare-tools',
      apiName: 'compareTools',
      displayName: '对比工具',
      description: '对比多个工具的多维度指标',
      status: 'active',
      language: 'TYPESCRIPT',
      executionMode: 'SERVERLESS',
      parameters: JSON.stringify([
        { apiName: 'toolSlugs', displayName: '工具列表', dataType: { type: 'list' }, required: true },
      ]),
      returnType: JSON.stringify({ type: 'object' }),
      boundObjectTypes: ['AIGCTool'],
      version: 1,
      timeoutMs: 30000,
      performsEdits: false,
      updatedAt: new Date(),
    },
    // Ranking Functions
    {
      id: 'fn-get-rankings',
      rid: 'ri.aigc.main.function.get-rankings',
      apiName: 'getRankings',
      displayName: '获取排名',
      description: '获取AI工具排名列表',
      status: 'active',
      language: 'TYPESCRIPT',
      executionMode: 'SERVERLESS',
      parameters: JSON.stringify([
        { apiName: 'type', displayName: '排名类型', dataType: { type: 'string' }, required: false },
        { apiName: 'perspective', displayName: '视角', dataType: { type: 'string' }, required: false },
        { apiName: 'limit', displayName: '限制', dataType: { type: 'integer' }, required: false },
      ]),
      returnType: JSON.stringify({ type: 'list' }),
      boundObjectTypes: ['AIGCTool', 'TrendMetric'],
      version: 1,
      timeoutMs: 30000,
      performsEdits: false,
      updatedAt: new Date(),
    },
    // Heat Functions
    {
      id: 'fn-get-hot-tools',
      rid: 'ri.aigc.main.function.get-hot-tools',
      apiName: 'getHotTools',
      displayName: '热门工具',
      description: '获取热门工具列表',
      status: 'active',
      language: 'TYPESCRIPT',
      executionMode: 'SERVERLESS',
      parameters: JSON.stringify([
        { apiName: 'period', displayName: '周期', dataType: { type: 'string' }, required: false },
        { apiName: 'limit', displayName: '限制', dataType: { type: 'integer' }, required: false },
      ]),
      returnType: JSON.stringify({ type: 'list', objectTypeApiName: 'AIGCTool' }),
      boundObjectTypes: ['AIGCTool', 'TrendMetric'],
      version: 1,
      timeoutMs: 10000,
      performsEdits: false,
      updatedAt: new Date(),
    },
  ];
  
  for (const fn of functions) {
    await prisma.functions.upsert({
      where: { apiName: fn.apiName },
      update: fn as any,
      create: fn as any,
    });
  }
  
  console.log(`  ✅ Created ${functions.length} Functions`);
}

async function seedInterfaces() {
  console.log('\nSeeding Interfaces...');
  
  const existing = await prisma.interfaces.count();
  if (existing > 0) {
    console.log(`  Interfaces already exist (${existing}), skipping.`);
    return;
  }
  
  const interfaces = [
    {
      id: 'if-searchable',
      rid: 'ri.aigc.main.interface.searchable',
      apiName: 'Searchable',
      displayName: '可搜索',
      description: '支持搜索的实体接口',
      status: 'experimental',
      icon: 'Search',
      color: '#6366f1',
      sharedProperties: JSON.stringify([
        { apiName: 'name', displayName: '名称', baseType: 'string' },
        { apiName: 'description', displayName: '描述', baseType: 'string' },
      ]),
      interfaceLinkTypes: JSON.stringify([]),
      extendedInterfaces: [],
      updatedAt: new Date(),
    },
    {
      id: 'if-rateable',
      rid: 'ri.aigc.main.interface.rateable',
      apiName: 'Rateable',
      displayName: '可评分',
      description: '支持用户评分的实体接口',
      status: 'experimental',
      icon: 'Star',
      color: '#f59e0b',
      sharedProperties: JSON.stringify([
        { apiName: 'averageRating', displayName: '平均评分', baseType: 'double' },
        { apiName: 'reviewCount', displayName: '评价数', baseType: 'integer' },
      ]),
      interfaceLinkTypes: JSON.stringify([]),
      extendedInterfaces: [],
      updatedAt: new Date(),
    },
    {
      id: 'if-trendable',
      rid: 'ri.aigc.main.interface.trendable',
      apiName: 'Trendable',
      displayName: '可追踪趋势',
      description: '支持趋势追踪的实体接口',
      status: 'experimental',
      icon: 'TrendingUp',
      color: '#10b981',
      sharedProperties: JSON.stringify([
        { apiName: 'viewCount', displayName: '浏览量', baseType: 'integer' },
        { apiName: 'favoriteCount', displayName: '收藏数', baseType: 'integer' },
      ]),
      interfaceLinkTypes: JSON.stringify([]),
      extendedInterfaces: JSON.stringify([]),
      updatedAt: new Date(),
    },
    {
      id: 'if-pricing',
      rid: 'ri.aigc.main.interface.pricing',
      apiName: 'Pricing',
      displayName: '有定价',
      description: '支持定价信息的实体接口',
      status: 'experimental',
      icon: 'CreditCard',
      color: '#ef4444',
      sharedProperties: JSON.stringify([
        { apiName: 'pricingModel', displayName: '定价模式', baseType: 'string' },
        { apiName: 'inputPrice', displayName: '输入价格', baseType: 'double' },
      ]),
      interfaceLinkTypes: JSON.stringify([]),
      extendedInterfaces: JSON.stringify([]),
      updatedAt: new Date(),
    },
  ];
  
  for (const iface of interfaces) {
    await prisma.interfaces.upsert({
      where: { apiName: iface.apiName },
      update: iface as any,
      create: iface as any,
    });
  }
  
  console.log(`  ✅ Created ${interfaces.length} Interfaces`);
}

async function seedSharedProperties() {
  console.log('\nSeeding Shared Properties...');
  
  const existing = await prisma.shared_properties.count();
  if (existing > 0) {
    console.log(`  Shared Properties already exist (${existing}), skipping.`);
    return;
  }
  
  const sharedProperties = [
    { id: 'sp-name', rid: 'ri.aigc.main.shared-property.name', apiName: 'shared.name', displayName: '名称', description: '实体名称', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'sp-description', rid: 'ri.aigc.main.shared-property.description', apiName: 'shared.description', displayName: '描述', description: '实体描述', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'sp-slug', rid: 'ri.aigc.main.shared-property.slug', apiName: 'shared.slug', displayName: 'Slug', description: 'URL友好的唯一标识符', baseType: 'string', status: 'active', updatedAt: new Date() },
    { id: 'sp-created-at', rid: 'ri.aigc.main.shared-property.created-at', apiName: 'shared.createdAt', displayName: '创建时间', description: '创建时间戳', baseType: 'timestamp', status: 'active', updatedAt: new Date() },
    { id: 'sp-updated-at', rid: 'ri.aigc.main.shared-property.updated-at', apiName: 'shared.updatedAt', displayName: '更新时间', description: '最后更新时间戳', baseType: 'timestamp', status: 'active', updatedAt: new Date() },
    { id: 'sp-status', rid: 'ri.aigc.main.shared-property.status', apiName: 'shared.status', displayName: '状态', description: '实体状态', baseType: 'string', status: 'active', updatedAt: new Date() },
  ];
  
  for (const sp of sharedProperties) {
    await prisma.shared_properties.upsert({
      where: { apiName: sp.apiName },
      update: sp as any,
      create: sp as any,
    });
  }
  
  console.log(`  ✅ Created ${sharedProperties.length} Shared Properties`);
}

async function main() {
  console.log('Starting Full Ontology Seed...\n');
  
  // Check current status
  await checkStatus();
  
  // Seed missing components
  await seedValueTypes();
  await seedActionTypes();
  await seedFunctions();
  await seedInterfaces();
  await seedSharedProperties();
  
  // Final status check
  console.log('\n\n=== Final Status ===');
  await checkStatus();
  
  console.log('\n✅ Full Ontology Seed Complete!');
  
  await prisma.$disconnect();
}

main().catch(console.error);
