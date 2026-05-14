/**
 * ToolCategory ObjectType
 * 
 * 语义层 - 工具分类
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const ToolCategoryObjectType: ObjectTypeV2 = {
  apiName: 'ToolCategory',
  displayName: '工具分类',
  pluralDisplayName: '工具分类列表',
  status: 'ACTIVE',
  description: 'AI工具的功能分类',
  icon: {
    blueprint: {
      color: '#10B981',
      name: 'Folder'
    }
  },
  primaryKey: 'slug',
  titleProperty: 'name',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.object-type.tool-category',
  metaKind: 'Category',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'AIGCProduct', displayName: 'AIGC产品' }],
  aliases: ['AI分类', '工具类别', '分类'],

  properties: {
    slug: {
      description: 'URL友好的唯一标识符',
      displayName: 'URL标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.slug',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    name: {
      description: '分类名称',
      displayName: '名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.name',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    nameEn: {
      description: '英文名称',
      displayName: '英文名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.name-en',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    description: {
      description: '分类描述',
      displayName: '描述',
      dataType: { type: 'string', maxLength: 1000 },
      rid: 'ri.aigc.main.property.tool-category.description',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { searchable: true, visibleInDefaultView: false }
    } as PropertyV2,

    icon: {
      description: '分类图标',
      displayName: '图标',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.icon',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    color: {
      description: '分类颜色',
      displayName: '颜色',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.color',
      valueTypeApiName: 'Color',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    sortOrder: {
      description: '排序序号',
      displayName: '排序',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-category.sort-order',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    parentSlug: {
      description: '父分类slug',
      displayName: '父分类',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-category.parent-slug',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    toolCount: {
      description: '该分类下的工具数量',
      displayName: '工具数',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-category.tool-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type ToolCategoryPropertyApiName = keyof typeof ToolCategoryObjectType.properties;
