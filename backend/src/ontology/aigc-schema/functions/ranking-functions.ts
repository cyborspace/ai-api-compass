/**
 * Ranking System Functions
 * 
 * 排名系统相关的 Ontology Functions
 * 对标 ranking-calculator.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: getCompositeRankings
 * 获取综合榜排名
 */
export const getCompositeRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-composite-rankings',
  apiName: 'getCompositeRankings',
  displayName: '综合榜',
  description: '获取AI工具的综合排名列表，考虑性能、价格、热度等多维度指标',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'perspective',
      displayName: '计算视角',
      description: '排名计算视角: default, performance, value, community',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
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
      defaultValue: 20
    },
    {
      apiName: 'offset',
      displayName: '偏移量',
      description: '分页偏移量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 0
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '综合排名列表结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'ToolCategory', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'composite', 'multi-dimensional'],
    cacheConfig: {
      enabled: true,
      ttl: 300 // 5分钟缓存
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getPerformanceRankings
 * 获取性能榜排名
 */
export const getPerformanceRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-performance-rankings',
  apiName: 'getPerformanceRankings',
  displayName: '性能榜',
  description: '获取以性能为核心指标的AI工具排名',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
      defaultValue: 20
    },
    {
      apiName: 'offset',
      displayName: '偏移量',
      description: '分页偏移量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 0
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '性能榜排名列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TechnicalSpec', 'Benchmark'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'performance', 'benchmark'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getValueRankings
 * 获取性价比榜排名
 */
export const getValueRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-value-rankings',
  apiName: 'getValueRankings',
  displayName: '性价比榜',
  description: '获取以性价比为核心指标的AI工具排名',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
      defaultValue: 20
    },
    {
      apiName: 'offset',
      displayName: '偏移量',
      description: '分页偏移量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 0
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '性价比榜排名列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'PricingPlan'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'value', 'price-performance'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getQualityRankings
 * 获取质量榜排名
 */
export const getQualityRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-quality-rankings',
  apiName: 'getQualityRankings',
  displayName: '质量榜',
  description: '获取以输出质量和准确率为核心指标的AI工具排名',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
      defaultValue: 20
    },
    {
      apiName: 'offset',
      displayName: '偏移量',
      description: '分页偏移量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 0
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '质量榜排名列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'UserReview', 'Benchmark'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'quality', 'rating'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getPopularityRankings
 * 获取热度榜排名
 */
export const getPopularityRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-popularity-rankings',
  apiName: 'getPopularityRankings',
  displayName: '热度榜',
  description: '获取以用户热度、点击量、评价为核心指标的AI工具排名',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
      defaultValue: 20
    },
    {
      apiName: 'offset',
      displayName: '偏移量',
      description: '分页偏移量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 0
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '热度榜排名列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'popularity', 'trending'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getRisingRankings
 * 获取新兴榜排名
 */
export const getRisingRankingsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-rising-rankings',
  apiName: 'getRisingRankings',
  displayName: '新兴榜',
  description: '获取近期热度上升最快的AI工具排名',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'perspective',
      displayName: '计算视角',
      description: '排名计算视角',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      description: '最大返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 20
    },
    {
      apiName: 'days',
      displayName: '统计周期',
      description: '统计周期(天)',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 7
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '新兴榜排名列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'rising', 'trending'],
    cacheConfig: {
      enabled: true,
      ttl: 600 // 10分钟缓存
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getToolRankingDetail
 * 获取工具排名详情
 */
export const getToolRankingDetailFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-tool-ranking-detail',
  apiName: 'getToolRankingDetail',
  displayName: '工具排名详情',
  description: '获取指定工具的详细排名信息，包括历史排名、百分位等',
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
      description: '排名计算视角',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'default'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '工具排名详情'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric', 'UserReview'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'detail', 'history'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getRankingCategories
 * 获取排名分类列表
 */
export const getRankingCategoriesFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-ranking-categories',
  apiName: 'getRankingCategories',
  displayName: '排名分类',
  description: '获取所有可用的排名分类列表',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [],
  
  returnType: {
    dataType: { type: 'list' },
    description: '排名分类列表'
  },
  
  boundObjectTypes: ['ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'ranking',
    tags: ['rankings', 'categories']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Ranking Functions
 */
export const rankingFunctions: FunctionV2[] = [
  getCompositeRankingsFunction,
  getPerformanceRankingsFunction,
  getValueRankingsFunction,
  getQualityRankingsFunction,
  getPopularityRankingsFunction,
  getRisingRankingsFunction,
  getToolRankingDetailFunction,
  getRankingCategoriesFunction
];
