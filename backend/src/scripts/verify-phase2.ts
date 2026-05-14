/**
 * Phase 2 动态层验证脚本
 * 验证行为追踪 SDK、热度计算服务、UI 组件
 */

import fs from 'fs';
import path from 'path';

interface FileCheck {
  path: string;
  exists: boolean;
  size?: number;
}

interface VerificationResult {
  passed: boolean;
  frontend: {
    behaviorSdk: FileCheck[];
    uiComponents: FileCheck[];
  };
  backend: {
    services: FileCheck[];
    routes: FileCheck[];
  };
  summary: {
    totalFiles: number;
    existingFiles: number;
    missingFiles: string[];
  };
}

function checkFile(basePath: string, relativePath: string): FileCheck {
  const fullPath = path.join(basePath, relativePath);
  const exists = fs.existsSync(fullPath);
  return {
    path: relativePath,
    exists,
    size: exists ? fs.statSync(fullPath).size : undefined,
  };
}

function verifyPhase2(): VerificationResult {
  const workspacePath = '/sessions/69fee16482d70e470132c623/workspace';
  const frontendPath = path.join(workspacePath, 'frontend');
  const backendPath = path.join(workspacePath, 'backend');

  // 前端行为 SDK 文件
  const behaviorSdkFiles = [
    'lib/analytics/event-types.ts',
    'lib/analytics/session-manager.ts',
    'lib/analytics/behavior-collector.ts',
    'lib/analytics/index.ts',
    'hooks/useAnalytics.tsx',
  ];

  // 前端 UI 组件文件
  const uiComponentFiles = [
    'src/components/dynamic/HeatBadge.tsx',
    'src/components/dynamic/TrendIndicator.tsx',
    'src/components/dynamic/LiveViewers.tsx',
    'src/components/dynamic/ToolListHeatmap.tsx',
    'src/components/dynamic/index.ts',
  ];

  // 后端服务文件
  const serviceFiles = [
    'src/services/heat-calculator.ts',
    'src/services/heat-scheduler.ts',
    'src/lib/analytics/event-validator.ts',
  ];

  // 后端路由文件
  const routeFiles = [
    'src/routes/events.routes.ts',
  ];

  const frontend = {
    behaviorSdk: behaviorSdkFiles.map(f => checkFile(frontendPath, f)),
    uiComponents: uiComponentFiles.map(f => checkFile(frontendPath, f)),
  };

  const backend = {
    services: serviceFiles.map(f => checkFile(backendPath, f)),
    routes: routeFiles.map(f => checkFile(backendPath, f)),
  };

  const allFiles = [
    ...frontend.behaviorSdk,
    ...frontend.uiComponents,
    ...backend.services,
    ...backend.routes,
  ];

  const existingFiles = allFiles.filter(f => f.exists);
  const missingFiles = allFiles.filter(f => !f.exists).map(f => f.path);

  const passed = missingFiles.length === 0;

  return {
    passed,
    frontend,
    backend,
    summary: {
      totalFiles: allFiles.length,
      existingFiles: existingFiles.length,
      missingFiles,
    },
  };
}

function printReport(result: VerificationResult) {
  console.log('\n==================================');
  console.log('Phase 2 Verification Results');
  console.log('==================================\n');

  console.log('前端 - 行为追踪 SDK:');
  for (const file of result.frontend.behaviorSdk) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n前端 - UI 组件:');
  for (const file of result.frontend.uiComponents) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n后端 - 服务:');
  for (const file of result.backend.services) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n后端 - 路由:');
  for (const file of result.backend.routes) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n==================================');
  console.log(`文件统计: ${result.summary.existingFiles}/${result.summary.totalFiles} 存在`);

  if (result.summary.missingFiles.length > 0) {
    console.log('\n缺失文件:');
    for (const file of result.summary.missingFiles) {
      console.log(`  - ${file}`);
    }
  }

  console.log('\n==================================');
  console.log(`VERIFICATION: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log('==================================\n');

  return result.passed;
}

// 执行验证
const result = verifyPhase2();
const passed = printReport(result);
process.exit(passed ? 0 : 1);
