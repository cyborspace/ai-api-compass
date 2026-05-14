/**
 * Data Source Configuration Examples
 *
 * 数据源配置示例
 * 展示如何配置不同类型的数据源
 */

import type { DataSourceConfig } from '../types';

// =============================================================================
// REST API Data Source Example
// =============================================================================

export const restApiDataSourceExample: DataSourceConfig = {
  id: 'openai-api',
  name: 'OpenAI API',
  description: 'OpenAI API for fetching model information',
  type: 'rest_api',
  status: 'active',

  connection: {
    baseUrl: 'https://api.openai.com/v1',
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      type: 'bearer',
      token: process.env.OPENAI_API_KEY || '',
    },
    timeout: 30000,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    },
  },

  sync: {
    mode: 'incremental',
    direction: 'pull',
    batchSize: 100,
    parallelism: 1,
    conflictResolution: 'source_wins',
    incrementalField: 'updatedAt',
    incrementalFormat: 'timestamp',
    schedule: '0 */6 * * *', // Every 6 hours
  },

  mapping: {
    objectType: 'AIGCTool',
    sourceEntity: 'models',
    primaryKey: {
      source: 'id',
      target: 'id',
    },
    fields: [
      { source: 'id', target: 'id', required: true },
      { source: 'name', target: 'name', required: true },
      { source: 'description', target: 'description' },
      { source: 'provider', target: 'provider' },
      { source: 'capabilities', target: 'capabilities' },
      { source: 'pricing', target: 'pricing' },
      { source: 'contextWindow', target: 'contextWindow' },
      { source: 'trainingData', target: 'trainingData' },
      { source: 'releaseDate', target: 'releaseDate' },
      { source: 'version', target: 'version' },
      { source: 'status', target: 'status', defaultValue: 'active' },
    ],
  },

  writeback: {
    enabled: false,
    conflictResolution: 'source_wins',
  },

  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// Database Data Source Example
// =============================================================================

