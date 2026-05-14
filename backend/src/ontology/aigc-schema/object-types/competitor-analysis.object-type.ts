/**
 * CompetitorAnalysis ObjectType
 * 
 * 语义层 - 竞品分析
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const CompetitorAnalysisObjectType: ObjectTypeV2 = {
  apiName: 'CompetitorAnalysis',
  displayName: '竞品分析',
  pluralDisplayName: '竞品分析列表',
  status: 'ACTIVE',
  description: '工具间的竞品关系和对比分析',
  icon: {
    blueprint: {
      color: '#EF4444',
      name: 'GitCompare'
    }
  },
  primaryKey: 'analysisKey',
  titleProperty: 'relationshipType',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.competitor-analysis',
  metaKind: 'Analysis',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['竞品', '对比', '替代方案'],

  properties: {
    analysisKey: {
      description: '分析唯一标识',
      displayName: '标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.analysis-key',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    sourceToolSlug: {
      description: '源工具slug',
      displayName: '工具A',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.source-tool-slug',
      typeClasses: [],
      required: true,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    targetToolSlug: {
      description: '目标工具slug',
      displayName: '工具B',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.target-tool-slug',
      typeClasses: [],
      required: true,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    relationshipType: {
      apiName: 'relationshipType',
      description: '关系类型',
      displayName: '关系类型',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.relationship-type',
      valueTypeApiName: 'RelationshipType',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    similarity: {
      description: '相似度(0-1)',
      displayName: '相似度',
      dataType: { type: 'double' },
      rid: 'ri.aigc.main.property.competitor-analysis.similarity',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    priceAdvantage: {
      description: '价格优势说明',
      displayName: '价格优势',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.price-advantage',
      typeClasses: []
    } as PropertyV2,

    priceDifference: {
      description: '价格差异(分)',
      displayName: '价格差',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.competitor-analysis.price-difference',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    advantages: {
      description: '优势列表',
      displayName: '优势',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.competitor-analysis.advantages',
      typeClasses: []
    } as PropertyV2,

    disadvantages: {
      description: '劣势列表',
      displayName: '劣势',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.competitor-analysis.disadvantages',
      typeClasses: []
    } as PropertyV2,

    recommendation: {
      description: '推荐建议',
      displayName: '建议',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.competitor-analysis.recommendation',
      typeClasses: []
    } as PropertyV2
  }
};

export type CompetitorAnalysisPropertyApiName = keyof typeof CompetitorAnalysisObjectType.properties;
