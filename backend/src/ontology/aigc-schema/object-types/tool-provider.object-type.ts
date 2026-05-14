/**
 * ToolProvider ObjectType
 * 
 * 语义层 - 工具提供商
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const ToolProviderObjectType: ObjectTypeV2 = {
  apiName: 'ToolProvider',
  displayName: '工具提供商',
  pluralDisplayName: '工具提供商列表',
  status: 'ACTIVE',
  description: 'AI工具的开发公司或组织',
  icon: {
    blueprint: {
      color: '#3B82F6',
      name: 'Building2'
    }
  },
  primaryKey: 'slug',
  titleProperty: 'name',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.object-type.tool-provider',
  metaKind: 'Organization',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'AIGCProduct', displayName: 'AIGC产品' }],
  aliases: ['开发商', '公司', '厂商'],

  properties: {
    slug: {
      description: 'URL友好的唯一标识符',
      displayName: 'URL标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.slug',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    name: {
      description: '公司名称',
      displayName: '名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.name',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: { searchable: true, sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    fullName: {
      description: '公司完整名称',
      displayName: '完整名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.full-name',
      typeClasses: [],
      renderHints: { visibleInDefaultView: false }
    } as PropertyV2,

    description: {
      description: '公司简介',
      displayName: '描述',
      dataType: { type: 'string', maxLength: 2000 },
      rid: 'ri.aigc.main.property.tool-provider.description',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { searchable: true, visibleInDefaultView: false }
    } as PropertyV2,

    logoUrl: {
      description: '公司Logo',
      displayName: 'Logo',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.logo-url',
      valueTypeApiName: 'ImageURL',
      typeClasses: []
    } as PropertyV2,

    websiteUrl: {
      description: '公司官网',
      displayName: '官网',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.website-url',
      valueTypeApiName: 'URL',
      typeClasses: []
    } as PropertyV2,

    foundedYear: {
      description: '成立年份',
      displayName: '成立年份',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.tool-provider.founded-year',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: false }
    } as PropertyV2,

    headquarters: {
      description: '总部所在地',
      displayName: '总部',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.headquarters',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    region: {
      description: '所属地区',
      displayName: '地区',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.tool-provider.region',
      valueTypeApiName: 'Region',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    isPopular: {
      description: '是否知名公司',
      displayName: '知名',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.tool-provider.is-popular',
      typeClasses: [],
      defaultValue: false,
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2
  }
};

export type ToolProviderPropertyApiName = keyof typeof ToolProviderObjectType.properties;
