/**
 * AIGCTool ObjectType
 * 
 * 语义层核心实体 - AIGC工具
 * 对标 Palantir ObjectTypeV2 规范
 * 
 * 参考: docs/packages/core/src/types/object-type.ts
 */

import type { 
  ObjectTypeV2, 
  PropertyV2, 
  Rid, 
  ApiName, 
  ReleaseStatus,
  Visibility,
  TypeClass,
  Icon,
  ObjectTypeGroup
} from '../../types';
import type { ObjectPropertyType } from '../../types';

// ============================================================================
// Object Type Definition
// ============================================================================

export const AIGCToolObjectType: ObjectTypeV2 = {
  /** PascalCase programmatic name */
  apiName: 'AIGCTool',
  
  /** Human-readable name */
  displayName: 'AI工具',
  
  /** Plural form */
  pluralDisplayName: 'AI工具列表',
  
  /** Lifecycle status */
  status: 'ACTIVE',
  
  /** Optional description */
  description: 'AIGC领域的人工智能工具，支持多维度对比和智能推荐',
  
  /** Icon configuration */
  icon: {
    blueprint: {
      color: '#8B5CF6',
      name: 'Bot'
    }
  },
  
  /** Primary key property */
  primaryKey: 'slug',
  
  /** Title property for display */
  titleProperty: 'name',
  
  /** Display visibility */
  visibility: 'PROMINENT',
  
  /** Unique resource identifier */
  rid: 'ri.aigc.main.object-type.aigc-tool',
  
  /** Meta kind */
  metaKind: 'Product',
  
  /** Entity level - MetaEntity for ObjectType */
  entityLevel: 'MetaEntity',
  
  /** Logical groups */
  groups: [
    { apiName: 'AIGCProduct', displayName: 'AIGC产品' },
    { apiName: 'Comparison', displayName: '对比分析' }
  ],
  
  /** Search aliases */
  aliases: ['AI工具', 'AIGC工具', '生成式AI工具'],
  
  // ============================================================================
  // Backing Datasources (Palantir 标准)
  // ============================================================================
  backingDatasources: [
    {
      rid: 'ri.aigc.main.datasource.aigc-tool-primary',
      apiName: 'AIGCToolPrimary',
      displayName: 'AIGC工具主数据源',
      description: 'objects + object_properties 表联合存储',
      datasourceType: 'PRISMA_MODEL',
      sourceIdentifier: 'objects',
      isPrimary: true,
      supportsWrites: true,
      propertyMappings: {
        slug: 'prop_slug',
        name: 'prop_name',
        status: 'prop_status',
        pricingType: 'prop_pricingType',
        developer: 'prop_developer',
        viewCount: 'prop_viewCount',
        favoriteCount: 'prop_favoriteCount',
        compareCount: 'prop_compareCount',
        averageRating: 'prop_averageRating',
        reviewCount: 'prop_reviewCount',
        startingPrice: 'prop_startingPrice',
        isPopular: 'prop_isPopular',
        isFeatured: 'prop_isFeatured',
        isVerified: 'prop_isVerified',
        isOpenSource: 'prop_isOpenSource',
        isChineseNative: 'prop_isChineseNative',
      },
      syncConfig: {
        mode: 'REAL_TIME',
      },
    } as import('../../types').BackingDatasource,
  ],

  // ============================================================================
  // Properties
  // ============================================================================
  properties: {
    // --- 核心标识属性 ---
    slug: {
      description: 'URL友好的唯一标识符',
      displayName: 'URL标识',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.slug',
      typeClasses: ['identifier'],
      required: true,
      isUnique: true,
      isAdvancedSearchable: true,
      renderHints: {
        searchable: true,
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      }
    } as PropertyV2,
    
    name: {
      description: '工具名称',
      displayName: '名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.name',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: {
        searchable: true,
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      }
    } as PropertyV2,
    
    fullName: {
      description: '工具官方完整名称',
      displayName: '完整名称',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.full-name',
      typeClasses: [],
      renderHints: {
        searchable: true,
        visibleInDefaultView: false
      }
    } as PropertyV2,
    
    tagline: {
      description: '一句话宣传语',
      displayName: '宣传语',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.tagline',
      typeClasses: [],
      group: '基本信息'
    } as PropertyV2,
    
    description: {
      apiName: 'description',
      description: '工具详细描述',
      displayName: '描述',
      dataType: { type: 'string', maxLength: 5000 },
      rid: 'ri.aigc.main.property.aigc-tool.description',
      typeClasses: ['searchableText'],
      isAdvancedSearchable: true,
      renderHints: {
        searchable: true,
        visibleInDefaultView: false
      },
      group: '基本信息'
    } as PropertyV2,
    
    logoUrl: {
      apiName: 'logoUrl',
      description: '工具Logo图片URL',
      displayName: 'Logo',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.logo-url',
      valueTypeApiName: 'ImageURL',
      typeClasses: [],
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: false
      }
    } as PropertyV2,
    
    websiteUrl: {
      apiName: 'websiteUrl',
      description: '工具官网URL',
      displayName: '官网',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.website-url',
      valueTypeApiName: 'URL',
      typeClasses: [],
      required: true,
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: false
      }
    } as PropertyV2,
    
    // --- 定价属性 ---
    pricingType: {
      apiName: 'pricingType',
      description: '收费模式',
      displayName: '收费模式',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.pricing-type',
      valueTypeApiName: 'PricingType',
      typeClasses: [],
      required: true,
      isAdvancedSearchable: true,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '定价信息'
    } as PropertyV2,
    
    startingPrice: {
      apiName: 'startingPrice',
      description: '起始价格(单位:分)',
      displayName: '起价(分)',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.aigc-tool.starting-price',
      typeClasses: [],
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '定价信息'
    } as PropertyV2,
    
    currency: {
      apiName: 'currency',
      description: '货币单位',
      displayName: '货币',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.currency',
      valueTypeApiName: 'Currency',
      typeClasses: [],
      defaultValue: 'CNY',
      group: '定价信息'
    } as PropertyV2,
    
    freeTierLimit: {
      apiName: 'freeTierLimit',
      description: '免费版限制说明',
      displayName: '免费限制',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.free-tier-limit',
      typeClasses: [],
      group: '定价信息'
    } as PropertyV2,
    
    hasLifetimeFree: {
      apiName: 'hasLifetimeFree',
      description: '是否有终身免费版',
      displayName: '终身免费',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.has-lifetime-free',
      typeClasses: [],
      defaultValue: false,
      group: '定价信息'
    } as PropertyV2,
    
    // --- 基本信息属性 ---
    developer: {
      description: '开发商/开发公司',
      displayName: '开发商',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.developer',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '基本信息'
    } as PropertyV2,
    
    releaseDate: {
      description: '工具发布日期',
      displayName: '发布日期',
      dataType: { type: 'date' },
      rid: 'ri.aigc.main.property.aigc-tool.release-date',
      typeClasses: [],
      renderHints: {
        sortable: true,
        visibleInDefaultView: false
      },
      group: '基本信息'
    } as PropertyV2,
    
    version: {
      apiName: 'version',
      description: '当前版本号',
      displayName: '版本',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.version',
      valueTypeApiName: 'SemanticVersion',
      typeClasses: [],
      group: '基本信息'
    } as PropertyV2,
    
    // --- 能力属性 ---
    supportedModalities: {
      apiName: 'supportedModalities',
      description: '支持的AI模态',
      displayName: '支持模态',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.aigc-tool.supported-modalities',
      valueTypeApiName: 'Modalities',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: {
        visibleInDefaultView: false
      },
      group: '能力信息'
    } as PropertyV2,
    
    platform: {
      apiName: 'platform',
      description: '支持的平台',
      displayName: '平台',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.aigc-tool.platform',
      valueTypeApiName: 'Platform',
      typeClasses: [],
      isAdvancedSearchable: true,
      renderHints: {
        visibleInDefaultView: false
      },
      group: '能力信息'
    } as PropertyV2,
    
    coreCapabilities: {
      apiName: 'coreCapabilities',
      description: '核心能力列表',
      displayName: '核心能力',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.aigc-tool.core-capabilities',
      typeClasses: [],
      isAdvancedSearchable: true,
      group: '能力信息'
    } as PropertyV2,
    
    keyFeatures: {
      apiName: 'keyFeatures',
      description: '主要功能列表',
      displayName: '主要功能',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.aigc-tool.key-features',
      typeClasses: [],
      isAdvancedSearchable: true,
      group: '能力信息'
    } as PropertyV2,
    
    // --- 标记属性 ---
    isPopular: {
      apiName: 'isPopular',
      description: '是否热门工具',
      displayName: '热门',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.is-popular',
      typeClasses: [],
      defaultValue: false,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '标记'
    } as PropertyV2,
    
    isFeatured: {
      apiName: 'isFeatured',
      description: '是否精选推荐',
      displayName: '精选',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.is-featured',
      typeClasses: [],
      defaultValue: false,
      group: '标记'
    } as PropertyV2,
    
    isVerified: {
      apiName: 'isVerified',
      description: '是否官方认证',
      displayName: '官方认证',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.is-verified',
      typeClasses: [],
      defaultValue: false,
      group: '标记'
    } as PropertyV2,
    
    isOpenSource: {
      apiName: 'isOpenSource',
      description: '是否开源',
      displayName: '开源',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.is-open-source',
      typeClasses: [],
      defaultValue: false,
      group: '标记'
    } as PropertyV2,
    
    isChineseNative: {
      apiName: 'isChineseNative',
      description: '是否国产工具',
      displayName: '国产',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.aigc-tool.is-chinese-native',
      typeClasses: [],
      defaultValue: true,
      group: '标记'
    } as PropertyV2,
    
    // --- 统计属性 ---
    viewCount: {
      apiName: 'viewCount',
      description: '浏览量',
      displayName: '浏览',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.aigc-tool.view-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '统计'
    } as PropertyV2,
    
    favoriteCount: {
      apiName: 'favoriteCount',
      description: '收藏数',
      displayName: '收藏',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.aigc-tool.favorite-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '统计'
    } as PropertyV2,
    
    compareCount: {
      apiName: 'compareCount',
      description: '被对比次数',
      displayName: '对比次数',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.aigc-tool.compare-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: {
        sortable: true,
        visibleInDefaultView: false
      },
      group: '统计'
    } as PropertyV2,
    
    averageRating: {
      apiName: 'averageRating',
      description: '平均评分(1-5分)',
      displayName: '评分',
      dataType: { type: 'double' },
      rid: 'ri.aigc.main.property.aigc-tool.average-rating',
      typeClasses: [],
      defaultValue: 0,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      valueFormatting: {
        type: 'number',
        number: {
          style: 'decimal',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      },
      group: '统计'
    } as PropertyV2,
    
    reviewCount: {
      apiName: 'reviewCount',
      description: '评价数量',
      displayName: '评价数',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.aigc-tool.review-count',
      typeClasses: [],
      defaultValue: 0,
      renderHints: {
        sortable: true,
        visibleInDefaultView: true,
        displayedAsColumn: true
      },
      group: '统计'
    } as PropertyV2,
    
    // --- 元数据 ---
    status: {
      apiName: 'status',
      description: '工具状态',
      displayName: '状态',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.aigc-tool.status',
      valueTypeApiName: 'ObjectStatus',
      typeClasses: [],
      defaultValue: 'active',
      required: true
    } as PropertyV2,
    
    createdAt: {
      description: '创建时间',
      displayName: '创建时间',
      dataType: { type: 'timestamp' },
      rid: 'ri.aigc.main.property.aigc-tool.created-at',
      typeClasses: [],
      renderHints: {
        sortable: true,
        visibleInDefaultView: false
      }
    } as PropertyV2,
    
    updatedAt: {
      description: '更新时间',
      displayName: '更新时间',
      dataType: { type: 'timestamp' },
      rid: 'ri.aigc.main.property.aigc-tool.updated-at',
      typeClasses: [],
      renderHints: {
        sortable: true,
        visibleInDefaultView: false
      }
    } as PropertyV2
  }
};

