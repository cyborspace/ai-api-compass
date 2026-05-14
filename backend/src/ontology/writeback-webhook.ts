/**
 * Writeback Webhook System
 * 
 * 实现 Palantir Foundry 风格的 Writeback Webhook
 * 支持执行前验证、事务性保障和外部系统集成
 */

import type { SideEffect, SubmissionCriterion } from './types';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  timeout?: number;
  enabled: boolean;
}

export interface WebhookPayload {
  eventType: string;
  timestamp: string;
  objectType?: string;
  objectId?: string;
  actionType?: string;
  actionId?: string;
  parameters?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  success: boolean;
  statusCode: number;
  data?: any;
  error?: string;
  duration: number;
}

export interface WebhookTrigger {
  type: 'pre' | 'post' | 'success' | 'error';
  actionTypes?: string[];
  objectTypes?: string[];
  conditions?: WebhookCondition[];
}

export interface WebhookCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
  value: any;
}

export interface WritebackConfig {
  id: string;
  name: string;
  description?: string;
  objectType: string;
  actionType: string;
  preWebhooks?: WebhookConfig[];
  postWebhooks?: WebhookConfig[];
  successWebhooks?: WebhookConfig[];
  errorWebhooks?: WebhookConfig[];
  transactionEnabled: boolean;
  rollbackOnError: boolean;
  executionOrder: 'sequential' | 'parallel';
  enabled: boolean;
}

export interface WebhookExecutionResult {
  webhookId: string;
  success: boolean;
  statusCode: number;
  duration: number;
  response?: any;
  error?: string;
  retries: number;
}

export interface WritebackResult {
  success: boolean;
  transactionId: string;
  results: WebhookExecutionResult[];
  totalDuration: number;
  rollbackPerformed: boolean;
  error?: string;
}

/**
 * Webhook Registry
 * 
 * 管理所有 Webhook 配置
 */
export class WebhookRegistry {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private writebackConfigs: Map<string, WritebackConfig> = new Map();

  constructor() {
    this.registerDefaultWebhooks();
  }

