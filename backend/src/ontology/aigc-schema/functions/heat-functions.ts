/**
 * Heat System Functions
 * 
 * 热度系统相关的 Ontology Functions
 * 对标 heat-calculator.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: calculateToolHeat
 * 计算工具热度
 */
export const calculateToolHeatFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.calculate-tool-heat',
  apiName: 'calculateToolHeat',
  displayName: '计算工具热度',
  description: '计算指定工具的热度分数，支持多周期计算',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期: 1h, 24h, 7d, 30d',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '24h'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '热度计算结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'calculation', 'metric'],
    cacheConfig: {
      enabled: true,
      ttl: 60 // 1分钟缓存
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: calculateAllPeriodsHeat
 * 计算所有周期热度
 */
export const calculateAllPeriodsHeatFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.calculate-all-periods-heat',
  apiName: 'calculateAllPeriodsHeat',
  displayName: '计算全周期热度',
  description: '计算工具在所有周期(1h, 24h, 7d, 30d)的热度',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '所有周期热度结果'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 15000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'multi-period'],
    cacheConfig: {
      enabled: true,
      ttl: 60
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getToolHeatScore
 * 获取工具热度分数
 */
export const getToolHeatScoreFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-tool-heat-score',
  apiName: 'getToolHeatScore',
  displayName: '获取热度分数',
  description: '获取工具的热度分数，支持批量获取',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '24h'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '热度分数数据'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'score', 'metric'],
    cacheConfig: {
      enabled: true,
      ttl: 60
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getHotTools
 * 获取热门工具
 */
export const getHotToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-hot-tools',
  apiName: 'getHotTools',
  displayName: '热门工具',
  description: '获取当前最热门的工具列表',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期: 1h, 24h, 7d, 30d',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '24h'
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
    dataType: { type: 'list' },
    objectTypeApiName: 'AIGCTool',
    description: '热门工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'hot', 'trending'],
    cacheConfig: {
      enabled: true,
      ttl: 60
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getRisingTools
 * 获取上升趋势工具
 */
export const getRisingToolsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-rising-tools',
  apiName: 'getRisingTools',
  displayName: '上升趋势工具',
  description: '获取近期热度快速上升的工具列表',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '7d'
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
    description: '上升趋势工具列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'rising', 'trending'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getHeatTrend
 * 获取热度趋势
 */
export const getHeatTrendFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-heat-trend',
  apiName: 'getHeatTrend',
  displayName: '热度趋势',
  description: '获取工具的热度趋势信息',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '24h'
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '热度趋势信息'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'trend', 'history'],
    cacheConfig: {
      enabled: true,
      ttl: 60
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getHeatHistory
 * 获取热度历史
 */
export const getHeatHistoryFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-heat-history',
  apiName: 'getHeatHistory',
  displayName: '热度历史',
  description: '获取工具的历史热度数据',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'period',
      displayName: '热度周期',
      description: '热度周期',
      dataType: { type: 'string' },
      required: false,
      defaultValue: '24h'
    },
    {
      apiName: 'days',
      displayName: '历史天数',
      description: '获取历史天数',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 7
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    description: '热度历史数据列表'
  },
  
  boundObjectTypes: ['AIGCTool', 'TrendMetric'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'heat',
    tags: ['heat', 'history', 'time-series'],
    cacheConfig: {
      enabled: true,
      ttl: 300
    }
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: recordUserEvent
 * 记录用户事件
 */
export const recordUserEventFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.record-user-event',
  apiName: 'recordUserEvent',
  displayName: '记录用户事件',
  description: '记录用户对工具的操作事件，用于热度计算',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'OntologyEditFunction',
  
  parameters: [
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'eventType',
      displayName: '事件类型',
      description: '事件类型: search, click, compare, bookmark, share',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'userId',
      displayName: '用户ID',
      description: '用户ID(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'sessionId',
      displayName: '会话ID',
      description: '会话ID(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'metadata',
      displayName: '事件元数据',
      description: '事件元数据',
      dataType: { type: 'object' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'boolean' },
    description: '是否成功'
  },
  
  boundObjectTypes: ['AIGCTool'],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: true,
  
  metadata: {
    category: 'heat',
    tags: ['event', 'tracking', 'analytics']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Heat Functions
 */
export const heatFunctions: FunctionV2[] = [
  calculateToolHeatFunction,
  calculateAllPeriodsHeatFunction,
  getToolHeatScoreFunction,
  getHotToolsFunction,
  getRisingToolsFunction,
  getHeatTrendFunction,
  getHeatHistoryFunction,
  recordUserEventFunction
];
