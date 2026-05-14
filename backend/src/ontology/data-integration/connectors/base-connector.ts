/**
 * Base Connector
 * 
 * 数据源连接器基类
 * 定义所有连接器必须实现的接口
 */

import type {
  Connector,
  DataSourceConfig,
  DataQuery,
  DataRecord,
  WriteResult,
  ConnectionTestResult,
  SourceSchema,
  ChangeEvent,
  SyncError,
} from '../types';

export abstract class BaseConnector implements Connector {
  id: string;
  config: DataSourceConfig;
  status: 'connected' | 'disconnected' | 'error' = 'disconnected';
  lastError?: string;

  // Retry configuration
  protected retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  constructor(config: DataSourceConfig) {
    this.id = config.id;
    this.config = config;
  }

  /**
   * Connect to data source
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from data source
   */
  abstract disconnect(): Promise<void>;

  /**
   * Test connection
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Read data from source
   */
  abstract read(query: DataQuery): Promise<DataRecord[]>;

  /**
   * Read data as stream
   */
  abstract readStream(query: DataQuery): AsyncIterable<DataRecord>;

  /**
   * Write data to source (for bidirectional sync)
   */
  abstract write(records: DataRecord[]): Promise<WriteResult>;

  /**
   * Update data in source
   */
  abstract update(records: DataRecord[]): Promise<WriteResult>;

  /**
   * Delete data from source
   */
  abstract delete(ids: string[]): Promise<WriteResult>;

  /**
   * Discover source schema
   */
  abstract discoverSchema(): Promise<SourceSchema>;

  /**
   * Subscribe to real-time changes (optional)
   */
  async subscribe?(callback: (event: ChangeEvent) => void): Promise<void> {
    throw new Error('Subscribe not implemented');
  }

  /**
   * Unsubscribe from real-time changes (optional)
   */
  async unsubscribe?(): Promise<void> {
    throw new Error('Unsubscribe not implemented');
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.retryDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryConfig.maxRetries) {
          console.warn(`[${this.id}] ${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), retrying in ${delay}ms...`);
          await this.sleep(delay);
          delay *= this.retryConfig.backoffMultiplier;
        }
      }
    }

    throw new Error(`[${this.id}] ${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Map source record to target format
   */
  protected mapRecord(sourceRecord: DataRecord): DataRecord {
    const mapping = this.config.mapping;
    const result: DataRecord = { id: '' };

    // Map primary key
    const pkMapping = mapping.primaryKey;
    result[mapping.primaryKey.target] = sourceRecord[pkMapping.source];
    result.id = String(sourceRecord[pkMapping.source]);

    // Map fields
    for (const fieldMapping of mapping.fields) {
      const sourceValue = sourceRecord[fieldMapping.source];
      
      if (sourceValue === undefined || sourceValue === null) {
        if (fieldMapping.required) {
          if (fieldMapping.defaultValue !== undefined) {
            result[fieldMapping.target] = fieldMapping.defaultValue;
          }
        } else {
          result[fieldMapping.target] = fieldMapping.defaultValue ?? null;
        }
      } else {
        result[fieldMapping.target] = sourceValue;
      }
    }

    return result;
  }

  /**
   * Map target record back to source format (for writeback)
   */
  protected mapRecordToSource(targetRecord: DataRecord): DataRecord {
    const mapping = this.config.mapping;
    const result: DataRecord = { id: '' };

    // Map primary key back
    const pkMapping = mapping.primaryKey;
    result[pkMapping.source] = targetRecord[pkMapping.target];
    result.id = String(targetRecord[pkMapping.target]);

    // Map fields back
    for (const fieldMapping of mapping.fields) {
      const targetValue = targetRecord[fieldMapping.target];
      
      if (targetValue !== undefined) {
        result[fieldMapping.source] = targetValue;
      }
    }

    return result;
  }

  /**
   * Create sync error
   */
  protected createSyncError(
    recordId: string,
    code: string,
    message: string
  ): SyncError {
    return {
      recordId,
      code,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update connector status
   */
  protected setStatus(status: 'connected' | 'disconnected' | 'error', error?: string): void {
    this.status = status;
    this.lastError = error;
  }
}