// ============================================================================
// Type exports
// ============================================================================

export type AIGCToolObjectTypeApiName = 'AIGCTool';
export type AIGCToolPropertyApiName = keyof typeof AIGCToolObjectType.properties;
export type AIGCToolRid = typeof AIGCToolObjectType.rid;

// Object instance type
export interface AIGCToolInstance {
  rid: string;
  apiName: 'AIGCTool';
  properties: {
    slug: string;
    name: string;
    fullName?: string;
    tagline?: string;
    description?: string;
    logoUrl?: string;
    websiteUrl: string;
    pricingType: 'free' | 'freemium' | 'paid' | 'subscription';
    startingPrice?: number;
    currency: string;
    freeTierLimit?: string;
    hasLifetimeFree: boolean;
    developer?: string;
    releaseDate?: Date;
    version?: string;
    supportedModalities?: string[];
    platform?: string[];
    coreCapabilities?: string[];
    keyFeatures?: string[];
    isPopular: boolean;
    isFeatured: boolean;
    isVerified: boolean;
    isOpenSource: boolean;
    isChineseNative: boolean;
    viewCount: number;
    favoriteCount: number;
    compareCount: number;
    averageRating: number;
    reviewCount: number;
    status: 'active' | 'inactive' | 'deprecated';
    createdAt: Date;
    updatedAt: Date;
  };
}
