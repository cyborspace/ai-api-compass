/**
 * AIGC Function Definitions
 * 
 * 动力层 - Function 定义
 * 
 * 参考: docs/packages/core/src/types/function.ts
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: searchTools
 * 搜索工具
 */
export const searchToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.search-tools',
  apiName: 'searchTools',
  displayName: '搜索工具',
  description: '根据关键词搜索AI工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'query',
      displayName: '搜索关键词',
      description: '搜索关键词',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'category',
      displayName: '分类',
      description: '工具分类slug',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'pricingType',
      displayName: '定价模式',
      description: '定价模式筛选',
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
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '匹配的AI工具列表'
  },
  
  boundObjectTypes: ['AIGCTool'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: compareTools
 * 对比工具
 */
export const compareToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.compare-tools',
  apiName: 'compareTools',
  displayName: '对比工具',
  description: '多维度对比AI工具',
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
      apiName: 'dimension',
      displayName: '对比维度',
      description: '对比维度',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'all'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '对比结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'PricingPlan', 'ToolCapability', 'TechnicalSpec'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 30000,
  performsEdits: false,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getSimilarTools
 * 获取相似工具
 */
export const getSimilarToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-similar-tools',
  apiName: 'getSimilarTools',
  displayName: '相似工具',
  description: '基于竞品分析推荐相似工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '参考工具slug',
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
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '相似工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'CompetitorAnalysis'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: findCostEffectiveAlternatives
 * 寻找性价比替代
 */
export const findCostEffectiveAlternativesFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.find-cost-effective-alternatives',
  apiName: 'findCostEffectiveAlternatives',
  displayName: '性价比替代',
  description: '寻找更便宜但功能相似的工具',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '参考工具',
      description: '参考工具slug',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'maxPrice',
      displayName: '最高价格',
      description: '最高价格(分)',
      dataType: { type: 'integer' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '性价比替代工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'PricingPlan'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 20000,
  performsEdits: false,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: incrementViewCount
 * 增加浏览数
 */
export const incrementViewCountFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.increment-view-count',
  apiName: 'incrementViewCount',
  displayName: '增加浏览数',
  description: '增加工具的浏览计数',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'OntologyEditFunction',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '工具slug',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'boolean' },
    description: '是否成功'
  },
  
  boundObjectTypes: ['AIGCTool'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: true,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Functions
 */
export const aigcFunctions: FunctionV2[] = [
  searchToolsFunction,
  compareToolsFunction,
  getSimilarToolsFunction,
  findCostEffectiveAlternativesFunction,
  incrementViewCountFunction
];
