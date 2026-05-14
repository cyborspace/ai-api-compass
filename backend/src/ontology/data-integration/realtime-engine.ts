/**
 * Real-time Engine
 *
 * 实时计算引擎
 * 实现事件流处理、WebSocket推送、物化视图
 */

import type { PrismaClient } from '@prisma/client';
import type {
  ChangeEvent,
  EventStreamConfig,
  MaterializedViewConfig,
  ObjectSetQuery,
  DataFilter,
} from './types.js';

export type EventHandler = (event: ChangeEvent) => Promise<void> | void;

export interface StreamProcessor {
  id: string;
  name: string;
  config: EventStreamConfig;
  handlers: EventHandler[];
  status: 'running' | 'stopped' | 'error';
  error?: string;
}

export interface MaterializedView {
  config: MaterializedViewConfig;
  data: any[];
  lastRefreshAt: Date;
  status: 'fresh' | 'stale' | 'refreshing';
}

export class RealtimeEngine {
  private prisma: PrismaClient;
  private processors: Map<string, StreamProcessor> = new Map();
  private materializedViews: Map<string, MaterializedView> = new Map();
  private eventQueue: ChangeEvent[] = [];
  private isProcessing = false;
  private wsClients: Map<string, Set<WebSocket>> = new Map();
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ==================== Event Stream Processing ====================

  /**
   * Register an event stream processor
   */
  registerStreamProcessor(config: EventStreamConfig): StreamProcessor {
    const processor: StreamProcessor = {
      id: config.id,
      name: config.name,
      config,
      handlers: [],
      status: 'stopped',
    };

    this.processors.set(config.id, processor);
    return processor;
  }

  /**
   * Add event handler to processor
   */
  addEventHandler(processorId: string, handler: EventHandler): void {
    const processor = this.processors.get(processorId);
    if (processor) {
      processor.handlers.push(handler);
    }
  }

  /**
   * Start stream processor
   */
  async startStreamProcessor(processorId: string): Promise<void> {
    const processor = this.processors.get(processorId);
    if (!processor) {
      throw new Error(`Processor not found: ${processorId}`);
    }

    processor.status = 'running';
    console.log(`[${processorId}] Stream processor started`);
  }

  /**
   * Stop stream processor
   */
  async stopStreamProcessor(processorId: string): Promise<void> {
    const processor = this.processors.get(processorId);
    if (processor) {
      processor.status = 'stopped';
      console.log(`[${processorId}] Stream processor stopped`);
    }
  }

