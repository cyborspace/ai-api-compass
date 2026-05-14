/**
 * ToolTag ObjectType
 * 
 * 语义层 - 工具标签
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const ToolTagObjectType: ObjectTypeV2 = {
  apiName: 'ToolTag',
  displayName: '工具标签',
  pluralDisplayName: '工具标签列表',
  status: 'ACTIVE',
  description: '用于标记AI工具特征的标签',
  icon: {
    blueprint: {
      color: '#F59E0B',
      name: 'Tag'
    }
  },
  primaryKey: 'slug',
  titleProperty: 'name',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.tool-tag',
  metaKind: 'Tag',
  entityLevel: 'MetaEntity',
  aliases: ['标签', '标记'],

  properties: {
    slug: {
      description: 'URL友好的唯一标识符',
      displayName: 'URL标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-tag.slug',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    name: {
      description: '标签名称',
      displayName: '名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-tag.name',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    color: {
      description: '标签颜色',
      displayName: '颜色',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-tag.color',
      valueTypeApiName: 'Color',
      typeClasses: []
    } as PropertyV2,

    usageCount: {
      description: '使用次数',
      displayName: '使用次数',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-tag.usage-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type ToolTagPropertyApiName = keyof typeof ToolTagObjectType.properties;
