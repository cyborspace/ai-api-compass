/**
 * 行为收集 SDK - React Hook
 * 
 * 提供 React 组件中使用行为收集功能的 Hook
 */

"use client";

import { useCallback, useEffect, useRef, useState, createContext, useContext, ReactNode } from 'react';
import {
  BehaviorCollector,
  getBehaviorCollector,
  EventType,
  BehaviorEvent,
  SearchEventProperties,
  ClickEventProperties,
  ViewEventProperties,
  CompareEventProperties,
  BookmarkEventProperties,
  ShareEventProperties,
  BehaviorCollectorConfig,
} from '@/lib/analytics/behavior-collector';
import { SessionData, getSessionManager } from '@/lib/analytics/session-manager';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * useAnalytics Hook 返回值
 */
export interface UseAnalyticsReturn {
  // 事件追踪方法
  /** 通用事件追踪 */
  track: <T extends EventType>(eventType: T, properties: any) => void;
  /** 搜索事件追踪 */
  trackSearch: (query: string, resultCount: number, options?: Partial<SearchEventProperties>) => void;
  /** 点击事件追踪 */
  trackClick: (toolRid: string, source: ClickEventProperties['source'], options?: Partial<ClickEventProperties>) => void;
  /** 查看事件追踪 */
  trackView: (toolRid: string, options?: Partial<ViewEventProperties>) => void;
  /** 对比事件追踪 */
  trackCompare: (toolRids: string[], options?: Partial<CompareEventProperties>) => void;
  /** 收藏事件追踪 */
  trackBookmark: (toolRid: string, action: 'add' | 'remove', options?: Partial<BookmarkEventProperties>) => void;
  /** 分享事件追踪 */
  trackShare: (toolRid: string, channel: ShareEventProperties['channel'], options?: Partial<ShareEventProperties>) => void;
  
  // 用户管理
  /** 设置用户 ID */
  setUserId: (userId: string) => void;
  /** 获取会话 ID */
  getSessionId: () => string;
  /** 获取会话数据 */
  getSession: () => SessionData | null;
  
  // 状态
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 是否在线 */
  isOnline: boolean;
  /** 队列中的事件数量 */
  queueLength: number;
  
  // 工具方法
  /** 手动发送事件 */
  flush: () => Promise<void>;
  /** 注册热度更新回调 */
  onPopularityUpdate: (callback: (toolRid: string, delta: number) => void) => () => void;
}

/**
 * useAnalytics Hook 配置
 */
export interface UseAnalyticsOptions {
  /** 是否自动追踪页面浏览 */
  autoTrackPageView?: boolean;
  /** 是否追踪页面停留时间 */
  trackPageDuration?: boolean;
  /** 配置选项 */
  config?: Partial<BehaviorCollectorConfig>;
}

/**
 * 页面浏览追踪数据
 */
interface PageViewData {
  path: string;
  startTime: number;
  toolRid?: string;
}

// =============================================================================
// Hook 实现
// =============================================================================