  /**
   * Emit an event to all processors
   */
  async emitEvent(event: ChangeEvent): Promise<void> {
    // Add to queue
    this.eventQueue.push(event);

    // Process queue
    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      try {
        // Find matching processors
        for (const processor of this.processors.values()) {
          if (processor.status !== 'running') continue;

          // Check if processor is interested in this event
          if (this.shouldProcessEvent(processor.config, event)) {
            // Execute handlers
            for (const handler of processor.handlers) {
              try {
                await handler(event);
              } catch (error) {
                console.error(`[${processor.id}] Handler error:`, error);
              }
            }
          }
        }

        // Broadcast to WebSocket clients
        await this.broadcastToWebSocket(event);

        // Update materialized views
        await this.updateMaterializedViews(event);

        // Mark as processed
        event.processed = true;
        event.processedAt = new Date();
      } catch (error) {
        console.error('Event processing error:', error);
        event.error = error instanceof Error ? error.message : String(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Check if processor should handle this event
   */
  private shouldProcessEvent(config: EventStreamConfig, event: ChangeEvent): boolean {
    // Check data source
    if (config.dataSourceIds.length > 0 && !config.dataSourceIds.includes(event.dataSourceId)) {
      return false;
    }

    // Check object type
    if (config.objectTypes.length > 0 && !config.objectTypes.includes(event.objectType)) {
      return false;
    }

    // Check event type
    if (config.eventTypes.length > 0 && !config.eventTypes.includes(event.type)) {
      return false;
    }

    // Check filters
    if (config.filter && config.filter.length > 0) {
      for (const filter of config.filter) {
        const value = event.after?.[filter.field] || event.before?.[filter.field];
        if (!this.matchesFilter(value, filter.operator, filter.value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if value matches filter
   */
  private matchesFilter(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return value === expected;
      case 'ne': return value !== expected;
      case 'gt': return value > expected;
      case 'gte': return value >= expected;
      case 'lt': return value < expected;
      case 'lte': return value <= expected;
      case 'in': return Array.isArray(expected) && expected.includes(value);
      case 'notIn': return Array.isArray(expected) && !expected.includes(value);
      case 'contains': return String(value).includes(String(expected));
      case 'startsWith': return String(value).startsWith(String(expected));
      case 'endsWith': return String(value).endsWith(String(expected));
      default: return true;
    }
  }

  // ==================== WebSocket Push ====================

  /**
   * Register WebSocket client for object type
   */
  registerWebSocketClient(objectType: string, ws: WebSocket): void {
    const clients = this.wsClients.get(objectType) || new Set();
    clients.add(ws);
    this.wsClients.set(objectType, clients);

    // Handle close
    ws.addEventListener('close', () => {
      this.unregisterWebSocketClient(objectType, ws);
    });
  }

  /**
   * Unregister WebSocket client
   */
  unregisterWebSocketClient(objectType: string, ws: WebSocket): void {
    const clients = this.wsClients.get(objectType);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.wsClients.delete(objectType);
      }
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private async broadcastToWebSocket(event: ChangeEvent): Promise<void> {
    const clients = this.wsClients.get(event.objectType);
    if (!clients || clients.size === 0) return;

    const message = JSON.stringify({
      type: 'change',
      event: {
        id: event.id,
        type: event.type,
        objectType: event.objectType,
        timestamp: event.timestamp,
        changes: event.changes,
      },
    });

    for (const ws of clients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } catch (error) {
        console.error('WebSocket broadcast error:', error);
      }
    }
  }

  /**
   * Send update to specific client
   */
  sendToClient(ws: WebSocket, data: any): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('WebSocket send error:', error);
    }
  }

  // ==================== Materialized Views ====================

  /**
   * Create materialized view
   */
  async createMaterializedView(config: MaterializedViewConfig): Promise<MaterializedView> {
    const view: MaterializedView = {
      config,
      data: [],
      lastRefreshAt: new Date(),
      status: 'stale',
    };

    this.materializedViews.set(config.id, view);

    // Initial refresh
    await this.refreshMaterializedView(config.id);

    return view;
  }

  /**
   * Refresh materialized view
   */
  async refreshMaterializedView(viewId: string): Promise<void> {
    const view = this.materializedViews.get(viewId);
    if (!view) {
      throw new Error(`Materialized view not found: ${viewId}`);
    }

    view.status = 'refreshing';
    const startTime = Date.now();

    try {
      const query = view.config.sourceQuery;

      // Build Prisma query
      const where: any = {};
      if (query.filter) {
        for (const filter of query.filter) {
          where[filter.field] = this.buildFilterCondition(filter);
        }
      }

      const orderBy: any = {};
      if (query.orderBy) {
        for (const ob of query.orderBy) {
          orderBy[ob.field] = ob.direction;
        }
      }

      // Execute query based on object type
      const results = await this.executeObjectQuery(query.objectType, {
        where,
        orderBy,
        take: query.limit,
        skip: query.offset,
      });

      view.data = results;
      view.lastRefreshAt = new Date();
      view.status = 'fresh';
      view.config.lastRefreshAt = new Date();
      view.config.lastRefreshDuration = Date.now() - startTime;
      view.config.rowCount = results.length;

      console.log(`[${viewId}] Materialized view refreshed: ${results.length} rows in ${Date.now() - startTime}ms`);
    } catch (error) {
      view.status = 'stale';
      view.config.lastRefreshDuration = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Update materialized view incrementally
   */
  private async updateMaterializedViews(event: ChangeEvent): Promise<void> {
    for (const view of this.materializedViews.values()) {
      if (view.config.sourceQuery.objectType !== event.objectType) continue;

      // Check if view should be updated
      if (view.config.refreshMode === 'incremental' && view.config.incrementalField) {
        // For incremental updates, check if the event affects this view
        const shouldUpdate = this.shouldUpdateView(view, event);
        if (shouldUpdate) {
          // For incremental mode, we can update just the affected record
          await this.incrementalViewUpdate(view, event);
        }
      } else {
        // Mark as stale for non-incremental views
        view.status = 'stale';
      }
    }
  }

  /**
   * Check if event should update view
   */
  private shouldUpdateView(view: MaterializedView, event: ChangeEvent): boolean {
    // Check filters
    if (view.config.sourceQuery.filter) {
      for (const filter of view.config.sourceQuery.filter) {
        const value = event.after?.[filter.field] || event.before?.[filter.field];
        if (!this.matchesFilter(value, filter.operator, filter.value)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Incremental view update
   */
  private async incrementalViewUpdate(view: MaterializedView, event: ChangeEvent): Promise<void> {
    const pkField = 'id'; // Assuming 'id' is the primary key

    switch (event.type) {
      case 'create':
        if (event.after) {
          view.data.push(event.after);
        }
        break;
      case 'update':
        if (event.after) {
          const index = view.data.findIndex((r: any) => r[pkField] === event.after[pkField]);
          if (index >= 0) {
            view.data[index] = { ...view.data[index], ...event.after };
          }
        }
        break;
      case 'delete':
        if (event.before) {
          view.data = view.data.filter((r: any) => r[pkField] !== event.before[pkField]);
        }
        break;
    }

    view.config.rowCount = view.data.length;
  }

  /**
   * Get materialized view
   */
  getMaterializedView(viewId: string): MaterializedView | undefined {
    return this.materializedViews.get(viewId);
  }

  /**
   * Get all materialized views
   */
  getAllMaterializedViews(): MaterializedView[] {
    return Array.from(this.materializedViews.values());
  }

  /**
   * Delete materialized view
   */
  deleteMaterializedView(viewId: string): void {
    this.materializedViews.delete(viewId);
  }

  // ==================== Change Data Capture ====================

  /**
   * Capture database changes
   */
  async captureChange(
    objectType: string,
    changeType: 'create' | 'update' | 'delete',
    before?: Record<string, any>,
    after?: Record<string, any>
  ): Promise<ChangeEvent> {
    const event: ChangeEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: changeType,
      dataSourceId: 'local',
      objectType,
      timestamp: new Date(),
      before,
      after,
      changes: this.getChangedFields(before, after),
      sourceId: after?.id || before?.id || 'unknown',
      processed: false,
    };

    await this.emitEvent(event);
    return event;
  }

  /**
   * Get changed fields
   */
  private getChangedFields(before?: Record<string, any>, after?: Record<string, any>): string[] {
    if (!before || !after) return [];

    const changes: string[] = [];
    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push(key);
      }
    }
    return changes;
  }

  // ==================== Query Execution ====================

  /**
   * Execute object query
   */
  private async executeObjectQuery(objectType: string, options: any): Promise<any[]> {
    // Map object type to Prisma model
    const modelMap: Record<string, string> = {
      'AIGCTool': 'functions',
      'ObjectType': 'object_types',
      'Object': 'objects',
      'Interface': 'interfaces',
      'ActionType': 'action_types',
      'Action': 'actions',
      'UserEvent': 'user_events',
      'UserRating': 'user_ratings',
      'ToolHeatSnapshot': 'tool_heat_snapshots',
      'ToolHeatHistory': 'tool_heat_history',
      'ToolRankingHistory': 'tool_ranking_history',
      'ToolRating': 'tool_ratings',
      'RankingSnapshot': 'ranking_snapshots',
    };

    const modelName = modelMap[objectType];
    if (!modelName) {
      throw new Error(`Unknown object type: ${objectType}`);
    }

    const model = (this.prisma as any)[modelName];
    if (!model) {
      throw new Error(`Prisma model not found: ${modelName}`);
    }

    return model.findMany(options);
  }

  /**
   * Build filter condition
   */
  private buildFilterCondition(filter: DataFilter): any {
    switch (filter.operator) {
      case 'eq': return { equals: filter.value };
      case 'ne': return { not: filter.value };
      case 'gt': return { gt: filter.value };
      case 'gte': return { gte: filter.value };
      case 'lt': return { lt: filter.value };
      case 'lte': return { lte: filter.value };
      case 'in': return { in: filter.value };
      case 'notIn': return { notIn: filter.value };
      case 'contains': return { contains: filter.value, mode: 'insensitive' };
      case 'startsWith': return { startsWith: filter.value, mode: 'insensitive' };
      case 'endsWith': return { endsWith: filter.value, mode: 'insensitive' };
      default: return { equals: filter.value };
    }
  }

  // ==================== Event Handlers ====================

  /**
   * Register global event handler
   */
  registerEventHandler(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  /**
   * Execute global event handlers
   */
  private async executeGlobalHandlers(event: ChangeEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Global handler error for ${event.type}:`, error);
      }
    }
  }

  // ==================== Statistics ====================

  /**
   * Get engine statistics
   */
  getStats(): {
    processors: number;
    runningProcessors: number;
    materializedViews: number;
    wsClients: number;
    queuedEvents: number;
  } {
    return {
      processors: this.processors.size,
      runningProcessors: Array.from(this.processors.values()).filter(p => p.status === 'running').length,
      materializedViews: this.materializedViews.size,
      wsClients: Array.from(this.wsClients.values()).reduce((sum, set) => sum + set.size, 0),
      queuedEvents: this.eventQueue.length,
    };
  }
}
