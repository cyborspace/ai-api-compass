/**
 * 行为收集 SDK - 行为收集器
 * 
 * 核心收集器，支持事件批量收集、本地缓冲与离线支持
 */

import {
  EventType,
  BehaviorEvent,
  BaseEvent,
  BehaviorCollectorConfig,
  DEFAULT_CONFIG,
  SearchEventProperties,
  ClickEventProperties,
  ViewEventProperties,
  CompareEventProperties,
  BookmarkEventProperties,
  ShareEventProperties,
  BatchEventsRequest,
  BatchEventsResponse,
  EventPropertiesMap,
} from './event-types';
import { SessionManager, getSessionManager } from './session-manager';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 事件队列项
 */
interface QueuedEvent {
  event: BehaviorEvent;
  timestamp: number;
  retryCount: number;
}

/**
 * 离线缓冲数据
 */
interface OfflineBuffer {
  events: QueuedEvent[];
  lastSync: string;
  version: number;
}

/**
 * 热度更新回调
 */
type PopularityUpdateCallback = (toolRid: string, delta: number) => void;

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 检测设备类型
 */
function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * 生成批次 ID
 */
function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// 行为收集器类
// =============================================================================

/**
 * 行为收集器
 * 
 * 核心功能：
 * - 事件批量收集（5秒或20条触发发送）
 * - 本地缓冲与离线支持
 * - 乐观更新热度
 */
export class BehaviorCollector {
  private config: BehaviorCollectorConfig;
  private sessionManager: SessionManager;
  private eventQueue: QueuedEvent[] = [];
  private offlineBuffer: OfflineBuffer;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;
  private isOnline = true;
  private popularityCallbacks: PopularityUpdateCallback[] = [];
  private flushPromise: Promise<void> | null = null;
  
  // 存储键
  private readonly bufferStorageKey: string;
  
  constructor(config: Partial<BehaviorCollectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionManager = getSessionManager({
      storageKeyPrefix: this.config.storageKeyPrefix,
      validityDays: this.config.sessionValidityDays,
    });
    
    this.bufferStorageKey = `${this.config.storageKeyPrefix}offline_buffer`;
    
    // 初始化离线缓冲
    this.offlineBuffer = this.loadOfflineBuffer();
    
    // 初始化网络状态监听
    this.initNetworkListener();
    
    // 初始化页面卸载处理
    this.initUnloadHandler();
    
    // 尝试恢复离线事件
    this.restoreOfflineEvents();
    
    if (this.config.debug) {
      console.log('[BehaviorCollector] Initialized with config:', this.config);
    }
  }
  
  // =============================================================================
  // 初始化方法
  // =============================================================================
  
