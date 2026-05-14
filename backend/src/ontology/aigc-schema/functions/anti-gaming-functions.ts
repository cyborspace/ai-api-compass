/**
 * Anti-Gaming System Functions
 * 
 * 防作弊系统相关的 Ontology Functions
 * 对标 anti-gaming.ts 的硬编码实现
 */

import type { FunctionV2 } from '../../types';

/**
 * Function: detectUserRisk
 * 检测用户风险
 */
export const detectUserRiskFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.detect-user-risk',
  apiName: 'detectUserRisk',
  displayName: '检测用户风险',
  description: '检测用户行为的异常程度和风险等级',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
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
      apiName: 'ipAddress',
      displayName: 'IP地址',
      description: 'IP地址(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'action',
      displayName: '操作类型',
      description: '用户操作类型',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID(可选)',
      dataType: { type: 'string' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '风险检测结果'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['risk', 'detection', 'security']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getRiskProfile
 * 获取用户风险档案
 */
export const getRiskProfileFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-risk-profile',
  apiName: 'getRiskProfile',
  displayName: '获取风险档案',
  description: '获取用户的风险档案信息',
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
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '用户风险档案'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['risk', 'profile', 'user']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getRiskStatistics
 * 获取风险统计
 */
export const getRiskStatisticsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-risk-statistics',
  apiName: 'getRiskStatistics',
  displayName: '风险统计',
  description: '获取整体风险统计数据',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [],
  
  returnType: {
    dataType: { type: 'object' },
    description: '风险统计数据'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: false,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['risk', 'statistics', 'admin']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: getHighRiskUsers
 * 获取高风险用户列表
 */
export const getHighRiskUsersFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-high-risk-users',
  apiName: 'getHighRiskUsers',
  displayName: '高风险用户',
  description: '获取所有高风险用户列表',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'riskLevel',
      displayName: '风险等级',
      description: '风险等级筛选: high, critical',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'high'
    }
  ],
  
  returnType: {
    dataType: { type: 'list' },
    description: '高风险用户列表'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['risk', 'users', 'admin']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: clearUserRisk
 * 清除用户风险记录
 */
export const clearUserRiskFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.clear-user-risk',
  apiName: 'clearUserRisk',
  displayName: '清除风险记录',
  description: '清除指定用户的风险记录',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'OntologyEditFunction',
  
  parameters: [
    {
      apiName: 'userId',
      displayName: '用户ID',
      description: '用户ID',
      dataType: { type: 'string' },
      required: true
    }
  ],
  
  returnType: {
    dataType: { type: 'boolean' },
    description: '是否成功'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: true,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['risk', 'admin', 'clear']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Function: recordActivity
 * 记录用户活动
 */
export const recordActivityFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.record-activity',
  apiName: 'recordActivity',
  displayName: '记录用户活动',
  description: '记录用户活动用于行为分析',
  status: 'ACTIVE',
  language: 'TYPESCRIPT',
  executionMode: 'SERVERLESS',
  
  decorator: 'OntologyEditFunction',
  
  parameters: [
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
      apiName: 'ipAddress',
      displayName: 'IP地址',
      description: 'IP地址(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'action',
      displayName: '操作类型',
      description: '用户操作类型',
      dataType: { type: 'string' },
      required: true
    },
    {
      apiName: 'toolRid',
      displayName: '工具RID',
      description: '工具RID(可选)',
      dataType: { type: 'string' },
      required: false
    },
    {
      apiName: 'metadata',
      displayName: '元数据',
      description: '活动元数据',
      dataType: { type: 'object' },
      required: false
    }
  ],
  
  returnType: {
    dataType: { type: 'boolean' },
    description: '是否成功'
  },
  
  boundObjectTypes: [],
  ontologyId: 'ri.aigc.main.ontology',
  version: '1.0.0',
  timeoutMs: 5000,
  performsEdits: true,
  
  metadata: {
    category: 'anti-gaming',
    tags: ['activity', 'tracking', 'analytics']
  },
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Export all Anti-Gaming Functions
 */
export const antiGamingFunctions: FunctionV2[] = [
  detectUserRiskFunction,
  getRiskProfileFunction,
  getRiskStatisticsFunction,
  getHighRiskUsersFunction,
  clearUserRiskFunction,
  recordActivityFunction
];