export const databaseDataSourceExample: DataSourceConfig = {
  id: 'legacy-db',
  name: 'Legacy Database',
  description: 'Legacy PostgreSQL database with tool information',
  type: 'database',
  status: 'active',

  connection: {
    host: 'localhost',
    port: 5432,
    database: 'legacy_tools',
    username: 'sync_user',
    password: process.env.LEGACY_DB_PASSWORD || '',
    ssl: true,
    timeout: 30000,
  },

  sync: {
    mode: 'bidirectional',
    direction: 'bidirectional',
    batchSize: 500,
    parallelism: 2,
    conflictResolution: 'source_wins' as const,
    incrementalField: 'updated_at',
    incrementalFormat: 'timestamp',
    schedule: '0 */12 * * *', // Every 12 hours
  },

  mapping: {
    objectType: 'AIGCTool',
    sourceEntity: 'tools',
    primaryKey: {
      source: 'tool_id',
      target: 'id',
    },
    fields: [
      { source: 'tool_id', target: 'id', required: true },
      { source: 'tool_name', target: 'name', required: true },
      { source: 'tool_desc', target: 'description' },
      { source: 'company_name', target: 'provider' },
      { source: 'feature_list', target: 'capabilities' },
      { source: 'price_info', target: 'pricing' },
      { source: 'max_tokens', target: 'contextWindow' },
      { source: 'dataset_info', target: 'trainingData' },
      { source: 'launch_date', target: 'releaseDate' },
      { source: 'tool_version', target: 'version' },
      { source: 'is_active', target: 'status', defaultValue: 'active' },
    ],
  },

  writeback: {
    enabled: true,
    endpoint: 'tools',
    method: 'PUT',
    conflictResolution: 'source_wins' as const,
    batchEnabled: true,
    batchSize: 50,
    batchInterval: 5000,
  },

  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// File Data Source Example
// =============================================================================

export const fileDataSourceExample: DataSourceConfig = {
  id: 'csv-import',
  name: 'CSV Import',
  description: 'CSV file with tool pricing data',
  type: 'file',
  status: 'active',

  connection: {
    filePath: '/data/pricing.csv',
    fileFormat: 'csv',
    encoding: 'utf-8',
    delimiter: ',',
  },

  sync: {
    mode: 'full',
    direction: 'pull',
    batchSize: 1000,
    parallelism: 1,
    conflictResolution: 'source_wins',
  },

  mapping: {
    objectType: 'PricingPlan',
    sourceEntity: 'pricing',
    primaryKey: {
      source: 'plan_id',
      target: 'id',
    },
    fields: [
      { source: 'plan_id', target: 'id', required: true },
      { source: 'tool_id', target: 'toolId', required: true },
      { source: 'plan_name', target: 'name', required: true },
      { source: 'plan_type', target: 'type', defaultValue: 'monthly' },
      { source: 'price_usd', target: 'price', required: true },
      { source: 'currency', target: 'currency', defaultValue: 'USD' },
      { source: 'features', target: 'features' },
      { source: 'limits', target: 'limits' },
      { source: 'is_active', target: 'isActive', defaultValue: true },
    ],
  },

  writeback: {
    enabled: false,
  },

  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// WebSocket Data Source Example
// =============================================================================

export const websocketDataSourceExample: DataSourceConfig = {
  id: 'realtime-metrics',
  name: 'Real-time Metrics',
  description: 'WebSocket feed for real-time tool usage metrics',
  type: 'websocket',
  status: 'active',

  connection: {
    wsUrl: 'wss://metrics.example.com/ws',
    wsProtocols: ['metrics-v1'],
    auth: {
      type: 'api_key',
      apiKey: process.env.METRICS_API_KEY || '',
      apiKeyHeader: 'X-API-Key',
    },
  },

  sync: {
    mode: 'realtime',
    direction: 'pull',
    batchSize: 100,
    parallelism: 1,
    conflictResolution: 'source_wins',
  },

  mapping: {
    objectType: 'TrendMetric',
    sourceEntity: 'metrics',
    primaryKey: {
      source: 'metric_id',
      target: 'id',
    },
    fields: [
      { source: 'metric_id', target: 'id', required: true },
      { source: 'tool_id', target: 'toolId', required: true },
      { source: 'metric_type', target: 'metricType', required: true },
      { source: 'metric_value', target: 'value', required: true },
      { source: 'timestamp', target: 'timestamp', required: true },
      { source: 'period', target: 'period', defaultValue: 'daily' },
      { source: 'region', target: 'region' },
      { source: 'source', target: 'source' },
    ],
  },

  writeback: {
    enabled: false,
  },

  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// GraphQL Data Source Example
// =============================================================================

export const graphqlDataSourceExample: DataSourceConfig = {
  id: 'graphql-api',
  name: 'GraphQL API',
  description: 'GraphQL API for competitor analysis data',
  type: 'rest_api', // Using REST connector with GraphQL payload
  status: 'active',

  connection: {
    baseUrl: 'https://api.example.com/graphql',
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      type: 'bearer',
      token: process.env.GRAPHQL_API_KEY || '',
    },
    timeout: 30000,
  },

  sync: {
    mode: 'incremental',
    direction: 'pull',
    batchSize: 100,
    parallelism: 1,
    conflictResolution: 'source_wins',
    incrementalField: 'updatedAt',
    incrementalFormat: 'timestamp',
    schedule: '0 0 * * *', // Daily at midnight
  },

  mapping: {
    objectType: 'CompetitorAnalysis',
    sourceEntity: 'competitors',
    primaryKey: {
      source: 'id',
      target: 'id',
    },
    fields: [
      { source: 'id', target: 'id', required: true },
      { source: 'toolId', target: 'toolId', required: true },
      { source: 'competitorId', target: 'competitorId', required: true },
      { source: 'strengths', target: 'strengths' },
      { source: 'weaknesses', target: 'weaknesses' },
      { source: 'marketShare', target: 'marketShare' },
      { source: 'userSatisfaction', target: 'userSatisfaction' },
      { source: 'featureComparison', target: 'featureComparison' },
      { source: 'pricingComparison', target: 'pricingComparison' },
      { source: 'lastUpdated', target: 'lastUpdated' },
    ],
  },

  writeback: {
    enabled: false,
  },

  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// Multi-Source Configuration
// =============================================================================

export const multiSourceConfig: DataSourceConfig[] = [
  restApiDataSourceExample,
  databaseDataSourceExample,
  fileDataSourceExample,
  websocketDataSourceExample,
  graphqlDataSourceExample,
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a data source configuration from template
 */
export function createDataSourceConfig(
  template: DataSourceConfig,
  overrides: Partial<DataSourceConfig>
): DataSourceConfig {
  return {
    ...template,
    ...overrides,
    id: overrides.id || template.id,
    connection: {
      ...template.connection,
      ...overrides.connection,
    },
    sync: {
      ...template.sync,
      ...overrides.sync,
    },
    mapping: {
      ...template.mapping,
      ...overrides.mapping,
      fields: overrides.mapping?.fields || template.mapping.fields,
      primaryKey: overrides.mapping?.primaryKey || template.mapping.primaryKey,
    },
    updatedAt: new Date(),
  };
}

/**
 * Validate data source configuration
 */
export function validateDataSourceConfig(config: DataSourceConfig): string[] {
  const errors: string[] = [];

  if (!config.id) errors.push('id is required');
  if (!config.name) errors.push('name is required');
  if (!config.type) errors.push('type is required');
  if (!config.mapping.objectType) errors.push('mapping.objectType is required');
  if (!config.mapping.sourceEntity) errors.push('mapping.sourceEntity is required');
  if (!config.mapping.primaryKey.source) errors.push('mapping.primaryKey.source is required');
  if (!config.mapping.primaryKey.target) errors.push('mapping.primaryKey.target is required');
  if (config.mapping.fields.length === 0) errors.push('mapping.fields cannot be empty');

  return errors;
}
