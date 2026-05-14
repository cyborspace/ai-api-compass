/**
 * Bidirectional Sync Engine
 *
 * 双向同步引擎
 * 实现数据变更的双向同步和冲突解决
 */

import type { PrismaClient } from '@prisma/client';
import type {
  DataSourceConfig,
  DataRecord,
  SyncResult,
  SyncError,
  ChangeEvent,
  WriteResult,
} from './types.js';
import { BaseConnector } from './connectors/base-connector.js';

export interface BidirectionalSyncConfig {
  dataSourceId: string;
  objectType: string;
  syncDirection: 'pull' | 'push' | 'bidirectional';
  conflictResolution: 'source_wins' | 'target_wins' | 'timestamp' | 'manual';
  syncInterval?: number; // milliseconds
  batchSize?: number;
  enabled: boolean;
}

export interface SyncChange {
  id: string;
  objectType: string;
  objectId: string;
  changeType: 'create' | 'update' | 'delete';
  source: 'local' | 'remote';
  before?: Record<string, any>;
  after?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolution?: 'source_wins' | 'target_wins' | 'merged';
}

export class BidirectionalSyncEngine {
  private prisma: PrismaClient;
  private connectors: Map<string, BaseConnector>;
  private syncConfigs: Map<string, BidirectionalSyncConfig> = new Map();
  private changeLog: Map<string, SyncChange[]> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(prisma: PrismaClient, connectors: Map<string, BaseConnector>) {
    this.prisma = prisma;
    this.connectors = connectors;
  }

