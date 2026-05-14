/**
 * Data Integration Module
 *
 * 数据集成模块主入口
 * 导出所有数据集成相关组件
 */

// Types
export * from './types.js';

// Connectors
export { BaseConnector } from './connectors/base-connector.js';
export { RestApiConnector } from './connectors/rest-api-connector.js';
export { DatabaseConnector } from './connectors/database-connector.js';

// Engines
export { SyncEngine } from './sync-engine.js';
export { BidirectionalSyncEngine } from './bidirectional-sync.js';
export { RealtimeEngine } from './realtime-engine.js';

// Re-export types
export type { BidirectionalSyncConfig, SyncChange } from './bidirectional-sync.js';
export type { EventHandler, StreamProcessor, MaterializedView } from './realtime-engine.js';
