/**
 * Scenario System Functions
 * 
 * 场景匹配相关的 Ontology Functions
 * 对标 scenario-match.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: getPresetScenarios
 * 获取预设场景列表
 */
export const getPresetScenariosFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-preset-scenarios',
  apiName: 'getPresetScenarios',
  displayName: '预设场景列表',
  description: '获取所有预设的使用场景',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [],
  
  returnType: {
    dataType: { type: 'list' },
    description: '预设场景列表'
  },
  
  boundObjectTypes: ['UseCase', 'ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'scenario',
    tags: ['scenario', 'preset', 'use-case']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getScenarioConfig
 * 获取场景配置
 */
export const getScenarioConfigFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-scenario-config',
  apiName: 'getScenarioConfig',
  displayName: '场景配置',
  description: '获取指定场景的详细配置',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'scenarioId',
      displayName: '场景ID',
      description: '场景标识',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '场景配置详情'
  },
  
  boundObjectTypes: ['UseCase', 'ToolCategory'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'scenario',
    tags: ['scenario', 'config', 'use-case']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: matchScenario
 * 匹配场景
 */
export const matchScenarioFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.match-scenario',
  apiName: 'matchScenario',
  displayName: '场景匹配',
  description: '根据用户描述匹配最佳场景',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'query',
      displayName: '查询词',
      description: '用户需求描述或关键词',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'description',
      displayName: '详细描述',
      description: '详细需求描述(可选)',
      dataType: { type: 'string' },
      required: false
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
    category: 'scenario',
    tags: ['scenario', 'matching', 'intent']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getToolsForScenario
 * 获取场景适用工具
 */
export const getToolsForScenarioFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-tools-for-scenario',
  apiName: 'getToolsForScenario',
  displayName: '场景适用工具',
  description: '获取适用于指定场景的工具列表',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'scenarioId',
      displayName: '场景ID',
      description: '场景标识',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'constraints',
      displayName: '约束条件',
      description: '筛选约束条件',
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
    description: '场景适用工具结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'UseCase', 'ToolCategory', 'PricingPlan'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'scenario',
    tags: ['scenario', 'tools', 'recommendation'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: searchScenarios
 * 搜索场景
 */
export const searchScenariosFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.search-scenarios',
  apiName: 'searchScenarios',
  displayName: '搜索场景',
  description: '根据关键词搜索匹配的场景',
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
    description: '匹配的场景列表'
  },
  
  boundObjectTypes: ['UseCase'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'scenario',
    tags: ['scenario', 'search', 'discover']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Scenario Functions
 */
export const scenarioFunctions: FunctionV2[] = [
  getPresetScenariosFunction,
  getScenarioConfigFunction,
  matchScenarioFunction,
  getToolsForScenarioFunction,
  searchScenariosFunction
];