  /**
   * Register bidirectional sync configuration
   */
  registerSync(config: BidirectionalSyncConfig): void {
    this.syncConfigs.set(config.dataSourceId, config);

    if (config.enabled && config.syncInterval) {
      this.startPeriodicSync(config.dataSourceId, config.syncInterval);
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(dataSourceId: string, interval: number): void {
    // Clear existing interval
    this.stopPeriodicSync(dataSourceId);

    // Start new interval
    const intervalId = setInterval(async () => {
      try {
        await this.sync(dataSourceId);
      } catch (error) {
        console.error(`[${dataSourceId}] Periodic sync failed:`, error);
      }
    }, interval);

    this.syncIntervals.set(dataSourceId, intervalId);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(dataSourceId: string): void {
    const intervalId = this.syncIntervals.get(dataSourceId);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(dataSourceId);
    }
  }

  /**
   * Execute bidirectional sync
   */
  async sync(dataSourceId: string): Promise<SyncResult> {
    const config = this.syncConfigs.get(dataSourceId);
    if (!config) {
      throw new Error(`Sync config not found: ${dataSourceId}`);
    }

    const connector = this.connectors.get(dataSourceId);
    if (!connector) {
      throw new Error(`Connector not found: ${dataSourceId}`);
    }

    const syncId = `bidir-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      let pullResult: { created: number; updated: number; deleted: number; errors: SyncError[] } = {
        created: 0, updated: 0, deleted: 0, errors: []
      };
      let pushResult: { created: number; updated: number; deleted: number; errors: SyncError[] } = {
        created: 0, updated: 0, deleted: 0, errors: []
      };

      // Pull from source
      if (config.syncDirection === 'pull' || config.syncDirection === 'bidirectional') {
        pullResult = await this.pullFromSource(connector, config);
      }

      // Push to source
      if (config.syncDirection === 'push' || config.syncDirection === 'bidirectional') {
        pushResult = await this.pushToSource(connector, config);
      }

      return {
        success: true,
        dataSourceId,
        syncId,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
        stats: {
          totalRecords: pullResult.created + pullResult.updated + pushResult.created + pushResult.updated,
          processedRecords: pullResult.created + pullResult.updated + pushResult.created + pushResult.updated,
          failedRecords: pullResult.errors.length + pushResult.errors.length,
          bytesTransferred: 0,
          apiCalls: 0,
          dbQueries: 0,
        },
        created: pullResult.created + pushResult.created,
        updated: pullResult.updated + pushResult.updated,
        deleted: pullResult.deleted + pushResult.deleted,
        unchanged: 0,
        errors: [...pullResult.errors, ...pushResult.errors],
      };
    } catch (error) {
      return {
        success: false,
        dataSourceId,
        syncId,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
        stats: {
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 1,
          bytesTransferred: 0,
          apiCalls: 0,
          dbQueries: 0,
        },
        created: 0,
        updated: 0,
        deleted: 0,
        unchanged: 0,
        errors: [{
          code: 'BIDIRECTIONAL_SYNC_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        }],
      };
    }
  }

  /**
   * Pull data from source
   */
  private async pullFromSource(
    connector: BaseConnector,
    config: BidirectionalSyncConfig
  ): Promise<{ created: number; updated: number; deleted: number; errors: SyncError[] }> {
    const dsConfig = connector.config;
    const objectType = config.objectType;
    const pkField = dsConfig.mapping.primaryKey.target;

    let created = 0;
    let updated = 0;
    let deleted = 0;
    const errors: SyncError[] = [];

    try {
      // Read from source
      const records = await connector.read({
        entity: dsConfig.mapping.sourceEntity,
        limit: config.batchSize || 1000,
      });

      for (const record of records) {
        try {
          // Check for conflicts
          const existing = await this.prisma.objects.findFirst({
            where: {
              object_types: { apiName: objectType },
              properties: {
                path: [pkField],
                equals: record[pkField],
              },
            },
          });

          if (existing) {
            // Check for conflict
            const localUpdatedAt = existing.updatedAt;
            const remoteUpdatedAt = record.updatedAt ? new Date(record.updatedAt) : new Date();

            const hasConflict = this.hasRecordChanged(
              existing.properties as Record<string, any>,
              record
            );

            if (hasConflict) {
              const resolution = this.resolveConflict(
                config.conflictResolution,
                existing.properties as Record<string, any>,
                record,
                localUpdatedAt,
                remoteUpdatedAt
              );

              // Log conflict
              this.logChange({
                id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                objectType,
                objectId: record[pkField],
                changeType: 'update',
                source: 'remote',
                before: existing.properties as Record<string, any>,
                after: resolution,
                timestamp: new Date(),
                resolved: true,
                resolution: config.conflictResolution === 'timestamp' ? 'source_wins' : (config.conflictResolution as any),
              });

              // Apply resolution
              await this.prisma.objects.update({
                where: { id: existing.id },
                data: {
                  properties: resolution,
                  updatedAt: new Date(),
                },
              });
              updated++;
            } else {
              // No conflict, just update timestamp
              await this.prisma.objects.update({
                where: { id: existing.id },
                data: { updatedAt: new Date() },
              });
            }
          } else {
            // Create new record
            await this.prisma.objects.create({
              data: {
                id: crypto.randomUUID(),
                rid: `ri.aigc.main.objects.${objectType.toLowerCase()}.${record[pkField]}`,
                object_types: {
                  connect: { apiName: objectType },
                },
                properties: record,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            created++;

            // Log change
            this.logChange({
              id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              objectType,
              objectId: record[pkField],
              changeType: 'create',
              source: 'remote',
              after: record,
              timestamp: new Date(),
              resolved: true,
            });
          }
        } catch (error) {
          errors.push({
            recordId: record.id,
            code: 'PULL_ERROR',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      errors.push({
        code: 'PULL_BATCH_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }

    return { created, updated, deleted, errors };
  }

  /**
   * Push data to source
   */
  private async pushToSource(
    connector: BaseConnector,
    config: BidirectionalSyncConfig
  ): Promise<{ created: number; updated: number; deleted: number; errors: SyncError[] }> {
    const objectType = config.objectType;
    const dsConfig = connector.config;
    const pkField = dsConfig.mapping.primaryKey.target;

    let created = 0;
    let updated = 0;
    let deleted = 0;
    const errors: SyncError[] = [];

    try {
      // Find local changes that need to be pushed
      const pendingChanges = await this.prisma.objects.findMany({
        where: {
          object_types: { apiName: objectType },
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        take: config.batchSize || 1000,
      });

      // Get current source records to check for conflicts
      const sourceRecords = await connector.read({
        entity: dsConfig.mapping.sourceEntity,
        limit: config.batchSize || 1000,
      });

      const sourceRecordMap = new Map(sourceRecords.map(r => [r[pkField], r]));

      for (const localRecord of pendingChanges) {
        try {
          const localProps = localRecord.properties as Record<string, any>;
          const localPk = localProps[pkField];
          const sourceRecord = sourceRecordMap.get(localPk);

          if (sourceRecord) {
            // Check for conflict
            const hasConflict = this.hasRecordChanged(sourceRecord, localProps);

            if (hasConflict) {
              const resolution = this.resolveConflict(
                config.conflictResolution,
                sourceRecord,
                localProps,
                new Date(),
                localRecord.updatedAt
              );

              // Update source with resolution
              const mappedRecord = this.mapRecordToSource(resolution, dsConfig);
              const writeResult = await connector.update([mappedRecord]);

              if (writeResult.success) {
                updated++;

                // Log change
                this.logChange({
                  id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  objectType,
                  objectId: localPk,
                  changeType: 'update',
                  source: 'local',
                  before: sourceRecord,
                  after: resolution,
                  timestamp: new Date(),
                  resolved: true,
                  resolution: config.conflictResolution === 'timestamp' ? 'target_wins' : (config.conflictResolution as any),
                });
              } else {
                errors.push(...writeResult.errors);
              }
            }
          } else {
            // Record doesn't exist in source, create it
            const mappedRecord = this.mapRecordToSource(localProps, dsConfig);
            const writeResult = await connector.write([mappedRecord]);

            if (writeResult.success) {
              created++;

              // Log change
              this.logChange({
                id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                objectType,
                objectId: localPk,
                changeType: 'create',
                source: 'local',
                after: localProps,
                timestamp: new Date(),
                resolved: true,
              });
            } else {
              errors.push(...writeResult.errors);
            }
          }
        } catch (error) {
          errors.push({
            recordId: localRecord.id,
            code: 'PUSH_ERROR',
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      errors.push({
        code: 'PUSH_BATCH_ERROR',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }

    return { created, updated, deleted, errors };
  }

  /**
   * Resolve conflict between local and remote records
   */
  private resolveConflict(
    strategy: string,
    local: Record<string, any>,
    remote: Record<string, any>,
    localUpdatedAt: Date,
    remoteUpdatedAt: Date
  ): Record<string, any> {
    switch (strategy) {
      case 'source_wins':
        return { ...remote };
      case 'target_wins':
        return { ...local };
      case 'timestamp':
        return remoteUpdatedAt > localUpdatedAt ? { ...remote } : { ...local };
      case 'manual':
        // In manual mode, mark for review and return local
        return { ...local, _conflict: true, _conflictFields: this.getConflictFields(local, remote) };
      default:
        return { ...remote };
    }
  }

  /**
   * Get conflict fields
   */
  private getConflictFields(local: Record<string, any>, remote: Record<string, any>): string[] {
    const fields: string[] = [];
    for (const key of Object.keys(remote)) {
      if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
        fields.push(key);
      }
    }
    return fields;
  }

  /**
   * Check if record has changed
   */
  private hasRecordChanged(current: Record<string, any>, incoming: Record<string, any>): boolean {
    for (const key of Object.keys(incoming)) {
      if (key.startsWith('_')) continue; // Skip metadata
      if (JSON.stringify(current[key]) !== JSON.stringify(incoming[key])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Map record to source format
   */
  private mapRecordToSource(record: Record<string, any>, config: DataSourceConfig): DataRecord {
    const result: DataRecord = { id: '' };

    // Map primary key
    const pkMapping = config.mapping.primaryKey;
    result[pkMapping.source] = record[pkMapping.target];
    result.id = String(record[pkMapping.target]);

    // Map fields
    for (const fieldMapping of config.mapping.fields) {
      const targetValue = record[fieldMapping.target];
      if (targetValue !== undefined) {
        result[fieldMapping.source] = targetValue;
      }
    }

    return result;
  }

  /**
   * Log a sync change
   */
  private logChange(change: SyncChange): void {
    const changes = this.changeLog.get(change.objectType) || [];
    changes.push(change);
    this.changeLog.set(change.objectType, changes);

    // Keep only last 1000 changes per object type
    if (changes.length > 1000) {
      this.changeLog.set(change.objectType, changes.slice(-1000));
    }
  }

  /**
   * Get change log
   */
  getChangeLog(objectType: string): SyncChange[] {
    return this.changeLog.get(objectType) || [];
  }

  /**
   * Clear change log
   */
  clearChangeLog(objectType: string): void {
    this.changeLog.delete(objectType);
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(objectType: string): SyncChange[] {
    const changes = this.changeLog.get(objectType) || [];
    return changes.filter(c => !c.resolved);
  }

  /**
   * Resolve manual conflict
   */
  async resolveManualConflict(
    changeId: string,
    resolution: 'source_wins' | 'target_wins' | 'merged',
    mergedData?: Record<string, any>
  ): Promise<void> {
    for (const [objectType, changes] of this.changeLog.entries()) {
      const change = changes.find(c => c.id === changeId);
      if (change) {
        change.resolved = true;
        change.resolution = resolution;

        if (resolution === 'merged' && mergedData) {
          change.after = mergedData;
        } else if (resolution === 'source_wins') {
          change.after = change.before;
        }

        // Apply resolution
        const connector = this.connectors.get(change.objectType);
        if (connector && change.after) {
          await connector.update([change.after as DataRecord]);
        }

        break;
      }
    }
  }

  /**
   * Stop all syncs
   */
  stopAllSyncs(): void {
    for (const [dataSourceId, intervalId] of this.syncIntervals.entries()) {
      clearInterval(intervalId);
      console.log(`[${dataSourceId}] Periodic sync stopped`);
    }
    this.syncIntervals.clear();
  }
}
