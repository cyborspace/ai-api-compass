/**
 * ToolCapability ObjectType
 * 
 * 语义层 - 工具能力矩阵
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const ToolCapabilityObjectType: ObjectTypeV2 = {
  apiName: 'ToolCapability',
  displayName: '工具能力',
  pluralDisplayName: '工具能力列表',
  status: 'ACTIVE',
  description: 'AI工具的能力矩阵，用于多维度功能对比',
  icon: {
    blueprint: {
      color: '#F59E0B',
      name: 'Zap'
    }
  },
  primaryKey: 'capabilityKey',
  titleProperty: 'category',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.tool-capability',
  metaKind: 'Capability',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['能力', '功能对比', '能力矩阵'],

  properties: {
    capabilityKey: {
      description: '能力唯一标识',
      displayName: '标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-capability.capability-key',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    toolSlug: {
      description: '关联的工具slug',
      displayName: '工具',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-capability.tool-slug',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    category: {
      description: '能力分类',
      displayName: '分类',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-capability.category',
      valueTypeApiName: 'CapabilityCategory',
      typeClasses: [],
      required: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    accuracy: {
      description: '准确度评分(1-10)',
      displayName: '准确度',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-capability.accuracy',
      typeClasses: [],
      defaultValue: 5,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    speed: {
      description: '速度评分(1-10)',
      displayName: '速度',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-capability.speed',
      typeClasses: [],
      defaultValue: 5,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    creativity: {
      description: '创造力评分(1-10)',
      displayName: '创造力',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-capability.creativity',
      typeClasses: [],
      defaultValue: 5,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    consistency: {
      description: '一致性评分(1-10)',
      displayName: '一致性',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-capability.consistency',
      typeClasses: [],
      defaultValue: 5,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    contextWindow: {
      description: '上下文窗口大小(tokens)',
      displayName: '上下文',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-capability.context-window',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    specialFeatures: {
      description: '特殊功能列表',
      displayName: '特殊功能',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.tool-capability.special-features',
      typeClasses: []
    } as PropertyV2
  }
};

export type ToolCapabilityPropertyApiName = keyof typeof ToolCapabilityObjectType.properties;