/**
 * 行为分析 Hook
 * 
 * 提供在 React 组件中追踪用户行为的能力
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const { trackSearch, trackClick } = useAnalytics();
 *   
 *   const handleSearch = (query: string, results: any[]) => {
 *     trackSearch(query, results.length);
 *   };
 *   
 *   const handleClick = (tool: Tool) => {
 *     trackClick(tool.rid, 'search_result', { toolName: tool.name });
 *   };
 *   
 *   return <SearchBox onSearch={handleSearch} />;
 * }
 * ```
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    autoTrackPageView = true,
    trackPageDuration = true,
    config,
  } = options;
  
  // 状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueLength, setQueueLength] = useState(0);
  
  // 引用
  const collectorRef = useRef<BehaviorCollector | null>(null);
  const pageViewRef = useRef<PageViewData | null>(null);
  const popularityCallbacksRef = useRef<Set<(toolRid: string, delta: number) => void>>(new Set());
  
  // 初始化
  useEffect(() => {
    // 获取收集器实例
    collectorRef.current = getBehaviorCollector(config);
    setIsInitialized(true);
    setIsOnline(collectorRef.current.isOnlineStatus());
    
    // 定期更新状态
    const intervalId = setInterval(() => {
      if (collectorRef.current) {
        setIsOnline(collectorRef.current.isOnlineStatus());
        setQueueLength(collectorRef.current.getQueueLength());
      }
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [config]);
  
  // 自动追踪页面浏览
  useEffect(() => {
    if (!autoTrackPageView || !isInitialized) return;
    
    const trackPageView = () => {
      if (collectorRef.current && typeof window !== 'undefined') {
        // 结束上一个页面浏览
        if (pageViewRef.current && trackPageDuration) {
          const duration = Date.now() - pageViewRef.current.startTime;
          // 可以在这里记录页面停留时间
          if (collectorRef.current) {
            collectorRef.current.track(EventType.VIEW, {
              toolRid: pageViewRef.current.toolRid || 'page',
              duration,
              depth: 'basic',
            });
          }
        }
        
        // 开始新的页面浏览
        pageViewRef.current = {
          path: window.location.pathname,
          startTime: Date.now(),
        };
      }
    };
    
    // 初始页面浏览
    trackPageView();
    
    // 监听路由变化 (Next.js)
    // 注意：在 App Router 中，路由变化不会触发传统的事件
    // 这里使用 visibilitychange 来追踪页面切换
    
    return () => {
      // 清理时记录最后的页面浏览
      if (pageViewRef.current && trackPageDuration && collectorRef.current) {
        const duration = Date.now() - pageViewRef.current.startTime;
        collectorRef.current.track(EventType.VIEW, {
          toolRid: pageViewRef.current.toolRid || 'page',
          duration,
          depth: 'basic',
        });
      }
    };
  }, [autoTrackPageView, trackPageDuration, isInitialized]);
  
  // =============================================================================
  // 事件追踪方法
  // =============================================================================
  
  /**
   * 通用事件追踪
   */
  const track = useCallback(<T extends EventType>(eventType: T, properties: any) => {
    if (!collectorRef.current) {
      console.warn('[useAnalytics] Collector not initialized');
      return;
    }
    
    const startTime = Date.now();
    collectorRef.current.track(eventType, properties);
    const duration = Date.now() - startTime;
    
    // 确保事件延迟 < 100ms
    if (duration > 100) {
      console.warn(`[useAnalytics] Event tracking took ${duration}ms`);
    }
  }, []);
  
  /**
   * 搜索事件追踪
   */
  const trackSearch = useCallback((
    query: string,
    resultCount: number,
    options?: Partial<SearchEventProperties>
  ) => {
    if (!collectorRef.current) return;
    collectorRef.current.trackSearch(query, resultCount, options);
  }, []);
  
  /**
   * 点击事件追踪
   */
  const trackClick = useCallback((
    toolRid: string,
    source: ClickEventProperties['source'],
    options?: Partial<ClickEventProperties>
  ) => {
    if (!collectorRef.current) return;
    collectorRef.current.trackClick(toolRid, source, options);
  }, []);
  
  /**
   * 查看事件追踪
   */
  const trackView = useCallback((
    toolRid: string,
    options?: Partial<ViewEventProperties>
  ) => {
    if (!collectorRef.current) return;
    
    // 更新页面浏览引用
    if (pageViewRef.current) {
      pageViewRef.current.toolRid = toolRid;
    }
    
    collectorRef.current.trackView(toolRid, options);
  }, []);
  
  /**
   * 对比事件追踪
   */
  const trackCompare = useCallback((
    toolRids: string[],
    options?: Partial<CompareEventProperties>
  ) => {
    if (!collectorRef.current) return;
    collectorRef.current.trackCompare(toolRids, options);
  }, []);
  
  /**
   * 收藏事件追踪
   */
  const trackBookmark = useCallback((
    toolRid: string,
    action: 'add' | 'remove',
    options?: Partial<BookmarkEventProperties>
  ) => {
    if (!collectorRef.current) return;
    collectorRef.current.trackBookmark(toolRid, action, options);
  }, []);
  
  /**
   * 分享事件追踪
   */
  const trackShare = useCallback((
    toolRid: string,
    channel: ShareEventProperties['channel'],
    options?: Partial<ShareEventProperties>
  ) => {
    if (!collectorRef.current) return;
    collectorRef.current.trackShare(toolRid, channel, options);
  }, []);
  
  // =============================================================================
  // 用户管理方法
  // =============================================================================
  
  /**
   * 设置用户 ID
   */
  const setUserId = useCallback((userId: string) => {
    if (!collectorRef.current) return;
    collectorRef.current.setUserId(userId);
  }, []);
  
  /**
   * 获取会话 ID
   */
  const getSessionId = useCallback(() => {
    if (!collectorRef.current) return '';
    return collectorRef.current.getSessionId();
  }, []);
  
  /**
   * 获取会话数据
   */
  const getSession = useCallback(() => {
    return getSessionManager().getSession();
  }, []);
  
  // =============================================================================
  // 工具方法
  // =============================================================================
  
  /**
   * 手动发送事件
   */
  const flush = useCallback(async () => {
    if (!collectorRef.current) return;
    await collectorRef.current.flush({ immediate: true });
  }, []);
  
  /**
   * 注册热度更新回调
   */
  const onPopularityUpdate = useCallback((callback: (toolRid: string, delta: number) => void) => {
    if (!collectorRef.current) {
      return () => {};
    }
    
    popularityCallbacksRef.current.add(callback);
    const unsubscribe = collectorRef.current.onPopularityUpdate(callback);
    
    return () => {
      popularityCallbacksRef.current.delete(callback);
      unsubscribe();
    };
  }, []);
  
  // =============================================================================
  // 返回值
  // =============================================================================
  
  return {
    // 事件追踪方法
    track,
    trackSearch,
    trackClick,
    trackView,
    trackCompare,
    trackBookmark,
    trackShare,
    
    // 用户管理
    setUserId,
    getSessionId,
    getSession,
    
    // 状态
    isInitialized,
    isOnline,
    queueLength,
    
    // 工具方法
    flush,
    onPopularityUpdate,
  };
}

