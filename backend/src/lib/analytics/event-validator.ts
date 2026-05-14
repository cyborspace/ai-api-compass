/**
 * Event Validator
 * 
 * 事件验证器
 * 
 * 功能:
 * - 验证事件数据格式
 * - 验证事件类型
 * - 验证工具 RID 存在性
 * - 提供验证错误详情
 */

import { PrismaClient } from '@prisma/client';
import { EventType, EVENT_WEIGHTS } from '../../services/heat-calculator.js';

// =============================================================================
// Types & Constants
// =============================================================================

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** 验证错误 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/** 验证警告 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/** 事件输入数据 */
export interface EventInput {
  toolRid: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/** 批量事件输入 */
export interface BatchEventInput {
  events: EventInput[];
}

/** 有效的事件类型 */
const VALID_EVENT_TYPES: EventType[] = ['search', 'click', 'compare', 'bookmark', 'share'];

/** 元数据字段限制 */
const METADATA_MAX_SIZE = 1024 * 10; // 10KB
const METADATA_MAX_DEPTH = 5;

// =============================================================================
// Event Validator Class
// =============================================================================

export class EventValidator {
  private prisma: PrismaClient;
  private toolRidCache: Set<string> = new Set();
  private cacheExpiry: number = 0;
  private cacheTTL: number = 5 * 60 * 1000; // 5 分钟

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 验证单个事件
   */
  async validateEvent(event: EventInput): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 验证 toolRid
    const toolRidResult = this.validateToolRid(event.toolRid);
    errors.push(...toolRidResult.errors);

    // 如果 toolRid 格式正确,验证是否存在
    if (toolRidResult.errors.length === 0) {
      const existsResult = await this.validateToolExists(event.toolRid);
      errors.push(...existsResult.errors);
      warnings.push(...existsResult.warnings);
    }

    // 验证 eventType
    const eventTypeResult = this.validateEventType(event.eventType);
    errors.push(...eventTypeResult.errors);
    warnings.push(...eventTypeResult.warnings);

    // 验证 userId (可选)
    if (event.userId) {
      const userIdResult = this.validateUserId(event.userId);
      errors.push(...userIdResult.errors);
    }

    // 验证 sessionId (可选)
    if (event.sessionId) {
      const sessionIdResult = this.validateSessionId(event.sessionId);
      errors.push(...sessionIdResult.errors);
    }

    // 验证 metadata (可选)
    if (event.metadata) {
      const metadataResult = this.validateMetadata(event.metadata);
      errors.push(...metadataResult.errors);
      warnings.push(...metadataResult.warnings);
    }

