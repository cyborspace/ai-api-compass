/**
 * Shared Properties System
 * 
 * 实现 Palantir Foundry 风格的共享属性系统
 * 允许在多个 ObjectType 之间共享属性定义
 */

import type { PropertyV2, ObjectTypeV2 } from './types';

export interface SharedPropertyDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  dataType: { type: string; [key: string]: any };
  required?: boolean;
  defaultValue?: any;
  valueTypeApiName?: string;
  typeClasses?: string[];
  renderHints?: PropertyV2['renderHints'];
  constraints?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface SharedPropertyUsage {
  propertyName: string;
  sharedPropertyApiName: string;
  overrides?: {
    displayName?: string;
    description?: string;
    required?: boolean;
    defaultValue?: any;
    renderHints?: PropertyV2['renderHints'];
  };
}

/**
 * Shared Properties Registry
 * 
 * 管理和注册所有共享属性
 */
export class SharedPropertiesRegistry {
  private sharedProperties: Map<string, SharedPropertyDefinition> = new Map();
  private objectTypeProperties: Map<string, Map<string, SharedPropertyUsage>> = new Map();

  constructor() {
    this.registerDefaultSharedProperties();
  }

  /**
   * Register a shared property
   */
  register(property: SharedPropertyDefinition): void {
    this.sharedProperties.set(property.apiName, property);
  }

  /**
   * Get a shared property
   */
  get(name: string): SharedPropertyDefinition | undefined {
    return this.sharedProperties.get(name);
  }

  /**
   * Get all shared properties
   */
  getAll(): SharedPropertyDefinition[] {
    return Array.from(this.sharedProperties.values());
  }

  /**
   * Register a usage of a shared property in an ObjectType
   */
  registerUsage(objectTypeApiName: string, usage: SharedPropertyUsage): void {
    if (!this.objectTypeProperties.has(objectTypeApiName)) {
      this.objectTypeProperties.set(objectTypeApiName, new Map());
    }
    this.objectTypeProperties.get(objectTypeApiName)!.set(usage.propertyName, usage);
  }

  /**
   * Get shared property usages for an ObjectType
   */
  getUsages(objectTypeApiName: string): SharedPropertyUsage[] {
    const usages = this.objectTypeProperties.get(objectTypeApiName);
    return usages ? Array.from(usages.values()) : [];
  }

  /**
   * Resolve shared property to concrete property definition
   */
  resolveSharedProperty(
    objectTypeApiName: string,
    propertyName: string
  ): PropertyV2 | undefined {
    const usage = this.objectTypeProperties.get(objectTypeApiName)?.get(propertyName);
    if (!usage) {
      return undefined;
    }

    const sharedProperty = this.sharedProperties.get(usage.sharedPropertyApiName);
    if (!sharedProperty) {
      return undefined;
    }

    return this.applyOverrides(sharedProperty, usage.propertyName, usage.overrides);
  }

  /**
   * Get all resolved properties for an ObjectType
   */
  getResolvedProperties(objectTypeApiName: string): PropertyV2[] {
    const usages = this.getUsages(objectTypeApiName);
    const resolved: PropertyV2[] = [];

    for (const usage of usages) {
      const resolvedProperty = this.resolveSharedProperty(objectTypeApiName, usage.propertyName);
      if (resolvedProperty) {
        resolved.push(resolvedProperty);
      }
    }

    return resolved;
  }

  /**
   * Apply overrides to a shared property
   */
  private applyOverrides(
    sharedProperty: SharedPropertyDefinition,
    apiName: string,
    overrides?: SharedPropertyUsage['overrides']
  ): PropertyV2 {
    return {
      apiName,
      displayName: overrides?.displayName || sharedProperty.displayName,
      description: overrides?.description || sharedProperty.description,
      dataType: sharedProperty.dataType,
      required: overrides?.required ?? sharedProperty.required,
      defaultValue: overrides?.defaultValue ?? sharedProperty.defaultValue,
      valueType: sharedProperty.valueTypeApiName,
      typeClasses: sharedProperty.typeClasses,
      renderHints: overrides?.renderHints || sharedProperty.renderHints,
    };
  }

  /**
   * Register default shared properties for AIGC system
   */
  private registerDefaultSharedProperties(): void {
    this.register({
      apiName: 'shared.name',
      displayName: '名称',
      description: '实体名称',
      dataType: { type: 'string', maxLength: 255 },
      required: true,
      typeClasses: ['PRIMARY_KEY'],
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: true,
      },
    });

