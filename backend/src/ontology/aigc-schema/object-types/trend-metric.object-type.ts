/**
 * TrendMetric ObjectType
 * 
 * 语义层 - 趋势数据
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const TrendMetricObjectType: ObjectTypeV2 = {
  apiName: 'TrendMetric',
  displayName: '趋势数据',
  pluralDisplayName: '趋势数据列表',
  status: 'ACTIVE',
  description: '工具的热度和趋势指标',
  icon: {
    blueprint: {
      color: '#14B8A6',
      name: 'TrendingUp'
    }
  },
  primaryKey: 'metricKey',
  titleProperty: 'toolSlug',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.trend-metric',
  metaKind: 'Metric',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['趋势', '热度', '排行'],

  properties: {
    metricKey: {
      description: '趋势唯一标识',
      displayName: '标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.trend-metric.metric-key',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    toolSlug: {
      description: '工具slug',
      displayName: '工具',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.trend-metric.tool-slug',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    date: {
      description: '数据日期',
      displayName: '日期',
      dataType: { type: 'date' },
      rid: 'ri.aigc.main.property.trend-metric.date',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    searchVolume: {
      description: '搜索量',
      displayName: '搜索量',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.search-volume',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    pageViews: {
      description: '页面浏览量',
      displayName: '浏览量',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.page-views',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    newFavorites: {
      description: '新增收藏',
      displayName: '新增收藏',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.new-favorites',
      typeClasses: [],
      defaultValue: 0
    } as PropertyV2,

    newCompares: {
      description: '新增对比',
      displayName: '新增对比',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.new-compares',
      typeClasses: [],
      defaultValue: 0
    } as PropertyV2,

    socialMentions: {
      description: '社交提及数',
      displayName: '社交提及',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.social-mentions',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    ranking: {
      description: '综合排名',
      displayName: '排名',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.trend-metric.ranking',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type TrendMetricPropertyApiName = keyof typeof TrendMetricObjectType.properties;
