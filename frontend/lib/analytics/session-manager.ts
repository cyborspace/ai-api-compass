/**
 * 行为收集 SDK - Session 管理器
 * 
 * 管理用户会话，支持 30 天有效期
 */

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 会话数据结构
 */
export interface SessionData {
  /** 会话 ID */
  sessionId: string;
  /** 会话创建时间 (ISO 8601) */
  createdAt: string;
  /** 会话最后活跃时间 (ISO 8601) */
  lastActiveAt: string;
  /** 用户 ID (可选) */
  userId?: string;
  /** 首次来源 */
  initialReferrer?: string;
  /** 首次落地页 */
  initialPagePath?: string;
  /** 设备 ID */
  deviceId?: string;
  /** 会话序号 */
  sessionNumber: number;
  /** 自定义属性 */
  customAttributes?: Record<string, unknown>;
}

/**
 * Session 管理器配置
 */
export interface SessionManagerConfig {
  /** 存储键名前缀 */
  storageKeyPrefix: string;
  /** Session 有效期 (天) */
  validityDays: number;
  /** 是否持久化到 localStorage */
  persistToStorage: boolean;
  /** Session 过期回调 */
  onSessionExpire?: (expiredSession: SessionData) => void;
  /** 新 Session 创建回调 */
  onSessionCreate?: (newSession: SessionData) => void;
}

/**
 * 默认配置
 */
const DEFAULT_SESSION_CONFIG: SessionManagerConfig = {
  storageKeyPrefix: 'aigc_analytics_',
  validityDays: 30,
  persistToStorage: true,
};

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 生成唯一 ID
 */
function generateUniqueId(): string {
  // 使用 crypto API 生成 UUID v4
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 时间戳 + 随机数
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 生成设备指纹
 */
function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];
  
  // 简单的指纹生成
  const fingerprint = components
    .map(c => String(c))
    .join('|');
  
  // 简单哈希
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 检查日期是否过期
 */
function isExpired(dateString: string, validityDays: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > validityDays;
}

// =============================================================================
// Session 管理器类
// =============================================================================

/**
 * Session 管理器
 * 
 * 负责管理用户会话，包括创建、恢复、更新和过期处理
 */
export class SessionManager {
  private config: SessionManagerConfig;
  private sessionData: SessionData | null = null;
  private storageKey: string;
  
  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.storageKey = `${this.config.storageKeyPrefix}session`;
    
