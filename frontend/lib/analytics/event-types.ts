/**
 * 行为收集 SDK - 事件类型定义
 * 
 * 定义用户行为事件的结构和类型
 */

// =============================================================================
// 事件类型枚举
// =============================================================================

/**
 * 用户行为事件类型
 */
export enum EventType {
  /** 搜索事件 */
  SEARCH = 'search',
  /** 点击事件 */
  CLICK = 'click',
  /** 查看事件 */
  VIEW = 'view',
  /** 对比事件 */
  COMPARE = 'compare',
  /** 收藏事件 */
  BOOKMARK = 'bookmark',
  /** 分享事件 */
  SHARE = 'share',
}

// =============================================================================
// 基础事件结构
// =============================================================================

/**
 * 事件基础属性
 */
export interface BaseEvent {
  /** 事件类型 */
  eventType: EventType;
  /** 事件时间戳 (ISO 8601) */
  timestamp: string;
  /** 会话ID */
  sessionId: string;
  /** 用户ID (可选，登录后设置) */
  userId?: string;
  /** 页面路径 */
  pagePath: string;
  /** 页面标题 */
  pageTitle?: string;
  /** 来源 */
  referrer?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 设备类型 */
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// 具体事件类型定义
// =============================================================================

/**
 * 搜索事件属性
 */
export interface SearchEventProperties {
  /** 搜索查询词 */
  query: string;
  /** 搜索结果数量 */
  resultCount: number;
  /** 搜索来源 */
  source?: 'header' | 'home' | 'category' | 'suggestion';
  /** 过滤条件 */
  filters?: {
    category?: string;
    pricingType?: string;
    modalities?: string[];
  };
}

/**
 * 点击事件属性
 */
export interface ClickEventProperties {
  /** 工具 RID */
  toolRid: string;
  /** 工具名称 */
  toolName?: string;
  /** 工具 Slug */
  toolSlug?: string;
  /** 点击来源位置 */
  source: 'search_result' | 'category_list' | 'recommendation' | 'compare' | 'detail_page' | 'other';
  /** 点击位置索引 (列表中的位置) */
  position?: number;
  /** 是否为新标签页打开 */
  newTab?: boolean;
}

/**
 * 查看事件属性
 */
export interface ViewEventProperties {
  /** 工具 RID */
  toolRid: string;
  /** 工具名称 */
  toolName?: string;
  /** 工具 Slug */
  toolSlug?: string;
  /** 查看时长 (毫秒) */
  duration?: number;
  /** 查看深度 */
  depth?: 'basic' | 'detailed' | 'full';
  /** 滚动百分比 */
  scrollPercentage?: number;
}

/**
 * 对比事件属性
 */
export interface CompareEventProperties {
  /** 对比的工具 RID 列表 */
  toolRids: string[];
  /** 对比的工具名称列表 */
  toolNames?: string[];
  /** 对比维度 */
  dimensions?: ('pricing' | 'capability' | 'performance' | 'reputation')[];
  /** 对比来源 */
  source?: 'compare_page' | 'tool_detail' | 'recommendation';
}

/**
 * 收藏事件属性
 */
export interface BookmarkEventProperties {
  /** 工具 RID */
  toolRid: string;
  /** 工具名称 */
  toolName?: string;
  /** 操作类型 */
  action: 'add' | 'remove';
  /** 收藏夹 ID */
  collectionId?: string;
}

/**
 * 分享事件属性
 */
export interface ShareEventProperties {
  /** 工具 RID */
  toolRid: string;
  /** 工具名称 */
  toolName?: string;
  /** 分享渠道 */
  channel: 'wechat' | 'weibo' | 'twitter' | 'facebook' | 'link' | 'qr_code' | 'other';
  /** 分享内容类型 */
  contentType?: 'tool' | 'compare' | 'review';
}

// =============================================================================
// 完整事件类型
// =============================================================================

/**
 * 搜索事件
 */
export interface SearchEvent extends BaseEvent {
  eventType: EventType.SEARCH;
  properties: SearchEventProperties;
}

/**
 * 点击事件
 */
export interface ClickEvent extends BaseEvent {
  eventType: EventType.CLICK;
  properties: ClickEventProperties;
}

/**
 * 查看事件
 */
export interface ViewEvent extends BaseEvent {
  eventType: EventType.VIEW;
  properties: ViewEventProperties;
}

/**
 * 对比事件
 */
export interface CompareEvent extends BaseEvent {
  eventType: EventType.COMPARE;
  properties: CompareEventProperties;
}

/**
 * 收藏事件
 */
export interface BookmarkEvent extends BaseEvent {
  eventType: EventType.BOOKMARK;
  properties: BookmarkEventProperties;
}

/**
 * 分享事件
 */
export interface ShareEvent extends BaseEvent {
  eventType: EventType.SHARE;
  properties: ShareEventProperties;
}

// =============================================================================
// 联合类型
// =============================================================================

/**
 * 所有用户行为事件的联合类型
 */
export type BehaviorEvent = 
  | SearchEvent 
  | ClickEvent 
  | ViewEvent 
  | CompareEvent 
  | BookmarkEvent 
  | ShareEvent;

/**
 * 事件属性映射类型
 */
export interface EventPropertiesMap {
  [EventType.SEARCH]: SearchEventProperties;
  [EventType.CLICK]: ClickEventProperties;
  [EventType.VIEW]: ViewEventProperties;
  [EventType.COMPARE]: CompareEventProperties;
  [EventType.BOOKMARK]: BookmarkEventProperties;
  [EventType.SHARE]: ShareEventProperties;
}

// =============================================================================
// 批量提交相关类型
// =============================================================================

/**
 * 批量事件提交请求
 */
export interface BatchEventsRequest {
  /** 事件列表 */
  events: BehaviorEvent[];
  /** 客户端时间戳 */
  clientTimestamp: string;
  /** 批次 ID */
  batchId: string;
}

/**
 * 批量事件提交响应
 */
export interface BatchEventsResponse {
  /** 是否成功 */
  success: boolean;
  /** 接收的事件数量 */
  receivedCount: number;
  /** 处理时间 (毫秒) */
  processingTime?: number;
  /** 错误信息 */
  error?: string;
}

// =============================================================================
// 配置类型
// =============================================================================

/**
 * 行为收集器配置
 */
export interface BehaviorCollectorConfig {
  /** API 基础 URL */
  apiBaseUrl: string;
  /** 批量发送阈值 - 事件数量 */
  batchSize: number;
  /** 批量发送阈值 - 时间间隔 (毫秒) */
  batchInterval: number;
  /** 是否启用离线缓冲 */
  enableOfflineBuffer: boolean;
  /** 本地存储键名前缀 */
  storageKeyPrefix: string;
  /** Session 有效期 (天) */
  sessionValidityDays: number;
  /** 是否启用调试模式 */
  debug: boolean;
  /** 是否自动追踪页面浏览 */
  autoTrackPageView: boolean;
  /** 是否追踪性能指标 */
  trackPerformance: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: BehaviorCollectorConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  batchSize: 20,
  batchInterval: 5000, // 5秒
  enableOfflineBuffer: true,
  storageKeyPrefix: 'aigc_analytics_',
  sessionValidityDays: 30,
  debug: process.env.NODE_ENV === 'development',
  autoTrackPageView: true,
  trackPerformance: true,
};

// =============================================================================
// 工具函数类型
// =============================================================================

/**
 * 设备类型检测函数
 */
export type DeviceTypeDetector = () => 'desktop' | 'mobile' | 'tablet';

/**
 * 事件处理器
 */
export type EventHandler<T extends EventType> = (event: BehaviorEvent & { eventType: T }) => void;

/**
 * 事件过滤器
 */
export type EventFilter = (event: BehaviorEvent) => boolean;
