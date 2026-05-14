/**
 * 行为收集 SDK 测试文件
 * 
 * 验证 SDK 功能完整性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟 localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// 模拟 fetch
global.fetch = vi.fn();

// 模拟 navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Test User Agent',
    language: 'en-US',
    onLine: true,
  },
});

// 模拟 window
Object.defineProperty(global, 'window', {
  value: {
    location: { pathname: '/test' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// 模拟 document
Object.defineProperty(global, 'document', {
  value: {
    title: 'Test Page',
    referrer: '',
    addEventListener: vi.fn(),
    visibilityState: 'visible',
  },
});

// 导入模块
import {
  EventType,
  BehaviorCollector,
  getBehaviorCollector,
  resetBehaviorCollector,
  DEFAULT_CONFIG,
} from './behavior-collector';
import {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './session-manager';

describe('行为收集 SDK', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetBehaviorCollector();
    resetSessionManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Types', () => {
    it('应该定义所有事件类型', () => {
      expect(EventType.SEARCH).toBe('search');
      expect(EventType.CLICK).toBe('click');
      expect(EventType.VIEW).toBe('view');
      expect(EventType.COMPARE).toBe('compare');
      expect(EventType.BOOKMARK).toBe('bookmark');
      expect(EventType.SHARE).toBe('share');
    });
  });

  describe('Session Manager', () => {
    it('应该创建会话', () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();
      
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('应该持久化会话到 localStorage', () => {
      const manager = new SessionManager();
      const session = manager.getSession();
      
      expect(session).toBeTruthy();
      expect(session?.sessionId).toBeTruthy();
      expect(session?.createdAt).toBeTruthy();
    });

    it('应该支持设置用户 ID', () => {
      const manager = new SessionManager();
      manager.setUserId('user-123');
      
      expect(manager.getUserId()).toBe('user-123');
    });

    it('应该返回单例实例', () => {
      const instance1 = getSessionManager();
      const instance2 = getSessionManager();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Behavior Collector', () => {
    it('应该初始化并返回单例', () => {
      const collector1 = getBehaviorCollector();
      const collector2 = getBehaviorCollector();
      
      expect(collector1).toBe(collector2);
    });

    it('应该追踪搜索事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackSearch('gpt-4', 10, { source: 'home' });
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该追踪点击事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackClick('tool-rid-123', 'search_result', { toolName: 'GPT-4' });
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该追踪查看事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackView('tool-rid-123', { toolName: 'GPT-4' });
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该追踪对比事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackCompare(['tool-1', 'tool-2', 'tool-3']);
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该追踪收藏事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackBookmark('tool-rid-123', 'add');
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该追踪分享事件', () => {
      const collector = getBehaviorCollector({ debug: false });
      
      collector.trackShare('tool-rid-123', 'wechat');
      
      expect(collector.getQueueLength()).toBe(1);
    });

    it('应该批量发送事件 (达到阈值)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, receivedCount: 20 }),
      });
      (global.fetch as any) = mockFetch;

      const collector = getBehaviorCollector({
        debug: false,
        batchSize: 20,
        batchInterval: 5000,
      });

      // 添加 20 个事件
      for (let i = 0; i < 20; i++) {
        collector.trackClick(`tool-${i}`, 'search_result');
      }

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('应该支持热度更新回调', () => {
      const collector = getBehaviorCollector({ debug: false });
      const callback = vi.fn();
      
      const unsubscribe = collector.onPopularityUpdate(callback);
      
      collector.trackClick('tool-123', 'search_result');
      
      expect(callback).toHaveBeenCalledWith('tool-123', 1);
      
      unsubscribe();
    });

    it('应该返回会话 ID', () => {
      const collector = getBehaviorCollector();
      const sessionId = collector.getSessionId();
      
      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');
    });

    it('应该支持设置用户 ID', () => {
      const collector = getBehaviorCollector();
      collector.setUserId('user-456');
      
      expect(collector.getSessionId()).toBeTruthy();
    });
  });

  describe('Default Config', () => {
    it('应该有正确的默认配置', () => {
      expect(DEFAULT_CONFIG.batchSize).toBe(20);
      expect(DEFAULT_CONFIG.batchInterval).toBe(5000);
      expect(DEFAULT_CONFIG.enableOfflineBuffer).toBe(true);
      expect(DEFAULT_CONFIG.sessionValidityDays).toBe(30);
    });
  });
});
