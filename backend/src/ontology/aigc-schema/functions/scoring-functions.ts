/**
 * Scoring System Functions
 * 
 * 评分系统相关的 Ontology Functions
 * 对标 composite-scorer.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: calculateToolScore
 * 计算工具综合评分
 */
export const calculateToolScoreFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.calculate-tool-score',
  apiName: 'calculateToolScore',
  displayName: '计算工具评分',
  description: '计算工具的综合评分，考虑多维度指标',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具标识',
      description: '工具slug',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'perspective',
      displayName: '计算视角',
      description: '评分计算视角: default, performance, value, community',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '评分计算结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'PricingPlan', 'UserReview', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['score', 'calculation', 'composite'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getScoreBreakdown
 * 获取评分分解
 */
export const getScoreBreakdownFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-score-breakdown',
  apiName: 'getScoreBreakdown',
  displayName: '评分分解',
  description: '获取工具评分的详细分解，了解各维度贡献',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具标识',
      description: '工具slug',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'perspective',
      displayName: '计算视角',
      description: '评分计算视角',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '评分分解详情'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'PricingPlan', 'UserReview', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['score', 'breakdown', 'dimension'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getPerspectiveConfig
 * 获取视角权重配置
 */
export const getPerspectiveConfigFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-perspective-config',
  apiName: 'getPerspectiveConfig',
  displayName: '视角权重配置',
  description: '获取指定视角的评分权重配置',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'perspective',
      displayName: '视角类型',
      description: '视角类型: default, performance, value, community',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '视角权重配置'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['perspective', 'weights', 'config']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getAllPerspectives
 * 获取所有评分视角
 */
export const getAllPerspectivesFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-all-perspectives',
  apiName: 'getAllPerspectives',
  displayName: '所有评分视角',
  description: '获取所有可用的评分视角及其权重配置',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [],
  
  returnType: {
    dataType: { type: 'list' },
    description: '评分视角列表'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['perspective', 'weights', 'config']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: extractToolDimensions
 * 提取工具评分维度
 */
export const extractToolDimensionsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.extract-tool-dimensions',
  apiName: 'extractToolDimensions',
  displayName: '提取评分维度',
  description: '从工具数据中提取用于评分的各维度指标',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具标识',
      description: '工具slug',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '工具评分维度'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'PricingPlan', 'UserReview', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['dimensions', 'metrics', 'extract'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: compareToolScores
 * 对比工具评分
 */
export const compareToolScoresFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.compare-tool-scores',
  apiName: 'compareToolScores',
  displayName: '对比工具评分',
  description: '对比多个工具的评分和各项维度得分',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlugs',
      displayName: '工具列表',
      description: '要对比的工具slug列表',
      dataType: { type: 'list' },
      required: true
    },
    {
      apiName: 'perspective',
      displayName: '计算视角',
      description: '评分计算视角',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '工具评分对比结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'PricingPlan', 'UserReview', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['score', 'compare', 'comparison'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getDimensionLeader
 * 获取维度领先者
 */
export const getDimensionLeaderFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-dimension-leader',
  apiName: 'getDimensionLeader',
  displayName: '维度领先者',
  description: '获取在指定维度上评分最高的工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'dimension',
      displayName: '维度名称',
      description: '维度名称: benchmarkQuality, contextWindow, pricingValue, lmsysElo, etc.',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'category',
      displayName: '分类筛选',
      description: '按工具分类slug筛选',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      description: '最大返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 10
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '维度领先的工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'PricingPlan'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'scoring',
    tags: ['score', 'leader', 'dimension'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Scoring Functions
 */
export const scoringFunctions: FunctionV2[] = [
  calculateToolScoreFunction,
  getScoreBreakdownFunction,
  getPerspectiveConfigFunction,
  getAllPerspectivesFunction,
  extractToolDimensionsFunction,
  compareToolScoresFunction,
  getDimensionLeaderFunction
];
