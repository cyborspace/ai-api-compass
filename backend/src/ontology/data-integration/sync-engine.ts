/**
 * Sync Engine
 *
 * 数据同步引擎
 * 支持全量同步、增量同步、定时同步
 */

import type { PrismaClient } from '@prisma/client';
import type {
  DataSourceConfig,
  DataQuery,
  DataRecord,
  SyncResult,
  SyncStats,
  SyncError,
  ChangeEvent,
} from './types.js';
import { BaseConnector } from './connectors/base-connector.js';
import { RestApiConnector } from './connectors/rest-api-connector.js';
import { DatabaseConnector } from './connectors/database-connector.js';

export class SyncEngine {
  private prisma: PrismaClient;
  private connectors: Map<string, BaseConnector> = new Map();
  private syncJobs: Map<string, AbortController> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a data source connector
   */
  registerConnector(config: DataSourceConfig): BaseConnector {
    let connector: BaseConnector;

    switch (config.type) {
      case 'rest_api':
        connector = new RestApiConnector(config);
        break;
      case 'database':
        connector = new DatabaseConnector(config);
        break;
      default:
        throw new Error(`Unsupported connector type: ${config.type}`);
    }

    this.connectors.set(config.id, connector);
    return connector;
  }

  /**
   * Get a registered connector
   */
  getConnector(id: string): BaseConnector | undefined {
    return this.connectors.get(id);
  }

  /**
   * Remove a connector
   */
  removeConnector(id: string): void {
    const connector = this.connectors.get(id);
    if (connector) {
      connector.disconnect().catch(console.error);
      this.connectors.delete(id);
    }
  }