  /**
   * 初始化网络状态监听
   */
  private initNetworkListener(): void {
    if (typeof window === 'undefined') return;
    
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onNetworkRestored();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.saveOfflineBuffer();
    });
  }
  
  /**
   * 初始化页面卸载处理
   */
  private initUnloadHandler(): void {
    if (typeof window === 'undefined') return;
    
    // 使用 visibilitychange 和 pagehide 事件确保数据不丢失
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush({ immediate: true, saveOffline: true });
      }
    });
    
    window.addEventListener('pagehide', () => {
      this.flush({ immediate: true, saveOffline: true });
    });
  }
  
  /**
   * 加载离线缓冲
   */
  private loadOfflineBuffer(): OfflineBuffer {
    if (!this.config.enableOfflineBuffer || typeof window === 'undefined') {
      return { events: [], lastSync: new Date().toISOString(), version: 1 };
    }
    
    try {
      const stored = localStorage.getItem(this.bufferStorageKey);
      if (stored) {
        return JSON.parse(stored) as OfflineBuffer;
      }
    } catch (error) {
      console.warn('[BehaviorCollector] Failed to load offline buffer:', error);
    }
    
    return { events: [], lastSync: new Date().toISOString(), version: 1 };
  }
  
  /**
   * 保存离线缓冲
   */
  private saveOfflineBuffer(): void {
    if (!this.config.enableOfflineBuffer || typeof window === 'undefined') return;
    
    try {
      const allEvents = [...this.offlineBuffer.events, ...this.eventQueue];
      this.offlineBuffer.events = allEvents;
      this.offlineBuffer.lastSync = new Date().toISOString();
      localStorage.setItem(this.bufferStorageKey, JSON.stringify(this.offlineBuffer));
      
      if (this.config.debug) {
        console.log('[BehaviorCollector] Saved offline buffer:', this.offlineBuffer.events.length, 'events');
      }
    } catch (error) {
      console.warn('[BehaviorCollector] Failed to save offline buffer:', error);
    }
  }
  
  /**
   * 恢复离线事件
   */
  private restoreOfflineEvents(): void {
    if (this.offlineBuffer.events.length > 0) {
      // 将离线事件加入队列
      this.eventQueue.push(...this.offlineBuffer.events);
      this.offlineBuffer.events = [];
      
      if (this.config.debug) {
        console.log('[BehaviorCollector] Restored offline events:', this.eventQueue.length);
      }
      
      // 如果在线，尝试发送
      if (this.isOnline) {
        this.scheduleFlush();
      }
    }
  }
  
  /**
   * 网络恢复处理
   */
  private onNetworkRestored(): void {
    if (this.config.debug) {
      console.log('[BehaviorCollector] Network restored, flushing events');
    }
    
    // 清除离线缓冲存储
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.bufferStorageKey);
    }
    
    // 尝试发送所有事件
    this.flush({ immediate: true });
  }
  
  // =============================================================================
  // 事件创建方法
  // =============================================================================
  
  /**
   * 创建基础事件属性
   */
  private createBaseEvent(): Omit<BaseEvent, 'eventType'> {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionManager.getSessionId(),
      userId: this.sessionManager.getUserId(),
      pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
      pageTitle: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      deviceType: detectDeviceType(),
    };
  }
  
  /**
   * 创建事件
   */
  private createEvent<T extends EventType>(
    eventType: T,
    properties: EventPropertiesMap[T]
  ): BehaviorEvent {
    const baseEvent = this.createBaseEvent();
    
    return {
      ...baseEvent,
      eventType,
      properties,
    } as BehaviorEvent;
  }
  
  // =============================================================================
  // 公共 API - 事件追踪
  // =============================================================================
  
  /**
   * 通用事件追踪
   */
  track<T extends EventType>(
    eventType: T,
    properties: EventPropertiesMap[T]
  ): void {
    const event = this.createEvent(eventType, properties);
    this.addToQueue(event);
  }
  
  /**
   * 搜索事件追踪
   */
  trackSearch(query: string, resultCount: number, options?: Partial<SearchEventProperties>): void {
    const properties: SearchEventProperties = {
      query,
      resultCount,
      ...options,
    };
    
    this.track(EventType.SEARCH, properties);
    
    // 乐观更新热度
    if (resultCount > 0) {
      this.notifyPopularityUpdate('search', resultCount);
    }
  }
  
  /**
   * 点击事件追踪
   */
  trackClick(toolRid: string, source: ClickEventProperties['source'], options?: Partial<ClickEventProperties>): void {
    const properties: ClickEventProperties = {
      toolRid,
      source,
      ...options,
    };
    
    this.track(EventType.CLICK, properties);
    
    // 乐观更新热度
    this.notifyPopularityUpdate(toolRid, 1);
  }
  
  /**
   * 查看事件追踪
   */
  trackView(toolRid: string, options?: Partial<ViewEventProperties>): void {
    const properties: ViewEventProperties = {
      toolRid,
      ...options,
    };
    
    this.track(EventType.VIEW, properties);
    
    // 乐观更新热度
    this.notifyPopularityUpdate(toolRid, 0.5);
  }
  
  /**
   * 对比事件追踪
   */
  trackCompare(toolRids: string[], options?: Partial<CompareEventProperties>): void {
    const properties: CompareEventProperties = {
      toolRids,
      ...options,
    };
    
    this.track(EventType.COMPARE, properties);
    
    // 乐观更新热度 - 所有参与对比的工具
    toolRids.forEach(rid => this.notifyPopularityUpdate(rid, 0.3));
  }
  
  /**
   * 收藏事件追踪
   */
  trackBookmark(toolRid: string, action: 'add' | 'remove', options?: Partial<BookmarkEventProperties>): void {
    const properties: BookmarkEventProperties = {
      toolRid,
      action,
      ...options,
    };
    
    this.track(EventType.BOOKMARK, properties);
    
    // 乐观更新热度
    if (action === 'add') {
      this.notifyPopularityUpdate(toolRid, 2);
    }
  }
  
  /**
   * 分享事件追踪
   */
  trackShare(toolRid: string, channel: ShareEventProperties['channel'], options?: Partial<ShareEventProperties>): void {
    const properties: ShareEventProperties = {
      toolRid,
      channel,
      ...options,
    };
    
    this.track(EventType.SHARE, properties);
    
    // 乐观更新热度
    this.notifyPopularityUpdate(toolRid, 3);
  }
  
  // =============================================================================
  // 事件队列管理
  // =============================================================================
  
  /**
   * 添加事件到队列
   */
  private addToQueue(event: BehaviorEvent): void {
    const queueItem: QueuedEvent = {
      event,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.eventQueue.push(queueItem);
    
    if (this.config.debug) {
      console.log('[BehaviorCollector] Event added to queue:', event.eventType, this.eventQueue.length);
    }
    
    // 检查是否需要立即发送
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush({ immediate: true });
    } else {
      this.scheduleFlush();
    }
  }
  
  /**
   * 调度批量发送
   */
  private scheduleFlush(): void {
    if (this.batchTimer) {
      return; // 已经有待处理的定时器
    }
    
    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.flush({ immediate: false });
    }, this.config.batchInterval);
  }
  
  // =============================================================================
  // 批量发送
  // =============================================================================
  
  /**
   * 发送事件批次
   */
  async flush(options: { immediate?: boolean; saveOffline?: boolean } = {}): Promise<void> {
    const { immediate = false, saveOffline = false } = options;
    
    // 如果正在发送，等待完成
    if (this.isFlushing && !immediate) {
      return this.flushPromise || Promise.resolve();
    }
    
    // 清除定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 如果队列为空，直接返回
    if (this.eventQueue.length === 0) {
      return;
    }
    
    // 如果离线，保存到缓冲
    if (!this.isOnline || saveOffline) {
      this.saveOfflineBuffer();
      this.eventQueue = [];
      return;
    }
    
    // 开始发送
    this.isFlushing = true;
    
    this.flushPromise = this.doFlush();
    
    try {
      await this.flushPromise;
    } finally {
      this.isFlushing = false;
      this.flushPromise = null;
    }
  }
  
  /**
   * 执行批量发送
   */
  private async doFlush(): Promise<void> {
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    if (eventsToSend.length === 0) return;
    
    const batchId = generateBatchId();
    const request: BatchEventsRequest = {
      events: eventsToSend.map(e => e.event),
      clientTimestamp: new Date().toISOString(),
      batchId,
    };
    
    if (this.config.debug) {
      console.log('[BehaviorCollector] Sending batch:', batchId, eventsToSend.length, 'events');
    }
    
    try {
      const startTime = Date.now();
      const response = await this.sendBatch(request);
      const duration = Date.now() - startTime;
      
      if (this.config.debug) {
        console.log('[BehaviorCollector] Batch sent successfully:', response.receivedCount, 'events in', duration, 'ms');
      }
      
      // 检查响应
      if (!response.success) {
        throw new Error(response.error || 'Batch send failed');
      }
    } catch (error) {
      console.error('[BehaviorCollector] Failed to send batch:', error);
      
      // 重试逻辑：将事件放回队列
      const retryEvents = eventsToSend.map(e => ({
        ...e,
        retryCount: e.retryCount + 1,
      }));
      
      // 过滤掉重试次数过多的事件
      const maxRetries = 3;
      const eventsToRetry = retryEvents.filter(e => e.retryCount < maxRetries);
      
      if (eventsToRetry.length > 0) {
        this.eventQueue = [...eventsToRetry, ...this.eventQueue];
        
        // 如果是网络错误，保存到离线缓冲
        if (!this.isOnline) {
          this.saveOfflineBuffer();
          this.eventQueue = [];
        } else {
          // 延迟重试
          setTimeout(() => this.scheduleFlush(), 1000);
        }
      }
    }
  }
  
  /**
   * 发送批次到服务器
   */
  private async sendBatch(request: BatchEventsRequest): Promise<BatchEventsResponse> {
    const url = `${this.config.apiBaseUrl}/api/aigc/events/batch`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      keepalive: true, // 允许在页面卸载时发送
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  // =============================================================================
  // 热度更新
  // =============================================================================
  
  /**
   * 注册热度更新回调
   */
  onPopularityUpdate(callback: PopularityUpdateCallback): () => void {
    this.popularityCallbacks.push(callback);
    
    // 返回取消注册函数
    return () => {
      const index = this.popularityCallbacks.indexOf(callback);
      if (index > -1) {
        this.popularityCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * 通知热度更新
   */
  private notifyPopularityUpdate(toolRid: string, delta: number): void {
    for (const callback of this.popularityCallbacks) {
      try {
        callback(toolRid, delta);
      } catch (error) {
        console.error('[BehaviorCollector] Popularity callback error:', error);
      }
    }
  }
  
  // =============================================================================
  // 工具方法
  // =============================================================================
  
  /**
   * 设置用户 ID
   */
  setUserId(userId: string): void {
    this.sessionManager.setUserId(userId);
  }
  
  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }
  
  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.eventQueue.length;
  }
  
  /**
   * 检查是否在线
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }
  
  /**
   * 销毁收集器
   */
  destroy(): void {
    // 清除定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 发送剩余事件
    this.flush({ immediate: true, saveOffline: true });
    
    // 清除回调
    this.popularityCallbacks = [];
  }
}

// =============================================================================
// 单例实例
// =============================================================================

let defaultCollector: BehaviorCollector | null = null;

/**
 * 获取默认行为收集器实例
 */
export function getBehaviorCollector(config?: Partial<BehaviorCollectorConfig>): BehaviorCollector {
  if (!defaultCollector) {
    defaultCollector = new BehaviorCollector(config);
  }
  return defaultCollector;
}

/**
 * 重置默认实例 (用于测试)
 */
export function resetBehaviorCollector(): void {
  if (defaultCollector) {
    defaultCollector.destroy();
    defaultCollector = null;
  }
}

// =============================================================================
// 便捷导出
// =============================================================================

export {
  EventType,
  type BehaviorEvent,
  type SearchEventProperties,
  type ClickEventProperties,
  type ViewEventProperties,
  type CompareEventProperties,
  type BookmarkEventProperties,
  type ShareEventProperties,
  type BehaviorCollectorConfig,
};