    // 验证 timestamp (可选)
    if (event.timestamp) {
      const timestampResult = this.validateTimestamp(event.timestamp);
      errors.push(...timestampResult.errors);
      warnings.push(...timestampResult.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证批量事件
   */
  async validateBatchEvents(batch: BatchEventInput): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 验证 events 数组
    if (!batch.events) {
      errors.push({
        field: 'events',
        message: 'events field is required',
        code: 'EVENTS_REQUIRED',
      });
      return { valid: false, errors, warnings };
    }

    if (!Array.isArray(batch.events)) {
      errors.push({
        field: 'events',
        message: 'events must be an array',
        code: 'EVENTS_ARRAY',
      });
      return { valid: false, errors, warnings };
    }

    if (batch.events.length === 0) {
      errors.push({
        field: 'events',
        message: 'events array cannot be empty',
        code: 'EVENTS_EMPTY',
      });
      return { valid: false, errors, warnings };
    }

    // 限制批量大小
    if (batch.events.length > 1000) {
      errors.push({
        field: 'events',
        message: 'events array cannot exceed 1000 items',
        code: 'EVENTS_LIMIT',
      });
      return { valid: false, errors, warnings };
    }

    // 验证每个事件
    const eventErrors: Map<number, ValidationError[]> = new Map();
    const eventWarnings: Map<number, ValidationWarning[]> = new Map();

    // 收集所有唯一的 toolRid
    const toolRids = new Set<string>();
    for (const event of batch.events) {
      if (event.toolRid) {
        toolRids.add(event.toolRid);
      }
    }

    // 批量验证工具存在性
    await this.prefetchToolRids(Array.from(toolRids));

    for (let i = 0; i < batch.events.length; i++) {
      const result = await this.validateEvent(batch.events[i]);
      
      if (!result.valid) {
        eventErrors.set(i, result.errors);
      }
      
      if (result.warnings.length > 0) {
        eventWarnings.set(i, result.warnings);
      }
    }

    // 汇总错误
    if (eventErrors.size > 0) {
      for (const [index, errs] of eventErrors) {
        for (const err of errs) {
          errors.push({
            ...err,
            field: `events[${index}].${err.field}`,
          });
        }
      }
    }

    // 汇总警告
    if (eventWarnings.size > 0) {
      for (const [index, warns] of eventWarnings) {
        for (const warn of warns) {
          warnings.push({
            ...warn,
            field: `events[${index}].${warn.field}`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.toolRidCache.clear();
    this.cacheExpiry = 0;
  }

  // ===========================================================================
  // Private Methods - Field Validators
  // ===========================================================================

  /**
   * 验证 toolRid 格式
   */
  private validateToolRid(toolRid: any): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (!toolRid) {
      errors.push({
        field: 'toolRid',
        message: 'toolRid is required',
        code: 'TOOL_RID_REQUIRED',
      });
      return { errors };
    }

    if (typeof toolRid !== 'string') {
      errors.push({
        field: 'toolRid',
        message: 'toolRid must be a string',
        code: 'TOOL_RID_TYPE',
      });
      return { errors };
    }

    if (toolRid.length === 0 || toolRid.length > 256) {
      errors.push({
        field: 'toolRid',
        message: 'toolRid must be between 1 and 256 characters',
        code: 'TOOL_RID_LENGTH',
      });
    }

    // 基本格式验证 (RID 通常包含字母、数字、下划线、连字符)
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(toolRid)) {
      errors.push({
        field: 'toolRid',
        message: 'toolRid contains invalid characters',
        code: 'TOOL_RID_FORMAT',
      });
    }

    return { errors };
  }

  /**
   * 验证工具是否存在
   */
  private async validateToolExists(
    toolRid: string
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 检查缓存
    if (this.toolRidCache.has(toolRid)) {
      return { errors, warnings };
    }

    // 检查缓存是否过期
    if (Date.now() > this.cacheExpiry) {
      this.toolRidCache.clear();
    }

    // 查询数据库
    try {
      const tool = await this.prisma.objects.findFirst({
        where: {
          rid: toolRid,
          objectTypeId: 'aigc_tool',
        },
        select: { rid: true },
      });

      if (!tool) {
        // 不阻止事件记录,只发出警告
        warnings.push({
          field: 'toolRid',
          message: `Tool with rid "${toolRid}" not found in database`,
          code: 'TOOL_NOT_FOUND',
        });
      } else {
        // 添加到缓存
        this.toolRidCache.add(toolRid);
      }
    } catch (error) {
      // 数据库错误不阻止事件记录
      warnings.push({
        field: 'toolRid',
        message: 'Unable to verify tool existence due to database error',
        code: 'TOOL_VERIFY_ERROR',
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证事件类型
   */
  private validateEventType(
    eventType: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!eventType) {
      errors.push({
        field: 'eventType',
        message: 'eventType is required',
        code: 'EVENT_TYPE_REQUIRED',
      });
      return { errors, warnings };
    }

    if (typeof eventType !== 'string') {
      errors.push({
        field: 'eventType',
        message: 'eventType must be a string',
        code: 'EVENT_TYPE_TYPE',
      });
      return { errors, warnings };
    }

    const normalizedType = eventType.toLowerCase();

    if (!VALID_EVENT_TYPES.includes(normalizedType as EventType)) {
      errors.push({
        field: 'eventType',
        message: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        code: 'EVENT_TYPE_INVALID',
      });
    }

    // 检查大小写
    if (eventType !== normalizedType) {
      warnings.push({
        field: 'eventType',
        message: 'eventType will be normalized to lowercase',
        code: 'EVENT_TYPE_CASE',
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证 userId
   */
  private validateUserId(userId: any): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (typeof userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'userId must be a string',
        code: 'USER_ID_TYPE',
      });
      return { errors };
    }

    if (userId.length === 0 || userId.length > 256) {
      errors.push({
        field: 'userId',
        message: 'userId must be between 1 and 256 characters',
        code: 'USER_ID_LENGTH',
      });
    }

    return { errors };
  }

  /**
   * 验证 sessionId
   */
  private validateSessionId(sessionId: any): { errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (typeof sessionId !== 'string') {
      errors.push({
        field: 'sessionId',
        message: 'sessionId must be a string',
        code: 'SESSION_ID_TYPE',
      });
      return { errors };
    }

    if (sessionId.length === 0 || sessionId.length > 256) {
      errors.push({
        field: 'sessionId',
        message: 'sessionId must be between 1 and 256 characters',
        code: 'SESSION_ID_LENGTH',
      });
    }

    return { errors };
  }

  /**
   * 验证 metadata
   */
  private validateMetadata(
    metadata: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      errors.push({
        field: 'metadata',
        message: 'metadata must be a plain object',
        code: 'METADATA_TYPE',
      });
      return { errors, warnings };
    }

    // 检查大小
    try {
      const serialized = JSON.stringify(metadata);
      if (serialized.length > METADATA_MAX_SIZE) {
        errors.push({
          field: 'metadata',
          message: `metadata size exceeds limit of ${METADATA_MAX_SIZE} bytes`,
          code: 'METADATA_SIZE',
        });
      }
    } catch {
      errors.push({
        field: 'metadata',
        message: 'metadata contains non-serializable values',
        code: 'METADATA_SERIALIZE',
      });
    }

    // 检查深度
    const depth = this.getObjectDepth(metadata);
    if (depth > METADATA_MAX_DEPTH) {
      warnings.push({
        field: 'metadata',
        message: `metadata depth exceeds recommended limit of ${METADATA_MAX_DEPTH}`,
        code: 'METADATA_DEPTH',
      });
    }

    return { errors, warnings };
  }

  /**
   * 验证 timestamp
   */
  private validateTimestamp(
    timestamp: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (typeof timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: 'timestamp must be an ISO 8601 string',
        code: 'TIMESTAMP_TYPE',
      });
      return { errors, warnings };
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      errors.push({
        field: 'timestamp',
        message: 'timestamp is not a valid date',
        code: 'TIMESTAMP_INVALID',
      });
      return { errors, warnings };
    }

    // 检查是否在未来
    if (date.getTime() > Date.now()) {
      warnings.push({
        field: 'timestamp',
        message: 'timestamp is in the future, will be ignored',
        code: 'TIMESTAMP_FUTURE',
      });
    }

    // 检查是否太久以前 (超过 30 天)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (date.getTime() < thirtyDaysAgo) {
      warnings.push({
        field: 'timestamp',
        message: 'timestamp is more than 30 days old, will be ignored',
        code: 'TIMESTAMP_OLD',
      });
    }

    return { errors, warnings };
  }

  // ===========================================================================
  // Private Methods - Utilities
  // ===========================================================================

  /**
   * 获取对象深度
   */
  private getObjectDepth(obj: any, depth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return depth;
    }

    let maxDepth = depth;
    for (const value of Object.values(obj)) {
      const d = this.getObjectDepth(value, depth + 1);
      maxDepth = Math.max(maxDepth, d);
    }

    return maxDepth;
  }

  /**
   * 预取工具 RID 到缓存
   */
  private async prefetchToolRids(toolRids: string[]): Promise<void> {
    if (toolRids.length === 0) return;

    // 检查缓存是否过期
    if (Date.now() > this.cacheExpiry) {
      this.toolRidCache.clear();
    }

    // 过滤已缓存的
    const toFetch = toolRids.filter(rid => !this.toolRidCache.has(rid));
    if (toFetch.length === 0) return;

    try {
      const tools = await this.prisma.objects.findMany({
        where: {
          rid: { in: toFetch },
          objectTypeId: 'aigc_tool',
        },
        select: { rid: true },
      });

      for (const tool of tools) {
        this.toolRidCache.add(tool.rid);
      }

      // 更新缓存过期时间
      this.cacheExpiry = Date.now() + this.cacheTTL;
    } catch (error) {
      // 忽略错误,验证时会处理
    }
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let validatorInstance: EventValidator | null = null;

export function getEventValidator(prisma: PrismaClient): EventValidator {
  if (!validatorInstance) {
    validatorInstance = new EventValidator(prisma);
  }
  return validatorInstance;
}

export default EventValidator;
