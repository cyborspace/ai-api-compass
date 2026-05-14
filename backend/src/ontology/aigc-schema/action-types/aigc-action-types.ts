/**
 * AIGC ActionType Definitions
 * 
 * 动力层 - ActionType 定义
 * 
 * 参考: docs/packages/core/src/types/action-type.ts
 */

import type { ActionTypeV2, ParameterDefinition } from '../../types';

/**
 * ActionType: createFavorite
 * 创建收藏
 */
export const createFavoriteActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.create-favorite',
  apiName: 'createFavorite',
  displayName: '添加收藏',
  description: '将AI工具添加到用户收藏夹',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '要收藏的工具',
      dataType: { type: 'objectSet' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'categoryName',
      displayName: '收藏夹名称',
      description: '收藏夹名称',
      dataType: { type: 'string' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'note',
      displayName: '备注',
      description: '收藏备注',
      dataType: { type: 'string' },
      required: false,
    } as ParameterDefinition,
  ],
  
  operations: [
    {
      createObject: {
        objectTypeApiName: 'FavoriteItem'
      }
    }
  ],
  
  submissionCriteria: [
    {
      type: 'parameterCondition',
      parameterId: 'toolSlug',
      propertyPath: 'slug',
      operator: 'isNot',
      value: null,
      failureMessage: '请选择一个有效的工具'
    }
  ]
};

/**
 * ActionType: compareTools
 * 创建对比会话
 */
export const compareToolsActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.compare-tools',
  apiName: 'compareTools',
  displayName: '对比工具',
  description: '创建工具对比会话',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  parameters: [
    {
      apiName: 'toolSlugs',
      displayName: '工具列表',
      description: '要对比的工具列表',
      dataType: { type: 'list' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'dimension',
      displayName: '对比维度',
      description: '对比维度',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'all',
    } as ParameterDefinition,
  ],
  
  operations: [
    {
      createObject: {
        objectTypeApiName: 'CompareSession'
      }
    }
  ],
  
  sideEffects: [
    {
      type: 'actionLog',
      enabled: true
    }
  ]
};

/**
 * ActionType: submitReview
 * 提交评价
 */
export const submitReviewActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.submit-review',
  apiName: 'submitReview',
  displayName: '提交评价',
  description: '提交用户对工具的评价',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '要评价的工具',
      dataType: { type: 'objectSet' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'title',
      displayName: '评价标题',
      description: '简要标题',
      dataType: { type: 'string' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'content',
      displayName: '评价内容',
      description: '详细评价',
      dataType: { type: 'string' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'overallRating',
      displayName: '总体评分',
      description: '1-5分',
      dataType: { type: 'integer' },
      required: true,
    } as ParameterDefinition,
    {
      apiName: 'pros',
      displayName: '优点',
      description: '优点列表',
      dataType: { type: 'list' },
      required: false,
    } as ParameterDefinition,
    {
      apiName: 'cons',
      displayName: '缺点',
      description: '缺点列表',
      dataType: { type: 'list' },
      required: false,
    } as ParameterDefinition,
  ],
  
  operations: [
    {
      createObject: {
        objectTypeApiName: 'UserReview'
      }
    }
  ],
  
  submissionCriteria: [
    {
      type: 'parameterCondition',
      parameterId: 'overallRating',
      propertyPath: 'rating',
      operator: 'greaterThan',
      value: 0,
      failureMessage: '请提供有效评分'
    }
  ]
};

/**
 * ActionType: trackToolView
 * 记录工具浏览
 */
export const trackToolViewActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.track-tool-view',
  apiName: 'trackToolView',
  displayName: '记录浏览',
  description: '记录工具浏览行为',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '浏览的工具',
      dataType: { type: 'objectSet' },
      required: true,
    } as ParameterDefinition,
  ],
  
  functionRule: {
    functionApiName: 'incrementViewCount',
    parameterMapping: {
      toolSlug: 'toolSlug'
    }
  },
  
  sideEffects: [
    {
      type: 'actionLog',
      enabled: true
    }
  ]
};

/**
 * Export all ActionTypes
 */
export const aigcActionTypes: ActionTypeV2[] = [
  createFavoriteActionType,
  compareToolsActionType,
  submitReviewActionType,
  trackToolViewActionType
];
