/**
 * AIGC ValueType Definitions
 * 
 * 语义层 - ValueType 定义
 * 
 * 参考: docs/packages/core/src/types/value-type.ts
 */

import type { OntologyValueType } from '../../types';

/**
 * ValueType: PricingType
 * 定价模式枚举
 */
export const pricingTypeValueType: OntologyValueType = {
  apiName: 'PricingType',
  displayName: '定价模式',
  description: 'AI工具的收费模式',
  rid: 'ri.aigc.main.value-type.pricing-type',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['free', 'freemium', 'paid', 'subscription']
      }
    }
  ]
};

/**
 * ValueType: Currency
 * 货币代码
 */
export const currencyValueType: OntologyValueType = {
  apiName: 'Currency',
  displayName: '货币',
  description: 'ISO 4217货币代码',
  rid: 'ri.aigc.main.value-type.currency',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['CNY', 'USD', 'EUR', 'JPY', 'GBP']
      }
    }
  ]
};

/**
 * ValueType: Modalities
 * AI模态
 */
export const modalitiesValueType: OntologyValueType = {
  apiName: 'Modalities',
  displayName: 'AI模态',
  description: '支持的AI模态类型',
  rid: 'ri.aigc.main.value-type.modalities',
  status: 'ACTIVE',
  fieldType: { type: 'list', innerType: { type: 'string' } },
  version: '1.0.0',
  constraints: [
    {
      type: 'array',
      array: {
        uniqueValues: true,
        valueConstraint: {
          type: 'enum',
          enum: {
            options: ['text', 'image', 'video', 'audio', 'code', '3d']
          }
        }
      }
    }
  ]
};

/**
 * ValueType: Platform
 * 支持的平台
 */
export const platformValueType: OntologyValueType = {
  apiName: 'Platform',
  displayName: '平台',
  description: '支持的平台类型',
  rid: 'ri.aigc.main.value-type.platform',
  status: 'ACTIVE',
  fieldType: { type: 'list', innerType: { type: 'string' } },
  version: '1.0.0',
  constraints: [
    {
      type: 'array',
      array: {
        uniqueValues: true,
        valueConstraint: {
          type: 'enum',
          enum: {
            options: ['web', 'mobile-ios', 'mobile-android', 'desktop-windows', 'desktop-mac', 'desktop-linux', 'api', 'plugin-browser', 'plugin-vscode']
          }
        }
      }
    }
  ]
};

/**
 * ValueType: CapabilityCategory
 * 能力分类
 */
export const capabilityCategoryValueType: OntologyValueType = {
  apiName: 'CapabilityCategory',
  displayName: '能力分类',
  description: 'AI能力分类',
  rid: 'ri.aigc.main.value-type.capability-category',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['text-generation', 'image-generation', 'video-generation', 'audio-generation', 'code-generation', 'reasoning', 'multimodal']
      }
    }
  ]
};

/**
 * ValueType: RelationshipType
 * 竞品关系类型
 */
export const relationshipTypeValueType: OntologyValueType = {
  apiName: 'RelationshipType',
  displayName: '关系类型',
  description: '工具间的关系类型',
  rid: 'ri.aigc.main.value-type.relationship-type',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['direct-competitor', 'alternative', 'complement', 'upgrade', 'downgrade']
      }
    }
  ]
};

/**
 * ValueType: Region
 * 地区
 */
export const regionValueType: OntologyValueType = {
  apiName: 'Region',
  displayName: '地区',
  description: '地理区域',
  rid: 'ri.aigc.main.value-type.region',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['CN', 'US', 'EU', 'GLOBAL']
      }
    }
  ]
};

/**
 * ValueType: PlanType
 * 方案类型
 */
export const planTypeValueType: OntologyValueType = {
  apiName: 'PlanType',
  displayName: '方案类型',
  description: '定价方案类型',
  rid: 'ri.aigc.main.value-type.plan-type',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['free', 'starter', 'pro', 'enterprise', 'custom']
      }
    }
  ]
};

/**
 * ValueType: ObjectStatus
 * 对象状态
 */
export const objectStatusValueType: OntologyValueType = {
  apiName: 'ObjectStatus',
  displayName: '对象状态',
  description: '工具或对象的状态',
  rid: 'ri.aigc.main.value-type.object-status',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'enum',
      enum: {
        options: ['active', 'inactive', 'deprecated', 'acquired']
      }
    }
  ]
};

/**
 * ValueType: ImageURL
 * 图片URL
 */
export const imageURLValueType: OntologyValueType = {
  apiName: 'ImageURL',
  displayName: '图片URL',
  description: '图片资源URL',
  rid: 'ri.aigc.main.value-type.image-url',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'regex',
      regex: {
        pattern: '^(https?://)?[\\w\\-]+(\\.[\\w\\-]+)+[\\w\\-.,@?^=%&:/~+#]*\\.(jpg|jpeg|png|gif|webp|svg)$',
        partialMatch: false
      }
    }
  ]
};

/**
 * ValueType: URL
 * 网页URL
 */
export const urlValueType: OntologyValueType = {
  apiName: 'URL',
  displayName: '网页URL',
  description: '网页链接URL',
  rid: 'ri.aigc.main.value-type.url',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'regex',
      regex: {
        pattern: '^https?://[\\w\\-]+(\\.[\\w\\-]+)+.*$',
        partialMatch: false
      }
    }
  ]
};

/**
 * ValueType: Color
 * 颜色代码
 */
export const colorValueType: OntologyValueType = {
  apiName: 'Color',
  displayName: '颜色',
  description: '十六进制颜色代码',
  rid: 'ri.aigc.main.value-type.color',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'regex',
      regex: {
        pattern: '^#[0-9A-Fa-f]{6}$',
        partialMatch: false
      }
    }
  ]
};

/**
 * ValueType: SemanticVersion
 * 语义化版本
 */
export const semanticVersionValueType: OntologyValueType = {
  apiName: 'SemanticVersion',
  displayName: '语义化版本',
  description: '语义化版本号 (major.minor.patch)',
  rid: 'ri.aigc.main.value-type.semantic-version',
  status: 'ACTIVE',
  fieldType: { type: 'string' },
  version: '1.0.0',
  constraints: [
    {
      type: 'regex',
      regex: {
        pattern: '^\\d+\\.\\d+\\.\\d+(-[\\w.]+)?(\\+[\\w.]+)?$',
        partialMatch: false
      }
    }
  ]
};

/**
 * Export all ValueTypes
 */
export const aigcValueTypes: OntologyValueType[] = [
  pricingTypeValueType,
  currencyValueType,
  modalitiesValueType,
  platformValueType,
  capabilityCategoryValueType,
  relationshipTypeValueType,
  regionValueType,
  planTypeValueType,
  objectStatusValueType,
  imageURLValueType,
  urlValueType,
  colorValueType,
  semanticVersionValueType
];
