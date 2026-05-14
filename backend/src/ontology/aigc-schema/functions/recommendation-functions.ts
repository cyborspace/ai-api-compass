/**
 * Recommendation System Functions
 * 
 * 推荐系统相关的 Ontology Functions
 * 对标 rec-engine.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: getHomeRecommendations
 * 获取首页推荐
 */
export const getHomeRecommendationsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-home-recommendations',
  apiName: 'getHomeRecommendations',
  displayName: '首页推荐',
  description: '获取首页推荐，混合热门工具、新兴工具和精选工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
    },
    {
      apiName: 'mixRatio',
      displayName: '混合比例',
      description: '热门/新兴/精选工具的混合比例',
      dataType: { type: 'object' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '首页推荐结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric', 'ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'home', 'mixed'],
    cacheConfig: {
      enabled: true,
      ttl: 120
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getSearchRecommendations
 * 获取搜索推荐
 */
export const getSearchRecommendationsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-search-recommendations',
  apiName: 'getSearchRecommendations',
  displayName: '搜索推荐',
  description: '基于搜索词获取推荐，结合相关度和热度',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'query',
      displayName: '搜索词',
      description: '搜索关键词',
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
      defaultValue: 20
    },
    {
      apiName: 'relevanceWeight',
      displayName: '相关度权重',
      description: '相关度权重(0-1)',
      dataType: { type: 'float' },
      required: false,
      defaultValue: 0.6
    },
    {
      apiName: 'heatWeight',
      displayName: '热度权重',
      description: '热度权重(0-1)',
      dataType: { type: 'float' },
      required: false,
      defaultValue: 0.4
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '搜索推荐结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric', 'ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'search', 'relevance'],
    cacheConfig: {
      enabled: true,
      ttl: 60
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getScenarioRecommendations
 * 获取场景推荐
 */
export const getScenarioRecommendationsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-scenario-recommendations',
  apiName: 'getScenarioRecommendations',
  displayName: '场景推荐',
  description: '根据用户场景描述匹配推荐工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'scenario',
      displayName: '场景标识',
      description: '场景标识或描述',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'description',
      displayName: '场景描述',
      description: '用户需求描述(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'constraints',
      displayName: '约束条件',
      description: '推荐约束条件',
      dataType: { type: 'object' },
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
    dataType: { type: 'object' },
    description: '场景推荐结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'ToolCategory', 'UseCase', 'PricingPlan'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'scenario', 'use-case'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getPersonalizedRecommendations
 * 获取个性化推荐
 */
export const getPersonalizedRecommendationsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-personalized-recommendations',
  apiName: 'getPersonalizedRecommendations',
  displayName: '个性化推荐',
  description: '基于用户历史行为获取个性化推荐',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'userId',
      displayName: '用户ID',
      description: '用户ID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      description: '最大返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 10
    },
    {
      apiName: 'excludeToolSlugs',
      displayName: '排除的工具',
      description: '排除的工具slug列表',
      dataType: { type: 'list' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '个性化推荐结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'UserReview', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'personalized', 'user-behavior'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getSimilarTools
 * 获取相似工具
 */
export const getSimilarToolsRecommendationFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-similar-tools-recommendation',
  apiName: 'getSimilarTools',
  displayName: '相似工具推荐',
  description: '基于类别、属性相似度推荐相似工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '参考工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      description: '最大返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 5
    },
    {
      apiName: 'includeReasons',
      displayName: '包含推荐理由',
      description: '是否包含推荐理由',
      dataType: { type: 'boolean' },
      required: false,
      defaultValue: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '相似工具推荐结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'ToolCategory', 'CompetitorAnalysis'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'similar', 'related'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getTrendingTools
 * 获取趋势工具
 */
export const getTrendingToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-trending-tools',
  apiName: 'getTrendingTools',
  displayName: '趋势工具',
  description: '获取当前趋势上升的工具',
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
      defaultValue: 10
    },
    {
      apiName: 'period',
      displayName: '统计周期',
      description: '统计周期(天)',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 7
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '趋势工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'trending', 'hot'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: matchUseCase
 * 匹配使用场景
 */
export const matchUseCaseFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.match-use-case',
  apiName: 'matchUseCase',
  displayName: '匹配使用场景',
  description: '根据用户需求匹配最佳的使用场景分类',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'query',
      displayName: '需求描述',
      description: '用户需求描述',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '场景匹配结果'
  },
  
  boundObjectTypes: ['UseCase', 'ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'recommendation',
    tags: ['recommendation', 'use-case', 'matching']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Recommendation Functions
 */
export const recommendationFunctions: FunctionV2[] = [
  getHomeRecommendationsFunction,
  getSearchRecommendationsFunction,
  getScenarioRecommendationsFunction,
  getPersonalizedRecommendationsFunction,
  getSimilarToolsRecommendationFunction,
  getTrendingToolsFunction,
  matchUseCaseFunction
];
