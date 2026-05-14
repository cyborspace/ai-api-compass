/**
 * Phase 3 动力层验证脚本
 * 验证评分系统、排名算法、推荐系统
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
  rating: {
    backend: FileCheck[];
    frontend: FileCheck[];
  };
  ranking: {
    backend: FileCheck[];
  };
  recommendation: {
    backend: FileCheck[];
    frontend: FileCheck[];
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

function verifyPhase3(): VerificationResult {
  const workspacePath = '/sessions/69fee16482d70e470132c623/workspace';
  const frontendPath = path.join(workspacePath, 'frontend');
  const backendPath = path.join(workspacePath, 'backend');

  // 评分系统 - 后端
  const ratingBackendFiles = [
    'src/services/rating-service.ts',
    'src/services/anti-spam.ts',
    'src/routes/ratings.routes.ts',
  ];

  // 评分系统 - 前端
  const ratingFrontendFiles = [
    'src/components/rating/StarRating.tsx',
    'src/components/rating/RatingDisplay.tsx',
    'src/components/rating/RatingModal.tsx',
    'src/components/rating/index.ts',
  ];

  // 排名算法 - 后端
  const rankingBackendFiles = [
    'src/services/ranking/ranking-calculator.ts',
    'src/services/ranking/composite-scorer.ts',
    'src/services/ranking/anti-gaming.ts',
    'src/services/ranking/ranking-scheduler.ts',
    'src/routes/rankings.routes.ts',
  ];

  // 推荐系统 - 后端
  const recommendationBackendFiles = [
    'src/services/recommendation/rec-engine.ts',
    'src/services/recommendation/scenario-match.ts',
    'src/routes/recommendations.routes.ts',
  ];

  // 推荐系统 - 前端
  const recommendationFrontendFiles = [
    'components/recommendation/RecommendationPanel.tsx',
    'components/recommendation/ScenarioInput.tsx',
    'components/recommendation/index.ts',
  ];

  const rating = {
    backend: ratingBackendFiles.map(f => checkFile(backendPath, f)),
    frontend: ratingFrontendFiles.map(f => checkFile(frontendPath, f)),
  };

  const ranking = {
    backend: rankingBackendFiles.map(f => checkFile(backendPath, f)),
  };

  const recommendation = {
    backend: recommendationBackendFiles.map(f => checkFile(backendPath, f)),
    frontend: recommendationFrontendFiles.map(f => checkFile(frontendPath, f)),
  };

  const allFiles = [
    ...rating.backend,
    ...rating.frontend,
    ...ranking.backend,
    ...recommendation.backend,
    ...recommendation.frontend,
  ];

  const existingFiles = allFiles.filter(f => f.exists);
  const missingFiles = allFiles.filter(f => !f.exists).map(f => f.path);

  const passed = missingFiles.length === 0;

  return {
    passed,
    rating,
    ranking,
    recommendation,
    summary: {
      totalFiles: allFiles.length,
      existingFiles: existingFiles.length,
      missingFiles,
    },
  };
}

function printReport(result: VerificationResult) {
  console.log('\n==================================');
  console.log('Phase 3 Verification Results');
  console.log('==================================\n');

  console.log('评分系统 - 后端:');
  for (const file of result.rating.backend) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n评分系统 - 前端:');
  for (const file of result.rating.frontend) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n排名算法 - 后端:');
  for (const file of result.ranking.backend) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n推荐系统 - 后端:');
  for (const file of result.recommendation.backend) {
    console.log(`  ${file.exists ? '✓' : '✗'} ${file.path} ${file.size ? `(${file.size} bytes)` : ''}`);
  }

  console.log('\n推荐系统 - 前端:');
  for (const file of result.recommendation.frontend) {
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
const result = verifyPhase3();
const passed = printReport(result);
process.exit(passed ? 0 : 1);
