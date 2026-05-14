/**
 * Datasource Sync Engine
 *
 * Palantir Ontology Backing Datasource 同步引擎
 * 实现 Object Type 与实际数据源的映射、同步和验证
 */

import { PrismaClient } from '@prisma/client';
import type { BackingDatasource, DatasourceType, ObjectTypeV2 } from './types';

// =============================================================================
// Types
// =============================================================================

export interface SyncResult {
  success: boolean;
  datasourceId?: string;
  objectTypeId?: string;
  errors: string[];
  warnings: string[];
  propertiesSynced?: number;
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingProperties: string[];
  extraProperties: string[];
}

export interface DatasourceInfo {
  datasource: BackingDatasource;
  objectTypeApiName: string;
  objectTypeId: string;
  validation?: ValidationResult;
}

// =============================================================================
// Prisma Model Metadata (introspection cache)
// =============================================================================

const PRISMA_MODEL_CACHE: Map<string, Record<string, string>> = new Map();

/**
 * 从 Prisma 模型定义中提取字段信息
 * 实际项目中可以通过解析 Prisma schema 文件或查询 information_schema
 */
export async function introspectPrismaModel(
  prisma: PrismaClient,
  modelName: string
): Promise<Record<string, string> | null> {
  if (PRISMA_MODEL_CACHE.has(modelName)) {
    return PRISMA_MODEL_CACHE.get(modelName)!;
  }

  try {
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = ${modelName}
        AND table_schema = 'public'
    `;

    if (!columns || columns.length === 0) {
      return null;
    }

    const fields: Record<string, string> = {};
    for (const col of columns) {
      fields[col.column_name] = col.data_type;
    }

    PRISMA_MODEL_CACHE.set(modelName, fields);
    return fields;
  } catch {
    return null;
  }
}

// =============================================================================
// Datasource Sync Engine
// =============================================================================

export class DatasourceSyncEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * 同步 Object Type 的 Backing Datasource 到数据库
   */
  async syncObjectTypeDatasources(
    objectTypeId: string,
    datasources: BackingDatasource[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const ds of datasources) {
      const result = await this.syncSingleDatasource(objectTypeId, ds);
      results.push(result);
    }

    return results;
  }

  /**
   * 同步单个 Datasource
   */
  private async syncSingleDatasource(
    objectTypeId: string,
    datasource: BackingDatasource
  ): Promise<SyncResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 验证 datasource
      const validation = await this.validateDatasource(objectTypeId, datasource);
      if (!validation.valid) {
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }

      // 检查是否已存在
      const existing = await this.prisma.datasource_mappings.findFirst({
        where: { objectTypeId, apiName: datasource.apiName },
      });

      const data = {
        objectTypeId,
        apiName: datasource.apiName,
        displayName: datasource.displayName,
        description: datasource.description ?? null,
        datasourceType: datasource.datasourceType,
        sourceIdentifier: datasource.sourceIdentifier,
        schemaName: datasource.schemaName ?? null,
        isPrimary: datasource.isPrimary,
        propertyMappings: (datasource.propertyMappings ?? {}) as any,
        supportsWrites: datasource.supportsWrites ?? true,
        syncConfig: (datasource.syncConfig ?? {}) as any,
        status: datasource.status ?? 'ACTIVE',
        updatedAt: new Date(),
      };

      let datasourceId: string;

      if (existing) {
        const updated = await this.prisma.datasource_mappings.update({
          where: { id: existing.id },
          data,
        });
        datasourceId = updated.id;
      } else {
        const created = await this.prisma.datasource_mappings.create({
          data: {
            ...data,
            id: crypto.randomUUID(),
            rid: datasource.rid ?? `ri.aigc.main.datasource.${datasource.apiName}`,
            createdAt: new Date(),
          },
        });
        datasourceId = created.id;
      }

      return {
        success: errors.length === 0,
        datasourceId,
        objectTypeId,
        errors,
        warnings,
        propertiesSynced: Object.keys(datasource.propertyMappings ?? {}).length,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        objectTypeId,
        errors: [...errors, `Sync failed: ${err.message}`],
        warnings,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 验证 Datasource 与 Object Type 的一致性
   */
  async validateDatasource(
    objectTypeId: string,
    datasource: BackingDatasource
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingProperties: string[] = [];
    const extraProperties: string[] = [];

    // 获取 Object Type 的属性定义
    const objectType = await this.prisma.object_types.findUnique({
      where: { id: objectTypeId },
    });

    if (!objectType) {
      errors.push(`Object Type ${objectTypeId} not found`);
      return { valid: false, errors, warnings, missingProperties, extraProperties };
    }

    const properties = (objectType.properties as any[]) ?? [];
    const propertyApiNames = new Set(properties.map((p: any) => p.apiName || p.name));

    // 根据 datasource 类型进行不同验证
    switch (datasource.datasourceType) {
      case 'PRISMA_MODEL': {
        const fields = await introspectPrismaModel(this.prisma, datasource.sourceIdentifier);
        if (!fields) {
          errors.push(`Prisma model '${datasource.sourceIdentifier}' not found in database schema`);
          break;
        }

        const fieldNames = new Set(Object.keys(fields));
        const mappings = datasource.propertyMappings ?? {};

        // 检查映射的属性是否存在于模型中
        for (const [propName, columnName] of Object.entries(mappings)) {
          if (!fieldNames.has(columnName as string)) {
            missingProperties.push(propName);
            errors.push(`Mapped column '${columnName}' for property '${propName}' not found in model '${datasource.sourceIdentifier}'`);
          }
        }

        // 检查 Object Type 的属性是否有映射
        for (const propName of propertyApiNames) {
          if (!mappings[propName]) {
            warnings.push(`Property '${propName}' has no datasource mapping`);
          }
        }

        break;
      }

      case 'POSTGRES_TABLE': {
        const fields = await introspectPrismaModel(this.prisma, datasource.sourceIdentifier);
        if (!fields) {
          errors.push(`Table '${datasource.sourceIdentifier}' not found`);
        }
        break;
      }

      case 'REST_API':
      case 'GRAPHQL':
        // API 类型不做结构验证，仅检查配置完整性
        if (!datasource.sourceIdentifier.startsWith('http')) {
          warnings.push(`API endpoint '${datasource.sourceIdentifier}' does not start with http/https`);
        }
        break;

      case 'CUSTOM':
        warnings.push('CUSTOM datasource type requires manual validation');
        break;
    }

    // 检查 isPrimary 唯一性
    if (datasource.isPrimary) {
      const existingPrimary = await this.prisma.datasource_mappings.findFirst({
        where: {
          objectTypeId,
          isPrimary: true,
          apiName: { not: datasource.apiName },
        },
      });
      if (existingPrimary) {
        errors.push(`Object Type already has primary datasource: ${existingPrimary.apiName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingProperties,
      extraProperties,
    };
  }

  /**
   * 获取 Object Type 的所有 Datasource 映射
   */
  async getObjectTypeDatasources(objectTypeId: string): Promise<DatasourceInfo[]> {
    const mappings = await this.prisma.datasource_mappings.findMany({
      where: { objectTypeId },
      orderBy: { isPrimary: 'desc' },
    });

    const objectType = await this.prisma.object_types.findUnique({
      where: { id: objectTypeId },
    });

    return mappings.map((m) => ({
      datasource: {
        rid: m.rid ?? undefined,
        apiName: m.apiName,
        displayName: m.displayName,
        description: m.description ?? undefined,
        datasourceType: m.datasourceType as DatasourceType,
        sourceIdentifier: m.sourceIdentifier,
        schemaName: m.schemaName ?? undefined,
        isPrimary: m.isPrimary,
        propertyMappings: (m.propertyMappings as Record<string, string>) ?? undefined,
        supportsWrites: m.supportsWrites,
        syncConfig: (m.syncConfig as any) ?? undefined,
        status: (m.status as any) ?? 'ACTIVE',
      },
      objectTypeApiName: objectType?.apiName ?? '',
      objectTypeId,
    }));
  }

  /**
   * 从 Prisma Model 自动推断并创建 Datasource 映射
   */
  async autoSyncFromPrismaModel(
    objectTypeId: string,
    prismaModelName: string
  ): Promise<SyncResult> {
    const fields = await introspectPrismaModel(this.prisma, prismaModelName);
    if (!fields) {
      return {
        success: false,
        objectTypeId,
        errors: [`Prisma model '${prismaModelName}' not found`],
        warnings: [],
        timestamp: new Date().toISOString(),
      };
    }

    // 获取 Object Type 的属性
    const objectType = await this.prisma.object_types.findUnique({
      where: { id: objectTypeId },
    });

    if (!objectType) {
      return {
        success: false,
        objectTypeId,
        errors: [`Object Type ${objectTypeId} not found`],
        warnings: [],
        timestamp: new Date().toISOString(),
      };
    }

    const properties = (objectType.properties as any[]) ?? [];
    const propertyMappings: Record<string, string> = {};
    const fieldNames = Object.keys(fields);

    // 自动匹配属性名到字段名（大小写不敏感）
    for (const prop of properties) {
      const propName = prop.apiName || prop.name;
      const matchingField = fieldNames.find(
        (f) => f.toLowerCase() === propName.toLowerCase() ||
               f.toLowerCase() === `prop_${propName.toLowerCase()}`
      );
      if (matchingField) {
        propertyMappings[propName] = matchingField;
      }
    }

    const datasource: BackingDatasource = {
      apiName: `${prismaModelName}_auto`,
      displayName: `${prismaModelName} (Auto)`,
      description: `Auto-generated datasource mapping from Prisma model ${prismaModelName}`,
      datasourceType: 'PRISMA_MODEL',
      sourceIdentifier: prismaModelName,
      isPrimary: true,
      propertyMappings,
      supportsWrites: true,
    };

    return this.syncSingleDatasource(objectTypeId, datasource);
  }
}

// =============================================================================
// Helper: Get datasource for object query
// =============================================================================

export async function getPrimaryDatasource(
  prisma: PrismaClient,
  objectTypeId: string
): Promise<BackingDatasource | null> {
  const mapping = await prisma.datasource_mappings.findFirst({
    where: { objectTypeId, isPrimary: true, status: 'active' },
  });

  if (!mapping) return null;

  return {
    rid: mapping.rid ?? undefined,
    apiName: mapping.apiName,
    displayName: mapping.displayName,
    description: mapping.description ?? undefined,
    datasourceType: mapping.datasourceType as DatasourceType,
    sourceIdentifier: mapping.sourceIdentifier,
    schemaName: mapping.schemaName ?? undefined,
    isPrimary: mapping.isPrimary,
    propertyMappings: (mapping.propertyMappings as Record<string, string>) ?? undefined,
    supportsWrites: mapping.supportsWrites,
    syncConfig: (mapping.syncConfig as any) ?? undefined,
    status: (mapping.status as any) ?? 'ACTIVE',
  };
}
