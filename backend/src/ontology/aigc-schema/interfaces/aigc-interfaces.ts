/**
 * AIGC Interface Definitions
 * 
 * 接口层 - Interface 定义
 * 
 * 参考: docs/packages/core/src/types/interface.ts
 */

import type { InterfaceType } from '../../types';

/**
 * Interface: IIndexable
 * 可搜索接口
 */
export const iIndexableInterface: InterfaceType = {
  rid: 'ri.aigc.main.interface.i-indexable',
  apiName: 'IIndexable',
  displayName: '可搜索',
  description: '支持全文搜索的实体',
  status: 'ACTIVE',
  visibility: 'PROMINENT',
  
  properties: {
    slug: {
      rid: 'ri.aigc.main.interface.property.i-indexable.slug',
      apiName: 'slug',
      displayName: 'URL标识',
      description: '唯一标识符',
      dataType: { type: 'string' },
      requireImplementation: true
    },
    name: {
      rid: 'ri.aigc.main.interface.property.i-indexable.name',
      apiName: 'name',
      displayName: '名称',
      description: '显示名称',
      dataType: { type: 'string' },
      requireImplementation: true
    },
    description: {
      rid: 'ri.aigc.main.interface.property.i-indexable.description',
      apiName: 'description',
      displayName: '描述',
      description: '详细描述',
      dataType: { type: 'string' },
      requireImplementation: false
    }
  },
  
  allProperties: {},
  extendsInterfaces: [],
  allExtendsInterfaces: [],
  implementedByObjectTypes: ['AIGCTool', 'ToolCategory', 'ToolProvider', 'UseCase'],
  links: {},
  allLinks: {}
};

/**
 * Interface: IRatable
 * 可评分接口
 */
export const iRatableInterface: InterfaceType = {
  rid: 'ri.aigc.main.interface.i-ratable',
  apiName: 'IRatable',
  displayName: '可评分',
  description: '支持用户评分的实体',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  
  properties: {
    averageRating: {
      rid: 'ri.aigc.main.interface.property.i-ratable.average-rating',
      apiName: 'averageRating',
      displayName: '平均评分',
      description: '平均用户评分',
      dataType: { type: 'double' },
      requireImplementation: true
    },
    reviewCount: {
      rid: 'ri.aigc.main.interface.property.i-ratable.review-count',
      apiName: 'reviewCount',
      displayName: '评价数',
      description: '评价总数',
      dataType: { type: 'integer' },
      requireImplementation: true
    }
  },
  
  allProperties: {},
  extendsInterfaces: [],
  allExtendsInterfaces: [],
  implementedByObjectTypes: ['AIGCTool', 'ToolProvider'],
  links: {},
  allLinks: {}
};

/**
 * Interface: ITrackable
 * 可追踪接口
 */
export const iTrackableInterface: InterfaceType = {
  rid: 'ri.aigc.main.interface.i-trackable',
  apiName: 'ITrackable',
  displayName: '可追踪',
  description: '支持统计追踪的实体',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  
  properties: {
    viewCount: {
      rid: 'ri.aigc.main.interface.property.i-trackable.view-count',
      apiName: 'viewCount',
      displayName: '浏览量',
      description: '总浏览数',
      dataType: { type: 'integer' },
      requireImplementation: true
    },
    favoriteCount: {
      rid: 'ri.aigc.main.interface.property.i-trackable.favorite-count',
      apiName: 'favoriteCount',
      displayName: '收藏数',
      description: '总收藏数',
      dataType: { type: 'integer' },
      requireImplementation: true
    },
    compareCount: {
      rid: 'ri.aigc.main.interface.property.i-trackable.compare-count',
      apiName: 'compareCount',
      displayName: '对比次数',
      description: '被对比次数',
      dataType: { type: 'integer' },
      requireImplementation: true
    }
  },
  
  allProperties: {},
  extendsInterfaces: [],
  allExtendsInterfaces: [],
  implementedByObjectTypes: ['AIGCTool'],
  links: {},
  allLinks: {}
};

/**
 * Interface: IPriced
 * 有价格接口
 */
export const iPricedInterface: InterfaceType = {
  rid: 'ri.aigc.main.interface.i-priced',
  apiName: 'IPriced',
  displayName: '有价格',
  description: '有定价信息的实体',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  
  properties: {
    pricingType: {
      rid: 'ri.aigc.main.interface.property.i-priced.pricing-type',
      apiName: 'pricingType',
      displayName: '定价模式',
      description: '收费模式',
      dataType: { type: 'string' },
      requireImplementation: true
    },
    startingPrice: {
      rid: 'ri.aigc.main.interface.property.i-priced.starting-price',
      apiName: 'startingPrice',
      displayName: '起价',
      description: '起始价格',
      dataType: { type: 'integer' },
      requireImplementation: false
    },
    currency: {
      rid: 'ri.aigc.main.interface.property.i-priced.currency',
      apiName: 'currency',
      displayName: '货币',
      description: '货币单位',
      dataType: { type: 'string' },
      requireImplementation: true
    },
    hasLifetimeFree: {
      rid: 'ri.aigc.main.interface.property.i-priced.has-lifetime-free',
      apiName: 'hasLifetimeFree',
      displayName: '终身免费',
      description: '是否有终身免费版',
      dataType: { type: 'boolean' },
      requireImplementation: true
    }
  },
  
  allProperties: {},
  extendsInterfaces: [],
  allExtendsInterfaces: [],
  implementedByObjectTypes: ['AIGCTool'],
  links: {
    pricingPlans: {
      rid: 'ri.aigc.main.interface.link.i-priced.pricing-plans',
      apiName: 'pricingPlans',
      displayName: '定价方案',
      description: '多个定价方案',
      linkedEntityApiName: { objectTypeApiName: 'PricingPlan' },
      cardinality: 'ONE_TO_MANY',
      required: false
    }
  },
  allLinks: {}
};

/**
 * Export all Interfaces
 */
export const aigcInterfaces: InterfaceType[] = [
  iIndexableInterface,
  iRatableInterface,
  iTrackableInterface,
  iPricedInterface
];