    this.register({
      apiName: 'shared.slug',
      displayName: 'Slug标识',
      description: 'URL友好的唯一标识符',
      dataType: { type: 'string', maxLength: 100 },
      required: true,
      typeClasses: ['UNIQUE_KEY'],
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.description',
      displayName: '描述',
      description: '实体描述',
      dataType: { type: 'string', maxLength: 2000 },
      typeClasses: ['TEXT'],
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: false,
      },
    });

    this.register({
      apiName: 'shared.status',
      displayName: '状态',
      description: '实体状态',
      dataType: { type: 'string' },
      defaultValue: 'active',
      constraints: {
        options: ['active', 'inactive', 'deprecated'],
      },
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: true,
      },
    });

    this.register({
      apiName: 'shared.createdAt',
      displayName: '创建时间',
      description: '创建时间戳',
      dataType: { type: 'timestamp' },
      required: true,
      typeClasses: ['AUDIT_FIELD'],
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.updatedAt',
      displayName: '更新时间',
      description: '最后更新时间戳',
      dataType: { type: 'timestamp' },
      typeClasses: ['AUDIT_FIELD'],
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.createdBy',
      displayName: '创建人',
      description: '创建人用户ID',
      dataType: { type: 'string' },
      typeClasses: ['AUDIT_FIELD'],
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.tags',
      displayName: '标签',
      description: '标签列表',
      dataType: { type: 'array', innerType: { type: 'string' } },
      renderHints: {
        searchable: true,
        visibleInDefaultView: true,
      },
    });

    this.register({
      apiName: 'shared.version',
      displayName: '版本号',
      description: '实体版本号',
      dataType: { type: 'integer' },
      defaultValue: 1,
      typeClasses: ['VERSION_FIELD'],
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.averageRating',
      displayName: '平均评分',
      description: '平均用户评分',
      dataType: { type: 'float' },
      constraints: {
        min: 0,
        max: 5,
      },
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: true,
        sortable: true,
      },
    });

    this.register({
      apiName: 'shared.viewCount',
      displayName: '浏览次数',
      description: '浏览总次数',
      dataType: { type: 'integer' },
      defaultValue: 0,
      typeClasses: ['METRIC'],
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: true,
        sortable: true,
      },
    });

    this.register({
      apiName: 'shared.favoriteCount',
      displayName: '收藏次数',
      description: '收藏总次数',
      dataType: { type: 'integer' },
      defaultValue: 0,
      typeClasses: ['METRIC'],
      renderHints: {
        visibleInDefaultView: true,
        displayedAsColumn: true,
        sortable: true,
      },
    });

    this.register({
      apiName: 'shared.imageUrl',
      displayName: '图片URL',
      description: '实体图片URL',
      dataType: { type: 'string', maxLength: 500 },
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.iconName',
      displayName: '图标名称',
      description: '图标名称',
      dataType: { type: 'string', maxLength: 100 },
      renderHints: {
        visibleInDefaultView: false,
      },
    });

    this.register({
      apiName: 'shared.color',
      displayName: '颜色',
      description: '显示颜色',
      dataType: { type: 'string', maxLength: 20 },
      renderHints: {
        visibleInDefaultView: false,
      },
    });
  }
}

/**
 * Global shared properties registry instance
 */
export const sharedPropertiesRegistry = new SharedPropertiesRegistry();

/**
 * Helper to register shared property usage in an ObjectType
 */
export function useSharedProperty(
  objectTypeApiName: string,
  propertyName: string,
  sharedPropertyApiName: string,
  overrides?: SharedPropertyUsage['overrides']
): void {
  sharedPropertiesRegistry.registerUsage(objectTypeApiName, {
    propertyName,
    sharedPropertyApiName,
    overrides,
  });
}

/**
 * Helper to build ObjectType with shared properties
 */
export function buildObjectTypeWithSharedProperties(
  objectType: ObjectTypeV2,
  sharedPropertyNames?: string[]
): ObjectTypeV2 {
  const apiName = objectType.apiName!;
  
  // If no specific shared properties listed, use all for this object type
  if (!sharedPropertyNames) {
    const usages = sharedPropertiesRegistry.getUsages(apiName);
    sharedPropertyNames = usages.map((u) => u.propertyName);
  }

  // Resolve and add shared properties
  const resolvedProperties: { [key: string]: PropertyV2 } = {};
  
  for (const name of sharedPropertyNames) {
    const resolved = sharedPropertiesRegistry.resolveSharedProperty(apiName, name);
    if (resolved) {
      resolvedProperties[name] = resolved;
    }
  }

  return {
    ...objectType,
    properties: {
      ...resolvedProperties,
      ...objectType.properties,
    },
  };
}
