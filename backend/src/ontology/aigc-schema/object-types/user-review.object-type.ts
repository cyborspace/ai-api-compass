/**
 * UserReview ObjectType
 * 
 * 语义层 - 用户评价
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const UserReviewObjectType: ObjectTypeV2 = {
  apiName: 'UserReview',
  displayName: '用户评价',
  pluralDisplayName: '用户评价列表',
  status: 'ACTIVE',
  description: '用户对AI工具的评价和评分',
  icon: {
    blueprint: {
      color: '#F97316',
      name: 'Star'
    }
  },
  primaryKey: 'reviewId',
  titleProperty: 'title',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.user-review',
  metaKind: 'Review',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['评价', '评论', '用户反馈'],

  properties: {
    reviewId: {
      description: '评价唯一标识',
      displayName: '评价ID',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.user-review.review-id',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    toolSlug: {
      description: '评价的工具slug',
      displayName: '工具',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.user-review.tool-slug',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    userName: {
      description: '用户名',
      displayName: '用户名',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.user-review.user-name',
      typeClasses: []
    } as PropertyV2,

    title: {
      description: '评价标题',
      displayName: '标题',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.user-review.title',
      typeClasses: []
    } as PropertyV2,

    content: {
      description: '评价内容',
      displayName: '内容',
      dataType: { type: 'string', maxLength: 2000 },
      rid: 'ri.aigc.main.property.user-review.content',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { searchable: true, visibleInDefaultView: false }
    } as PropertyV2,

    overallRating: {
      description: '总体评分(1-5)',
      displayName: '总体评分',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.user-review.overall-rating',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    easeOfUseRating: {
      description: '易用性评分(1-5)',
      displayName: '易用性',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.user-review.ease-of-use-rating',
      typeClasses: [],
      defaultValue: 0
    } as PropertyV2,

    featuresRating: {
      description: '功能评分(1-5)',
      displayName: '功能',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.user-review.features-rating',
      typeClasses: [],
      defaultValue: 0
    } as PropertyV2,

    valueForMoneyRating: {
      description: '性价比评分(1-5)',
      displayName: '性价比',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.user-review.value-for-money-rating',
      typeClasses: [],
      defaultValue: 0
    } as PropertyV2,

    pros: {
      description: '优点列表',
      displayName: '优点',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.user-review.pros',
      typeClasses: []
    } as PropertyV2,

    cons: {
      description: '缺点列表',
      displayName: '缺点',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.user-review.cons',
      typeClasses: []
    } as PropertyV2,

    isPaidUser: {
      description: '是否付费用户',
      displayName: '付费用户',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.user-review.is-paid-user',
      typeClasses: [],
      defaultValue: false
    } as PropertyV2,

    helpfulCount: {
      description: '有帮助数',
      displayName: '有帮助',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.user-review.helpful-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    createdAt: {
      description: '评价时间',
      displayName: '评价时间',
      dataType: { type: 'timestamp' },
      rid: 'ri.aigc.main.property.user-review.created-at',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: false }
    } as PropertyV2
  }
};

export type UserReviewPropertyApiName = keyof typeof UserReviewObjectType.properties;