    // 初始化时尝试恢复会话
    this.initialize();
  }
  
  /**
   * 初始化 Session
   */
  private initialize(): void {
    if (typeof window === 'undefined') {
      // SSR 环境，创建临时会话
      this.createSession();
      return;
    }
    
    // 尝试从存储中恢复会话
    const restored = this.restoreSession();
    
    if (restored) {
      // 检查是否过期
      if (isExpired(restored.lastActiveAt, this.config.validityDays)) {
        // 会话过期，创建新会话
        this.config.onSessionExpire?.(restored);
        this.createSession(restored.sessionNumber + 1);
      } else {
        // 会话有效，更新最后活跃时间
        this.sessionData = restored;
        this.updateLastActive();
      }
    } else {
      // 没有存储的会话，创建新会话
      this.createSession();
    }
  }
  
  /**
   * 创建新会话
   */
  private createSession(sessionNumber: number = 1): SessionData {
    const now = new Date().toISOString();
    
    this.sessionData = {
      sessionId: generateUniqueId(),
      createdAt: now,
      lastActiveAt: now,
      sessionNumber,
      initialReferrer: typeof document !== 'undefined' ? document.referrer : undefined,
      initialPagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      deviceId: this.getOrCreateDeviceId(),
    };
    
    // 持久化存储
    this.persistSession();
    
    // 触发回调
    this.config.onSessionCreate?.(this.sessionData);
    
    return this.sessionData;
  }
  
  /**
   * 获取或创建设备 ID
   */
  private getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return '';
    
    const deviceKey = `${this.config.storageKeyPrefix}device_id`;
    let deviceId = localStorage.getItem(deviceKey);
    
    if (!deviceId) {
      deviceId = `${generateDeviceFingerprint()}-${Date.now().toString(36)}`;
      localStorage.setItem(deviceKey, deviceId);
    }
    
    return deviceId;
  }
  
  /**
   * 持久化会话到存储
   */
  private persistSession(): void {
    if (!this.config.persistToStorage || typeof window === 'undefined') return;
    if (!this.sessionData) return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessionData));
    } catch (error) {
      console.warn('[SessionManager] Failed to persist session:', error);
    }
  }
  
  /**
   * 从存储恢复会话
   */
  private restoreSession(): SessionData | null {
    if (!this.config.persistToStorage || typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored) as SessionData;
      }
    } catch (error) {
      console.warn('[SessionManager] Failed to restore session:', error);
    }
    
    return null;
  }
  
  /**
   * 更新最后活跃时间
   */
  private updateLastActive(): void {
    if (!this.sessionData) return;
    
    this.sessionData.lastActiveAt = new Date().toISOString();
    this.persistSession();
  }
  
  // =============================================================================
  // 公共 API
  // =============================================================================
  
  /**
   * 获取当前会话 ID
   */
  getSessionId(): string {
    if (!this.sessionData) {
      this.initialize();
    }
    return this.sessionData?.sessionId || '';
  }
  
  /**
   * 获取完整会话数据
   */
  getSession(): SessionData | null {
    this.updateLastActive();
    return this.sessionData;
  }
  
  /**
   * 设置用户 ID
   */
  setUserId(userId: string): void {
    if (!this.sessionData) return;
    
    this.sessionData.userId = userId;
    this.persistSession();
  }
  
  /**
   * 获取用户 ID
   */
  getUserId(): string | undefined {
    return this.sessionData?.userId;
  }
  
  /**
   * 设置自定义属性
   */
  setCustomAttribute(key: string, value: unknown): void {
    if (!this.sessionData) return;
    
    if (!this.sessionData.customAttributes) {
      this.sessionData.customAttributes = {};
    }
    
    this.sessionData.customAttributes[key] = value;
    this.persistSession();
  }
  
  /**
   * 获取自定义属性
   */
  getCustomAttribute(key: string): unknown {
    return this.sessionData?.customAttributes?.[key];
  }
  
  /**
   * 获取设备 ID
   */
  getDeviceId(): string | undefined {
    return this.sessionData?.deviceId;
  }
  
  /**
   * 获取会话序号
   */
  getSessionNumber(): number {
    return this.sessionData?.sessionNumber || 1;
  }
  
  /**
   * 强制创建新会话
   */
  forceNewSession(): SessionData {
    const currentNumber = this.sessionData?.sessionNumber || 0;
    return this.createSession(currentNumber + 1);
  }
  
  /**
   * 检查会话是否有效
   */
  isValid(): boolean {
    if (!this.sessionData) return false;
    return !isExpired(this.sessionData.lastActiveAt, this.config.validityDays);
  }
  
  /**
   * 获取会话持续时间 (毫秒)
   */
  getSessionDuration(): number {
    if (!this.sessionData) return 0;
    
    const createdAt = new Date(this.sessionData.createdAt).getTime();
    const now = Date.now();
    return now - createdAt;
  }
  
  /**
   * 清除会话
   */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn('[SessionManager] Failed to clear session:', error);
      }
    }
    this.sessionData = null;
  }
  
  /**
   * 销毁管理器
   */
  destroy(): void {
    this.updateLastActive();
    this.sessionData = null;
  }
}

// =============================================================================
// 单例实例
// =============================================================================

let defaultInstance: SessionManager | null = null;

/**
 * 获取默认 Session 管理器实例
 */
export function getSessionManager(config?: Partial<SessionManagerConfig>): SessionManager {
  if (!defaultInstance) {
    defaultInstance = new SessionManager(config);
  }
  return defaultInstance;
}

/**
 * 重置默认实例 (用于测试)
 */
export function resetSessionManager(): void {
  defaultInstance = null;
}
