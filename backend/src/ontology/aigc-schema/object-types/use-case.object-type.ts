/**
 * UseCase ObjectType
 * 
 * 语义层 - 使用场景
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const UseCaseObjectType: ObjectTypeV2 = {
  apiName: 'UseCase',
  displayName: '使用场景',
  pluralDisplayName: '使用场景列表',
  status: 'ACTIVE',
  description: 'AI工具的典型使用场景',
  icon: {
    blueprint: {
      color: '#EF4444',
      name: 'Target'
    }
  },
  primaryKey: 'slug',
  titleProperty: 'title',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.object-type.use-case',
  metaKind: 'Scenario',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'AIGCProduct', displayName: 'AIGC产品' }],
  aliases: ['使用场景', '应用场景', '典型场景'],

  properties: {
    slug: {
      description: 'URL友好的唯一标识符',
      displayName: 'URL标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.use-case.slug',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    title: {
      description: '场景标题',
      displayName: '标题',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.use-case.title',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    nameEn: {
      description: '英文名称',
      displayName: '英文名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.use-case.name-en',
      typeClasses: []
    } as PropertyV2,

    description: {
      description: '场景描述',
      displayName: '描述',
      dataType: { type: 'string', maxLength: 1000 },
      rid: 'ri.aigc.main.property.use-case.description',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { searchable: true, visibleInDefaultView: false }
    } as PropertyV2,

    keywords: {
      description: '关键词列表',
      displayName: '关键词',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.use-case.keywords',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    icon: {
      description: '场景图标',
      displayName: '图标',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.use-case.icon',
      typeClasses: []
    } as PropertyV2,

    color: {
      description: '场景颜色',
      displayName: '颜色',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.use-case.color',
      valueTypeApiName: 'Color',
      typeClasses: []
    } as PropertyV2,

    viewCount: {
      description: '浏览量',
      displayName: '浏览',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.use-case.view-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    popularity: {
      description: '热门度',
      displayName: '热门度',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.use-case.popularity',
      typeClasses: [],
      defaultValue: 0,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type UseCasePropertyApiName = keyof typeof UseCaseObjectType.properties;
