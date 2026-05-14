/**
 * PricingPlan ObjectType
 * 
 * 语义层 - 定价方案
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const PricingPlanObjectType: ObjectTypeV2 = {
  apiName: 'PricingPlan',
  displayName: '定价方案',
  pluralDisplayName: '定价方案列表',
  status: 'ACTIVE',
  description: 'AI工具的详细定价方案',
  icon: {
    blueprint: {
      color: '#10B981',
      name: 'CreditCard'
    }
  },
  primaryKey: 'planKey',
  titleProperty: 'planName',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.pricing-plan',
  metaKind: 'Product',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['定价', '价格方案', '套餐'],

  properties: {
    planKey: {
      description: '方案唯一标识',
      displayName: '方案标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.plan-key',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    toolSlug: {
      description: '关联的工具slug',
      displayName: '工具',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.tool-slug',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    planName: {
      description: '方案名称',
      displayName: '方案名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.plan-name',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    planType: {
      description: '方案类型',
      displayName: '类型',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.plan-type',
      valueTypeApiName: 'PlanType',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    monthlyPrice: {
      description: '月费(单位:分)',
      displayName: '月费(分)',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.pricing-plan.monthly-price',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    yearlyPrice: {
      description: '年费(单位:分)',
      displayName: '年费(分)',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.pricing-plan.yearly-price',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    currency: {
      description: '货币',
      displayName: '货币',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.currency',
      valueTypeApiName: 'Currency',
      typeClasses: [],
      defaultValue: 'CNY'
    } as PropertyV2,

    discount: {
      description: '年付折扣百分比',
      displayName: '年付折扣',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.pricing-plan.discount',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    inputTokenPrice: {
      description: '输入Token价格(分/1M)',
      displayName: '输入价格',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.pricing-plan.input-token-price',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    outputTokenPrice: {
      description: '输出Token价格(分/1M)',
      displayName: '输出价格',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.pricing-plan.output-token-price',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    includedQuota: {
      description: '包含额度说明',
      displayName: '包含额度',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.pricing-plan.included-quota',
      typeClasses: []
    } as PropertyV2,

    features: {
      description: '包含功能列表',
      displayName: '包含功能',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.pricing-plan.features',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    unlimited: {
      description: '是否无限使用',
      displayName: '无限使用',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.pricing-plan.unlimited',
      typeClasses: [],
      defaultValue: false
    } as PropertyV2,

    isRecommended: {
      description: '是否推荐方案',
      displayName: '推荐',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.pricing-plan.is-recommended',
      typeClasses: [],
      defaultValue: false,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type PricingPlanPropertyApiName = keyof typeof PricingPlanObjectType.properties;