// =============================================================================
// 专用 Hooks
// =============================================================================

/**
 * 搜索追踪 Hook
 * 
 * 专门用于搜索场景的 Hook，提供搜索相关的追踪功能
 */
export function useSearchTracking() {
  const { trackSearch, trackClick } = useAnalytics();
  const searchIdRef = useRef<string>('');
  
  /**
   * 开始新的搜索会话
   */
  const startSearch = useCallback((query: string) => {
    searchIdRef.current = `search_${Date.now()}`;
    return searchIdRef.current;
  }, []);
  
  /**
   * 记录搜索结果
   */
  const recordSearchResults = useCallback((
    query: string,
    resultCount: number,
    options?: Partial<SearchEventProperties>
  ) => {
    trackSearch(query, resultCount, {
      ...options,
      source: options?.source || 'home',
    });
  }, [trackSearch]);
  
  /**
   * 记录搜索结果点击
   */
  const recordResultClick = useCallback((
    toolRid: string,
    position: number,
    options?: Partial<ClickEventProperties>
  ) => {
    trackClick(toolRid, 'search_result', {
      ...options,
      position,
    });
  }, [trackClick]);
  
  return {
    startSearch,
    recordSearchResults,
    recordResultClick,
  };
}

/**
 * 工具详情追踪 Hook
 * 
 * 专门用于工具详情页的 Hook，追踪查看时长和交互
 */
export function useToolDetailTracking(toolRid: string, toolName?: string) {
  const { trackView, trackBookmark, trackShare } = useAnalytics();
  const viewStartTimeRef = useRef<number>(Date.now());
  const hasTrackedViewRef = useRef(false);
  
  // 追踪工具查看
  useEffect(() => {
    if (!toolRid || hasTrackedViewRef.current) return;
    
    hasTrackedViewRef.current = true;
    viewStartTimeRef.current = Date.now();
    
    trackView(toolRid, {
      toolName,
      depth: 'basic',
    });
    
    // 页面卸载时记录查看时长
    return () => {
      const duration = Date.now() - viewStartTimeRef.current;
      trackView(toolRid, {
        toolName,
        duration,
        depth: duration > 30000 ? 'full' : duration > 10000 ? 'detailed' : 'basic',
      });
    };
  }, [toolRid, toolName, trackView]);
  
  /**
   * 记录收藏操作
   */
  const recordBookmark = useCallback((action: 'add' | 'remove') => {
    trackBookmark(toolRid, action, { toolName });
  }, [toolRid, toolName, trackBookmark]);
  
  /**
   * 记录分享操作
   */
  const recordShare = useCallback((channel: ShareEventProperties['channel']) => {
    trackShare(toolRid, channel, { toolName });
  }, [toolRid, toolName, trackShare]);
  
  return {
    recordBookmark,
    recordShare,
  };
}

/**
 * 对比追踪 Hook
 * 
 * 专门用于工具对比场景的 Hook
 */
export function useCompareTracking() {
  const { trackCompare, trackClick } = useAnalytics();
  const compareIdRef = useRef<string>('');
  
  /**
   * 开始对比会话
   */
  const startCompare = useCallback(() => {
    compareIdRef.current = `compare_${Date.now()}`;
    return compareIdRef.current;
  }, []);
  
  /**
   * 记录对比操作
   */
  const recordCompare = useCallback((
    toolRids: string[],
    toolNames?: string[],
    dimensions?: CompareEventProperties['dimensions']
  ) => {
    trackCompare(toolRids, {
      toolNames,
      dimensions,
      source: 'compare_page',
    });
  }, [trackCompare]);
  
  /**
   * 记录对比结果点击
   */
  const recordCompareClick = useCallback((toolRid: string) => {
    trackClick(toolRid, 'compare');
  }, [trackClick]);
  
  return {
    startCompare,
    recordCompare,
    recordCompareClick,
  };
}

// =============================================================================
// Provider 组件 (可选)
// =============================================================================

/**
 * Analytics Context
 */
const AnalyticsContext = createContext<UseAnalyticsReturn | null>(null);

/**
 * Analytics Provider Props
 */
interface AnalyticsProviderProps {
  children: ReactNode;
  options?: UseAnalyticsOptions;
}

/**
 * Analytics Provider 组件
 * 
 * 在应用根组件中使用，提供全局的分析追踪能力
 * 
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { AnalyticsProvider } from '@/hooks/useAnalytics';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AnalyticsProvider>
 *           {children}
 *         </AnalyticsProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AnalyticsProvider({ children, options }: AnalyticsProviderProps) {
  const analytics = useAnalytics(options);
  
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * 使用 Analytics Context
 * 
 * 在 AnalyticsProvider 内部使用，获取分析追踪能力
 */
export function useAnalyticsContext(): UseAnalyticsReturn {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  
  return context;
}

// =============================================================================
// 默认导出
// =============================================================================

export default useAnalytics;
