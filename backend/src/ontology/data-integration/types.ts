/**
 * Data Integration Types
 * 
 * 多源数据集成类型定义
 */

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Data Source Types
// =============================================================================

export type DataSourceType = 
  | 'rest_api'
  | 'database'
  | 'file'
  | 'graphql'
  | 'websocket'
  | 'kafka'
  | 'redis'
  | 'elasticsearch';

export type DataSourceStatus = 'active' | 'inactive' | 'error' | 'syncing';

export type SyncMode = 'full' | 'incremental' | 'realtime' | 'scheduled';

export type SyncDirection = 'pull' | 'push' | 'bidirectional';

// =============================================================================
// Data Source Configuration
// =============================================================================

export interface DataSourceConfig {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  status: DataSourceStatus;
  
  // Connection settings
  connection: ConnectionConfig;
  
  // Sync settings
  sync: SyncConfig;
  
  // Mapping configuration
  mapping: DataMappingConfig;
  
  // Writeback configuration
  writeback?: WritebackConfig;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'failed';
  lastSyncError?: string;
}

export interface ConnectionConfig {
  // REST API
  baseUrl?: string;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  
  // Database
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  
  // File
  filePath?: string;
  fileFormat?: 'json' | 'csv' | 'parquet' | 'xml';
  encoding?: string;
  delimiter?: string;
  
  // WebSocket
  wsUrl?: string;
  wsProtocols?: string[];
  
  // Generic
  [key: string]: any;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenEndpoint?: string;
  scope?: string;
  customHeaders?: Record<string, string>;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

export interface SyncConfig {
  mode: SyncMode | string;
  direction: SyncDirection | string;
  schedule?: string; // Cron expression
  batchSize?: number;
  parallelism?: number;
  conflictResolution: 'source_wins' | 'target_wins' | 'manual' | 'timestamp' | string;
  
  // Incremental sync
  incrementalField?: string;
  incrementalFormat?: 'timestamp' | 'sequence' | 'uuid';
  
  // Real-time sync
  webhookUrl?: string;
  webhookEvents?: string[];
  
  // Filters
  filters?: DataFilter[];
}

export interface DataFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface DataMappingConfig {
  objectType: string;
  sourceEntity: string;
  
  // Field mappings
  fields: FieldMapping[];
  
  // Transformations
  transformations?: DataTransformation[];
  
  // Relations
  relations?: RelationMapping[];
  
  // Primary key mapping
  primaryKey: {
    source: string;
    target: string;
  };
}

export interface FieldMapping {
  source: string;
  target: string;
  required?: boolean;
  defaultValue?: any;
  transform?: string; // Transform function name
}

export interface DataTransformation {
  type: 'map' | 'filter' | 'compute' | 'aggregate' | 'join';
  config: Record<string, any>;
}

export interface RelationMapping {
  name: string;
  sourceField: string;
  targetObjectType: string;
  targetField: string;
  relationType: 'oneToOne' | 'oneToMany' | 'manyToMany';
}

export interface WritebackConfig {
  enabled: boolean;
  endpoint?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  transform?: string;

  // Conflict resolution for writeback
  conflictResolution?: 'source_wins' | 'target_wins' | 'merge';

  // Batch writeback
  batchEnabled?: boolean;
  batchSize?: number;
  batchInterval?: number;
}

// =============================================================================
// Sync Result Types
// =============================================================================

export interface SyncResult {
  success: boolean;
  dataSourceId: string;
  syncId: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  
  // Statistics
  stats: SyncStats;
  
  // Details
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  errors: SyncError[];
  
  // Incremental sync cursor
  nextCursor?: string;
}

export interface SyncStats {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  bytesTransferred: number;
  apiCalls: number;
  dbQueries: number;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  code: string;
  message: string;
  stack?: string;
  timestamp: Date;
}

// =============================================================================
// Real-time Event Types
// =============================================================================

export type ChangeEventType = 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete';

export interface ChangeEvent {
  id: string;
  type: ChangeEventType;
  dataSourceId: string;
  objectType: string;
  timestamp: Date;
  
  // Change data
  before?: Record<string, any>;
  after?: Record<string, any>;
  changes?: string[];
  
  // Metadata
  sourceId: string;
  targetId?: string;
  syncId?: string;
  userId?: string;
  
  // Processing
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface EventStreamConfig {
  id: string;
  name: string;
  dataSourceIds: string[];
  objectTypes: string[];
  eventTypes: ChangeEventType[];
  
  // Processing
  processor: 'websocket' | 'webhook' | 'function' | 'materialized_view';
  processorConfig: Record<string, any>;
  
  // Filtering
  filter?: DataFilter[];
  
  // Buffering
  bufferSize?: number;
  bufferTimeout?: number;
}

// =============================================================================
// Connector Types
// =============================================================================

export interface Connector {
  id: string;
  config: DataSourceConfig;
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<ConnectionTestResult>;
  
  // Read operations
  read(query: DataQuery): Promise<DataRecord[]>;
  readStream(query: DataQuery): AsyncIterable<DataRecord>;
  
  // Write operations (for bidirectional sync)
  write(records: DataRecord[]): Promise<WriteResult>;
  update(records: DataRecord[]): Promise<WriteResult>;
  delete(ids: string[]): Promise<WriteResult>;
  
  // Schema discovery
  discoverSchema(): Promise<SourceSchema>;
  
  // Real-time
  subscribe?(callback: (event: ChangeEvent) => void): Promise<void>;
  unsubscribe?(): Promise<void>;
}

export interface ConnectionTestResult {
  success: boolean;
  latency: number;
  message: string;
  details?: Record<string, any>;
}

export interface DataQuery {
  entity: string;
  fields?: string[];
  filter?: DataFilter[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface DataRecord {
  id: string;
  [key: string]: any;
}

export interface WriteResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: SyncError[];
}

export interface SourceSchema {
  entities: SourceEntity[];
}

export interface SourceEntity {
  name: string;
  fields: SourceField[];
  primaryKey: string;
}

export interface SourceField {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
}

// =============================================================================
// Materialized View Types
// =============================================================================

export interface MaterializedViewConfig {
  id: string;
  name: string;
  description?: string;
  
  // Source
  sourceQuery: ObjectSetQuery;
  
  // Refresh
  refreshMode: 'manual' | 'scheduled' | 'incremental';
  refreshSchedule?: string;
  incrementalField?: string;
  
  // Storage
  storage: 'memory' | 'redis' | 'database';
  ttl?: number;
  
  // Indexing
  indexes?: string[];
  
  // Status
  lastRefreshAt?: Date;
  lastRefreshDuration?: number;
  rowCount?: number;
}

export interface ObjectSetQuery {
  objectType: string;
  filter?: DataFilter[];
  search?: string;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  include?: string[];
}
