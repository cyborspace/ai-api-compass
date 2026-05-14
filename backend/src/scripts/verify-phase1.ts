/**
 * Phase 1 数据丰富化验证脚本
 * 验证定价、上下文窗口、能力标签数据的完整性
 */

import fs from 'fs';
import path from 'path';

interface PricingData {
  toolRid: string;
  pricingModel: string;
  priceRange: string;
  inputPrice?: number;
  outputPrice?: number;
  source: string;
  confidence: number;
}

interface ContextWindowData {
  toolRid: string;
  contextWindow: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsFunctionCalling?: boolean;
  source: string;
  confidence: number;
}

interface CapabilitiesData {
  toolRid: string;
  capabilities: string[];
  modalities: string[];
  source: string;
}

interface VerificationResult {
  passed: boolean;
  metrics: {
    totalTools: number;
    pricingModelCoverage: number;
    priceRangeCoverage: number;
    contextWindowCoverage: number;
    capabilitiesCoverage: number;
    sourceTagCoverage: number;
  };
  details: {
    pricingSourceDistribution: Record<string, number>;
    contextWindowDistribution: Record<string, number>;
    capabilitiesDistribution: Record<string, number>;
  };
}

function loadDataFiles(): {
  pricing: PricingData[];
  context: ContextWindowData[];
  capabilities: CapabilitiesData[];
} {
  // 数据文件在 backend/data 目录下
  const dataDir = path.join(process.cwd(), 'data');

  const pricingPath = path.join(dataDir, 'pricing_data.json');
  const contextPath = path.join(dataDir, 'context_window_data.json');
  const capabilitiesPath = path.join(dataDir, 'capabilities_data.json');

  const pricingRaw = fs.existsSync(pricingPath)
    ? JSON.parse(fs.readFileSync(pricingPath, 'utf-8'))
    : { data: [] };

  const contextRaw = fs.existsSync(contextPath)
    ? JSON.parse(fs.readFileSync(contextPath, 'utf-8'))
    : { data: [] };

  const capabilitiesRaw = fs.existsSync(capabilitiesPath)
    ? JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'))
    : { data: [] };

  // 数据可能在 data 字段内，也可能直接是数组
  const pricing: PricingData[] = Array.isArray(pricingRaw) ? pricingRaw : (pricingRaw.data || []);
  const context: ContextWindowData[] = Array.isArray(contextRaw) ? contextRaw : (contextRaw.data || []);
  const capabilities: CapabilitiesData[] = Array.isArray(capabilitiesRaw) ? capabilitiesRaw : (capabilitiesRaw.data || []);

  return { pricing, context, capabilities };
}

function verifyPhase1(): VerificationResult {
  const { pricing, context, capabilities } = loadDataFiles();

  const totalTools = pricing.length;
  const metrics = {
    totalTools,
    pricingModelCoverage: 0,
    priceRangeCoverage: 0,
    contextWindowCoverage: 0,
    capabilitiesCoverage: 0,
    sourceTagCoverage: 0,
  };

  const details = {
    pricingSourceDistribution: {} as Record<string, number>,
    contextWindowDistribution: {} as Record<string, number>,
    capabilitiesDistribution: {} as Record<string, number>,
  };

  // 验证定价数据
  let pricingModelCount = 0;
  let priceRangeCount = 0;
  let pricingSourceCount = 0;

  for (const item of pricing) {
    if (item.pricingModel) pricingModelCount++;
    if (item.priceRange) priceRangeCount++;
    if (item.source) {
      pricingSourceCount++;
      details.pricingSourceDistribution[item.source] =
        (details.pricingSourceDistribution[item.source] || 0) + 1;
    }
  }

  metrics.pricingModelCoverage = (pricingModelCount / totalTools) * 100;
  metrics.priceRangeCoverage = (priceRangeCount / totalTools) * 100;

  // 验证上下文窗口数据
  let contextWindowCount = 0;
  let contextSourceCount = 0;

  for (const item of context) {
    if (item.contextWindow && item.contextWindow >= 1000 && item.contextWindow <= 1000000) {
      contextWindowCount++;
    }
    if (item.source) {
      contextSourceCount++;
      details.contextWindowDistribution[item.source] =
        (details.contextWindowDistribution[item.source] || 0) + 1;
    }
  }

  metrics.contextWindowCoverage = (contextWindowCount / context.length) * 100;

  // 验证能力标签数据
  let capabilitiesCount = 0;
  let capabilitiesSourceCount = 0;

  for (const item of capabilities) {
    if (item.capabilities && item.capabilities.length >= 1) {
      capabilitiesCount++;
    }
    if (item.source) {
      capabilitiesSourceCount++;
      details.capabilitiesDistribution[item.source] =
        (details.capabilitiesDistribution[item.source] || 0) + 1;
    }
  }

  metrics.capabilitiesCoverage = (capabilitiesCount / capabilities.length) * 100;
  metrics.sourceTagCoverage = ((pricingSourceCount + contextSourceCount + capabilitiesSourceCount) /
    (totalTools * 3)) * 100;

  // 判断是否通过
  const passed =
    metrics.pricingModelCoverage >= 100 &&
    metrics.priceRangeCoverage >= 90 &&
    metrics.contextWindowCoverage >= 80 &&
    metrics.capabilitiesCoverage >= 100 &&
    metrics.sourceTagCoverage >= 100;

  return { passed, metrics, details };
}

function printReport(result: VerificationResult) {
  console.log('\n==================================');
  console.log('Phase 1 Verification Results');
  console.log('==================================\n');

  console.log(`工具总数: ${result.metrics.totalTools}\n`);

  console.log('定价数据:');
  console.log(`  - 有 pricingModel: ${result.metrics.pricingModelCoverage.toFixed(1)}% ${result.metrics.pricingModelCoverage >= 100 ? '✓' : '✗'}`);
  console.log(`  - 有 priceRange: ${result.metrics.priceRangeCoverage.toFixed(1)}% ${result.metrics.priceRangeCoverage >= 90 ? '✓' : '✗'}`);

  console.log('\n上下文窗口:');
  console.log(`  - 有 contextWindow: ${result.metrics.contextWindowCoverage.toFixed(1)}% ${result.metrics.contextWindowCoverage >= 80 ? '✓' : '✗'}`);

  console.log('\n能力标签:');
  console.log(`  - 有 capabilities: ${result.metrics.capabilitiesCoverage.toFixed(1)}% ${result.metrics.capabilitiesCoverage >= 100 ? '✓' : '✗'}`);

  console.log('\n数据来源:');
  console.log('  定价数据来源分布:');
  for (const [source, count] of Object.entries(result.details.pricingSourceDistribution)) {
    const percentage = ((count / result.metrics.totalTools) * 100).toFixed(1);
    console.log(`    - ${source}: ${count} (${percentage}%)`);
  }

  console.log('\n  上下文窗口数据来源分布:');
  for (const [source, count] of Object.entries(result.details.contextWindowDistribution)) {
    const percentage = ((count / result.metrics.totalTools) * 100).toFixed(1);
    console.log(`    - ${source}: ${count} (${percentage}%)`);
  }

  console.log('\n==================================');
  console.log(`VERIFICATION: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log('==================================\n');

  return result.passed;
}

// 执行验证
const result = verifyPhase1();
const passed = printReport(result);
process.exit(passed ? 0 : 1);
