#!/usr/bin/env node

/**
 * Run AIGC Seed Data
 */

import { seedAIGCData } from './src/seed/aigc.seed';

console.log('🚀 开始运行 AIGC Seed 数据...\n');

seedAIGCData()
  .then(() => {
    console.log('\n✅ Seed 数据运行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed 数据运行失败:', error);
    process.exit(1);
  });