  /**
   * Execute full sync
   */
  async fullSync(dataSourceId: string): Promise<SyncResult> {
    const connector = this.getConnector(dataSourceId);
    if (!connector) {
      throw new Error(`Connector not found: ${dataSourceId}`);
    }

    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Ensure connection
      if (connector.status !== 'connected') {
        await connector.connect();
      }

      // Build query
      const query: DataQuery = {
        entity: connector.config.mapping.sourceEntity,
        limit: connector.config.sync.batchSize || 1000,
      };

      // Read all data from source
      const records: DataRecord[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const batch = await connector.read({ ...query, offset });
        records.push(...batch);
        hasMore = batch.length === query.limit;
        offset += batch.length;
      }

      // Sync to database
      const result = await this.syncRecordsToDatabase(connector.config, records);

      return {
        success: true,
        dataSourceId,
        syncId,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
        stats: {
          totalRecords: records.length,
          processedRecords: result.processed,
          failedRecords: result.errors.length,
          bytesTransferred: JSON.stringify(records).length,
          apiCalls: Math.ceil(records.length / (connector.config.sync.batchSize || 1000)),
          dbQueries: result.dbQueries,
        },
        created: result.created,
        updated: result.updated,
        deleted: 0,
        unchanged: result.unchanged,
        errors: result.errors,
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
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        }],
      };
    }
  }

  /**
   * Execute incremental sync
   */
  async incrementalSync(dataSourceId: string, cursor?: string): Promise<SyncResult> {
    const connector = this.getConnector(dataSourceId);
    if (!connector) {
      throw new Error(`Connector not found: ${dataSourceId}`);
    }

    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Ensure connection
      if (connector.status !== 'connected') {
        await connector.connect();
      }

      const config = connector.config;
      const incrementalField = config.sync.incrementalField;

      if (!incrementalField) {
        throw new Error('Incremental field not configured');
      }

      // TODO: dataSourceSync model does not exist in current schema
      const lastSync = null;
      // const lastSync = await this.prisma.dataSourceSync.findFirst({
      //   where: { dataSourceId },
      //   orderBy: { startedAt: 'desc' },
      // });

      const lastCursor = cursor || lastSync?.nextCursor;

      // Build query with incremental filter
      const query: DataQuery = {
        entity: config.mapping.sourceEntity,
        limit: config.sync.batchSize || 1000,
        filter: lastCursor ? [{
          field: incrementalField,
          operator: 'gt',
          value: lastCursor,
        }] : undefined,
      };

      // Read incremental data
      const records = await connector.read(query);

      // Sync to database
      const result = await this.syncRecordsToDatabase(config, records);

      // Calculate next cursor
      const nextCursor = records.length > 0
        ? String(records[records.length - 1][incrementalField])
        : lastCursor;

      return {
        success: true,
        dataSourceId,
        syncId,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
        stats: {
          totalRecords: records.length,
          processedRecords: result.processed,
          failedRecords: result.errors.length,
          bytesTransferred: JSON.stringify(records).length,
          apiCalls: 1,
          dbQueries: result.dbQueries,
        },
        created: result.created,
        updated: result.updated,
        deleted: 0,
        unchanged: result.unchanged,
        errors: result.errors,
        nextCursor: nextCursor || undefined,
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
          code: 'INCREMENTAL_SYNC_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        }],
      };
    }
  }

  /**
   * Start real-time sync
   */
  async startRealtimeSync(dataSourceId: string, callback?: (event: ChangeEvent) => void): Promise<void> {
    const connector = this.getConnector(dataSourceId);
    if (!connector) {
      throw new Error(`Connector not found: ${dataSourceId}`);
    }

    if (!connector.subscribe) {
      throw new Error('Connector does not support real-time sync');
    }

    const abortController = new AbortController();
    this.syncJobs.set(dataSourceId, abortController);

    await connector.subscribe(async (event) => {
      if (abortController.signal.aborted) return;

      try {
        // Process the change event
        await this.processChangeEvent(connector.config, event);

        // Call user callback
        if (callback) {
          callback(event);
        }
      } catch (error) {
        console.error(`[${dataSourceId}] Real-time sync error:`, error);
      }
    });
  }

  /**
   * Stop real-time sync
   */
  async stopRealtimeSync(dataSourceId: string): Promise<void> {
    const abortController = this.syncJobs.get(dataSourceId);
    if (abortController) {
      abortController.abort();
      this.syncJobs.delete(dataSourceId);
    }

    const connector = this.getConnector(dataSourceId);
    if (connector && connector.unsubscribe) {
      await connector.unsubscribe();
    }
  }

  /**
   * Sync records to database
   */
  private async syncRecordsToDatabase(
    config: DataSourceConfig,
    records: DataRecord[]
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    unchanged: number;
    errors: SyncError[];
    dbQueries: number;
  }> {
    const objectType = config.mapping.objectType;
    const pkField = config.mapping.primaryKey.target;
    let dbQueries = 0;

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    const errors: SyncError[] = [];

    for (const record of records) {
      try {
        // Check if record exists
        const existing = await this.prisma.objects.findFirst({
          where: {
            object_types: { apiName: objectType },
            properties: {
              path: [pkField],
              equals: record[pkField],
            },
          },
        });
        dbQueries++;

        if (existing) {
          // Check if changed
          const currentProps = existing.properties as Record<string, any>;
          const hasChanges = this.hasRecordChanged(currentProps, record);

          if (hasChanges) {
            // Update
            await this.prisma.objects.update({
              where: { id: existing.id },
              data: {
                properties: { ...currentProps, ...record },
                updatedAt: new Date(),
              },
            });
            updated++;
          } else {
            unchanged++;
          }
        } else {
          // Create
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
        }
        dbQueries++;
      } catch (error) {
        errors.push({
          recordId: record.id,
          code: 'SYNC_RECORD_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    return {
      processed: created + updated + unchanged,
      created,
      updated,
      unchanged,
      errors,
      dbQueries,
    };
  }

  /**
   * Process a change event
   */
  private async processChangeEvent(config: DataSourceConfig, event: ChangeEvent): Promise<void> {
    const objectType = config.mapping.objectType;
    const pkField = config.mapping.primaryKey.target;

    switch (event.type) {
      case 'create':
        if (event.after) {
          await this.prisma.objects.create({
            data: {
              id: crypto.randomUUID(),
              rid: `ri.aigc.main.objects.${objectType.toLowerCase()}.${event.after[pkField]}`,
              object_types: {
                connect: { apiName: objectType },
              },
              properties: event.after,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        break;

      case 'update':
        if (event.after) {
          const existing = await this.prisma.objects.findFirst({
            where: {
              object_types: { apiName: objectType },
              properties: {
                path: [pkField],
                equals: event.after[pkField],
              },
            },
          });

          if (existing) {
            await this.prisma.objects.update({
              where: { id: existing.id },
              data: {
                properties: { ...(existing.properties as object), ...event.after },
                updatedAt: new Date(),
              },
            });
          }
        }
        break;

      case 'delete':
        if (event.before) {
          await this.prisma.objects.deleteMany({
            where: {
              object_types: { apiName: objectType },
              properties: {
                path: [pkField],
                equals: event.before[pkField],
              },
            },
          });
        }
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Check if record has changed
   */
  private hasRecordChanged(current: Record<string, any>, incoming: Record<string, any>): boolean {
    for (const key of Object.keys(incoming)) {
      if (JSON.stringify(current[key]) !== JSON.stringify(incoming[key])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get sync status
   */
  async getSyncStatus(dataSourceId: string): Promise<{
    status: string;
    lastSyncAt?: Date;
    lastSyncStatus?: string;
    lastSyncError?: string;
    totalRecords?: number;
  }> {
    // TODO: dataSourceSync model does not exist in current schema
    const lastSync = null;
    // const lastSync = await this.prisma.dataSourceSync.findFirst({
    //   where: { dataSourceId },
    //   orderBy: { startedAt: 'desc' },
    // });

    return {
      status: 'unknown',
      lastSyncAt: lastSync?.startedAt,
      lastSyncStatus: lastSync?.status,
      lastSyncError: lastSync?.error || undefined,
      totalRecords: lastSync?.totalRecords || undefined,
    };
  }
}
