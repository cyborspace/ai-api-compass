/**
 * 行为收集 SDK - 入口文件
 * 
 * 提供统一的分析追踪能力
 * 
 * @example
 * ```ts
 * // 直接使用收集器
 * import { getBehaviorCollector, EventType } from '@/lib/analytics';
 * 
 * const collector = getBehaviorCollector();
 * collector.trackSearch('gpt-4', 10);
 * collector.trackClick('tool-rid-123', 'search_result');
 * ```
 * 
 * @example
 * ```tsx
 * // 在 React 组件中使用 Hook
 * import { useAnalytics } from '@/hooks/useAnalytics';
 * 
 * function SearchComponent() {
 *   const { trackSearch, trackClick } = useAnalytics();
 *   
 *   return <SearchBox onSearch={(q, results) => trackSearch(q, results.length)} />;
 * }
 * ```
 */

import type { BehaviorCollectorConfig } from './event-types';
import { getBehaviorCollector } from './behavior-collector';
import { getSessionManager } from './session-manager';

// =============================================================================
// 核心模块
// =============================================================================

// 行为收集器
export {
  BehaviorCollector,
  getBehaviorCollector,
  resetBehaviorCollector,
  EventType,
} from './behavior-collector';

// 类型导出
export type {
  BehaviorEvent,
  SearchEventProperties,
  ClickEventProperties,
  ViewEventProperties,
  CompareEventProperties,
  BookmarkEventProperties,
  ShareEventProperties,
  BatchEventsRequest,
  BatchEventsResponse,
  BehaviorCollectorConfig,
} from './event-types';

// Session 管理
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './session-manager';

export type {
  SessionData,
  SessionManagerConfig,
} from './session-manager';

// =============================================================================
// 完整事件类型导出
// =============================================================================

export type {
  BaseEvent,
  SearchEvent,
  ClickEvent,
  ViewEvent,
  CompareEvent,
  BookmarkEvent,
  ShareEvent,
  EventPropertiesMap,
  EventFilter,
  EventHandler,
  DeviceTypeDetector,
} from './event-types';

// 默认配置
export { DEFAULT_CONFIG } from './event-types';

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 快速初始化分析追踪
 * 
 * 在应用启动时调用，初始化默认配置
 */
export function initializeAnalytics(config?: Partial<BehaviorCollectorConfig>) {
  const collector = getBehaviorCollector(config);
  
  if (typeof window !== 'undefined') {
    // 暴露到全局以便调试
    (window as any).__analytics__ = {
      collector,
      getSession: () => getSessionManager().getSession(),
    };
  }
  
  return collector;
}

/**
 * 设置用户身份
 * 
 * 用户登录后调用，关联用户 ID
 */
export function identifyUser(userId: string) {
  const collector = getBehaviorCollector();
  collector.setUserId(userId);
}

/**
 * 获取当前会话信息
 */
export function getCurrentSession() {
  return getSessionManager().getSession();
}

/**
 * 手动发送所有待发送的事件
 */
export async function flushEvents() {
  const collector = getBehaviorCollector();
  await collector.flush({ immediate: true });
}
