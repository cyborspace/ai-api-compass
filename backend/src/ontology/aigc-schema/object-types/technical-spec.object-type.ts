/**
 * TechnicalSpec ObjectType
 * 
 * 语义层 - 技术规格
 */

import type { ObjectTypeV2, PropertyV2 } from '../../types';

export const TechnicalSpecObjectType: ObjectTypeV2 = {
  apiName: 'TechnicalSpec',
  displayName: '技术规格',
  pluralDisplayName: '技术规格列表',
  status: 'ACTIVE',
  description: 'AI工具的技术规格参数',
  icon: {
    blueprint: {
      color: '#6366F1',
      name: 'Settings'
    }
  },
  primaryKey: 'toolSlug',
  titleProperty: 'toolSlug',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.object-type.technical-spec',
  metaKind: 'Specification',
  entityLevel: 'MetaEntity',
  groups: [{ apiName: 'Comparison', displayName: '对比分析' }],
  aliases: ['技术参数', '规格', '配置'],

  properties: {
    toolSlug: {
      description: '关联的工具slug',
      displayName: '工具',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.technical-spec.tool-slug',
      typeClasses: [],
      required: true,
      isUnique: true,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    modelType: {
      description: '模型类型',
      displayName: '模型类型',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.technical-spec.model-type',
      typeClasses: []
    } as PropertyV2,

    maxContextLength: {
      description: '最大上下文长度',
      displayName: '上下文',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.technical-spec.max-context-length',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    maxTokens: {
      description: '最大输出tokens',
      displayName: '最大输出',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.technical-spec.max-tokens',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    avgLatency: {
      description: '平均延迟(ms)',
      displayName: '平均延迟',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.technical-spec.avg-latency',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    throughput: {
      description: '吞吐量(tokens/s)',
      displayName: '吞吐量',
      dataType: { type: 'integer' },
      rid: 'ri.aigc.main.property.technical-spec.throughput',
      typeClasses: [],
      renderHints: { sortable: true, visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    supportsStreaming: {
      description: '是否支持流式输出',
      displayName: '流式输出',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.technical-spec.supports-streaming',
      typeClasses: [],
      defaultValue: false,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    supportsFunctionCalling: {
      description: '是否支持函数调用',
      displayName: '函数调用',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.technical-spec.supports-function-calling',
      typeClasses: [],
      defaultValue: false,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    supportsVision: {
      description: '是否支持视觉理解',
      displayName: '视觉理解',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.technical-spec.supports-vision',
      typeClasses: [],
      defaultValue: false,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    openaiCompatible: {
      description: '是否OpenAI兼容',
      displayName: 'OpenAI兼容',
      dataType: { type: 'boolean' },
      rid: 'ri.aigc.main.property.technical-spec.openai-compatible',
      typeClasses: [],
      defaultValue: false,
      renderHints: { visibleInDefaultView: true, displayedAsColumn: true }
    } as PropertyV2,

    apiEndpoint: {
      description: 'API端点',
      displayName: 'API端点',
      dataType: { type: 'string' },
      rid: 'ri.aigc.main.property.technical-spec.api-endpoint',
      valueTypeApiName: 'URL',
      typeClasses: []
    } as PropertyV2,

    sdkLanguages: {
      description: 'SDK支持的语言',
      displayName: 'SDK语言',
      dataType: { type: 'list', innerType: { type: 'string' } },
      rid: 'ri.aigc.main.property.technical-spec.sdk-languages',
      typeClasses: []
    } as PropertyV2
  }
};

export type TechnicalSpecPropertyApiName = keyof typeof TechnicalSpecObjectType.properties;