  /**
   * Register a webhook
   */
  registerWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.id, config);
  }

  /**
   * Get a webhook
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Get all webhooks
   */
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Register a writeback configuration
   */
  registerWriteback(config: WritebackConfig): void {
    this.writebackConfigs.set(config.id, config);
  }

  /**
   * Get writeback config by object and action type
   */
  getWritebackConfig(objectType: string, actionType: string): WritebackConfig | undefined {
    for (const config of this.writebackConfigs.values()) {
      if (config.objectType === objectType && config.actionType === actionType) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Get all writeback configs
   */
  getAllWritebackConfigs(): WritebackConfig[] {
    return Array.from(this.writebackConfigs.values());
  }

  /**
   * Check if webhook should trigger
   */
  shouldTrigger(trigger: WebhookTrigger, context: {
    actionType?: string;
    objectType?: string;
    parameters?: Record<string, any>;
  }): boolean {
    if (trigger.actionTypes && !trigger.actionTypes.includes(context.actionType || '')) {
      return false;
    }
    if (trigger.objectTypes && !trigger.objectTypes.includes(context.objectType || '')) {
      return false;
    }
    if (trigger.conditions) {
      for (const condition of trigger.conditions) {
        const value = this.getNestedValue(context.parameters, condition.field);
        if (!this.evaluateCondition(value, condition.operator, condition.value)) {
          return false;
        }
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return value === expected;
      case 'ne': return value !== expected;
      case 'gt': return Number(value) > Number(expected);
      case 'lt': return Number(value) < Number(expected);
      case 'contains': return String(value).includes(String(expected));
      default: return true;
    }
  }

  /**
   * Register default webhooks
   */
  private registerDefaultWebhooks(): void {
    this.registerWebhook({
      id: 'webhook-slack-notify',
      name: 'Slack Notification',
      url: process.env.SLACK_WEBHOOK_URL || '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
      timeout: 10000,
      enabled: !!process.env.SLACK_WEBHOOK_URL
    });

    this.registerWebhook({
      id: 'webhook-email-alert',
      name: 'Email Alert',
      url: process.env.EMAIL_WEBHOOK_URL || '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      retryConfig: { maxRetries: 2, retryDelay: 2000, backoffMultiplier: 2 },
      timeout: 15000,
      enabled: !!process.env.EMAIL_WEBHOOK_URL
    });

    this.registerWebhook({
      id: 'webhook-analytics',
      name: 'Analytics Event',
      url: process.env.ANALYTICS_WEBHOOK_URL || '',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      retryConfig: { maxRetries: 1, retryDelay: 500, backoffMultiplier: 1 },
      timeout: 5000,
      enabled: !!process.env.ANALYTICS_WEBHOOK_URL
    });

    this.registerWriteback({
      id: 'writeback-tool-review',
      name: 'Tool Review Writeback',
      description: 'Handle tool review submissions',
      objectType: 'AIGCTool',
      actionType: 'submitReview',
      preWebhooks: [
        {
          id: 'validate-review-content',
          name: 'Validate Review Content',
          url: process.env.VALIDATION_WEBHOOK_URL || 'http://localhost:8000/internal/validate',
          method: 'POST',
          enabled: true
        }
      ],
      postWebhooks: [
        {
          id: 'notify-slack-review',
          name: 'Notify Slack on Review',
          url: process.env.SLACK_WEBHOOK_URL || '',
          method: 'POST',
          enabled: true
        }
      ],
      successWebhooks: [
        {
          id: 'send-analytics-event',
          name: 'Analytics Event',
          url: process.env.ANALYTICS_WEBHOOK_URL || '',
          method: 'POST',
          enabled: true
        }
      ],
      errorWebhooks: [
        {
          id: 'alert-admin-error',
          name: 'Alert Admin',
          url: process.env.ADMIN_ALERT_WEBHOOK_URL || '',
          method: 'POST',
          enabled: true
        }
      ],
      transactionEnabled: true,
      rollbackOnError: true,
      executionOrder: 'sequential',
      enabled: true
    });
  }
}

/**
 * Webhook Executor
 * 
 * 执行 Webhook 请求
 */
export class WebhookExecutor {
  private registry: WebhookRegistry;

  constructor(registry: WebhookRegistry) {
    this.registry = registry;
  }

  /**
   * Execute a webhook
   */
  async execute(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookResponse> {
    if (!webhook.enabled || !webhook.url) {
      return { success: true, statusCode: 0, duration: 0 };
    }

    const startTime = Date.now();
    const maxRetries = webhook.retryConfig?.maxRetries || 0;
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        const response = await this.makeRequest(webhook, payload);
        const duration = Date.now() - startTime;

        return {
          success: response.ok,
          statusCode: response.status,
          data: await response.json().catch(() => ({})),
          duration,
        };
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          return {
            success: false,
            statusCode: 0,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime,
          };
        }

        const delay = (webhook.retryConfig?.retryDelay || 1000) *
          Math.pow(webhook.retryConfig?.backoffMultiplier || 2, retries - 1);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      statusCode: 0,
      error: 'Max retries exceeded',
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute webhooks based on trigger type
   */
  async executeWebhooks(
    webhooks: WebhookConfig[],
    payload: WebhookPayload
  ): Promise<WebhookExecutionResult[]> {
    const results: WebhookExecutionResult[] = [];

    for (const webhook of webhooks) {
      const result = await this.execute(webhook, payload);
      results.push({
        webhookId: webhook.id,
        success: result.success,
        statusCode: result.statusCode,
        duration: result.duration,
        response: result.data,
        error: result.error,
        retries: 0,
      });
    }

    return results;
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = webhook.timeout || 30000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Writeback Engine
 * 
 * 完整的 Writeback 执行引擎
 */
export class WritebackEngine {
  private registry: WebhookRegistry;
  private executor: WebhookExecutor;

  constructor() {
    this.registry = new WebhookRegistry();
    this.executor = new WebhookExecutor(this.registry);
  }

  /**
   * Execute writeback with transaction support
   */
  async executeWriteback(
    objectType: string,
    actionType: string,
    parameters: Record<string, any>,
    context: {
      userId?: string;
      sessionId?: string;
      transactionId?: string;
    },
    handlers: {
      pre?: () => Promise<any>;
      execute: () => Promise<any>;
      post?: () => Promise<any>;
      rollback?: () => Promise<void>;
    }
  ): Promise<WritebackResult> {
    const transactionId = context.transactionId || `wb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const results: WebhookExecutionResult[] = [];
    let rollbackPerformed = false;

    const config = this.registry.getWritebackConfig(objectType, actionType);
    if (!config || !config.enabled) {
      return {
        success: true,
        transactionId,
        results: [],
        totalDuration: Date.now() - startTime,
        rollbackPerformed: false,
      };
    }

    const payload: WebhookPayload = {
      eventType: 'writeback_start',
      timestamp: new Date().toISOString(),
      objectType,
      actionType,
      parameters,
      userId: context.userId,
      sessionId: context.sessionId,
      metadata: { transactionId },
    };

    if (config.preWebhooks && config.preWebhooks.length > 0) {
      payload.eventType = 'pre_webhook';
      const preResults = await this.executor.executeWebhooks(config.preWebhooks, payload);
      results.push(...preResults);

      if (config.rollbackOnError && preResults.some((r) => !r.success)) {
        return {
          success: false,
          transactionId,
          results,
          totalDuration: Date.now() - startTime,
          rollbackPerformed: false,
          error: 'Pre-webhook failed',
        };
      }
    }

    try {
      if (handlers.pre) {
        await handlers.pre();
      }

      payload.eventType = 'execute';
      await handlers.execute();

      payload.eventType = 'post_webhook';
      if (handlers.post) {
        const postResult = await handlers.post();
        payload.metadata = { ...payload.metadata, result: postResult };
      }

      if (config.postWebhooks && config.postWebhooks.length > 0) {
        const postResults = await this.executor.executeWebhooks(config.postWebhooks, payload);
        results.push(...postResults);
      }

      if (config.successWebhooks && config.successWebhooks.length > 0) {
        payload.eventType = 'success';
        const successResults = await this.executor.executeWebhooks(config.successWebhooks, payload);
        results.push(...successResults);
      }

      return {
        success: true,
        transactionId,
        results,
        totalDuration: Date.now() - startTime,
        rollbackPerformed,
      };
    } catch (error) {
      payload.eventType = 'error';
      payload.metadata = {
        ...payload.metadata,
        error: error instanceof Error ? error.message : String(error),
      };

      if (config.errorWebhooks && config.errorWebhooks.length > 0) {
        const errorResults = await this.executor.executeWebhooks(config.errorWebhooks, payload);
        results.push(...errorResults);
      }

      if (config.rollbackOnError && handlers.rollback) {
        try {
          await handlers.rollback();
          rollbackPerformed = true;
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      return {
        success: false,
        transactionId,
        results,
        totalDuration: Date.now() - startTime,
        rollbackPerformed,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get webhook registry
   */
  getRegistry(): WebhookRegistry {
    return this.registry;
  }
}

/**
 * Global webhook registry and executor
 */
export const webhookRegistry = new WebhookRegistry();
export const webhookExecutor = new WebhookExecutor(webhookRegistry);
export const writebackEngine = new WritebackEngine();
