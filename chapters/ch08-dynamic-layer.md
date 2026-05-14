# 第 8 章：动作引擎驱万象，提交回写显神通

> **核心问题**：如何让数据"活起来"并驱动业务操作？
> **本章简介**：本章深入 Ontology 的动态层实现。从 Action Type 的设计到 13 种 Logic Rules 的详解，从提交条件引擎到 Writeback 机制，再到 Function 执行引擎——读者将掌握让数据从"被看"到"被用"的完整技术体系。这是 Ontology 最具创新性的部分，也是 FDE 为客户创造业务价值的核心手段。

---

## 8.1 Action Type 设计

### 8.1.1 Action Type 的结构：参数、规则、副作用、提交条件

Action Type 是 Ontology 的"动词"，它定义了可以对对象执行的操作。一个完整的 Action Type 包含四个核心部分：

```typescript
// backend/src/ontology/aigc-schema/action-types/aigc-action-types.ts
export const submitReviewActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.submit-review',
  apiName: 'submitReview',
  displayName: '提交评价',
  description: '提交用户对工具的评价',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  // 1. 参数：定义操作所需的输入
  parameters: [
    {
      apiName: 'toolSlug',
      displayName: '工具',
      description: '要评价的工具',
      dataType: { type: 'objectSet' },
      required: true,
    },
    {
      apiName: 'overallRating',
      displayName: '总体评分',
      description: '1-5分',
      dataType: { type: 'integer' },
      required: true,
    },
    {
      apiName: 'title',
      displayName: '评价标题',
      dataType: { type: 'string' },
      required: true,
    },
    {
      apiName: 'content',
      displayName: '评价内容',
      dataType: { type: 'string' },
      required: true,
    },
    {
      apiName: 'pros',
      displayName: '优点',
      dataType: { type: 'list' },
      required: false,
    },
    {
      apiName: 'cons',
      displayName: '缺点',
      dataType: { type: 'list' },
      required: false,
    },
  ],
  
  // 2. 操作：定义执行的具体逻辑
  operations: [
    {
      createObject: {
        objectTypeApiName: 'UserReview'
      }
    }
  ],
  
  // 3. 提交条件：定义执行前的验证规则
  submissionCriteria: [
    {
      type: 'parameterCondition',
      parameterId: 'overallRating',
      propertyPath: 'rating',
      operator: 'greaterThan',
      value: 0,
      failureMessage: '请提供有效评分'
    }
  ],
  
  // 4. 副作用：定义操作成功后的附加行为
  sideEffects: [
    {
      type: 'actionLog',
      enabled: true
    }
  ]
};
```

### 8.1.2 Action 的生命周期：定义 → 配置 → 执行 → 审计

Action 的完整生命周期包括四个阶段：

```
定义（Definition）
  → 配置（Configuration）
  → 执行（Execution）
  → 审计（Audit）
```

**定义阶段**：在 Ontology 中声明 Action Type

```typescript
// 定义 Action Type
export const compareToolsActionType: ActionTypeV2 = {
  rid: 'ri.aigc.main.action-type.compare-tools',
  apiName: 'compareTools',
  displayName: '对比工具',
  description: '创建工具对比会话',
  status: 'ACTIVE',
  objectTypeApiName: 'AIGCTool',
  
  parameters: [
    {
      apiName: 'toolSlugs',
      displayName: '工具列表',
      description: '要对比的工具列表',
      dataType: { type: 'list' },
      required: true,
    },
    {
      apiName: 'dimension',
      displayName: '对比维度',
      dataType: { type: 'string' },
      required: false,
      defaultValue: 'all',
    },
  ],
  
  operations: [
    {
      createObject: {
        objectTypeApiName: 'CompareSession'
      }
    }
  ],
  
  sideEffects: [
    {
      type: 'actionLog',
      enabled: true
    }
  ]
};
```

**配置阶段**：在应用中配置 Action 的触发条件

```typescript
// 配置 Action 触发器
const actionTriggers = [
  {
    actionType: 'compareTools',
    trigger: 'userClick',
    condition: {
      field: 'selectedTools',
      operator: 'gte',
      value: 2
    }
  },
  {
    actionType: 'submitReview',
    trigger: 'formSubmit',
    condition: {
      field: 'formValid',
      operator: 'eq',
      value: true
    }
  }
];
```

**执行阶段**：用户触发 Action，系统执行

```typescript
// 执行 Action
const result = await actionExecutor.executeAction(
  submitReviewActionType,
  {
    parameters: {
      toolSlug: 'chatgpt',
      overallRating: 5,
      title: '非常好用',
      content: 'ChatGPT 极大地提升了我的工作效率...',
      pros: ['响应速度快', '理解能力强'],
      cons: ['偶尔出现幻觉']
    }
  },
  {
    userId: 'user-123',
    sessionId: 'session-456',
    ipAddress: '192.168.1.1'
  }
);
```

**审计阶段**：记录 Action 的执行历史

```typescript
// Action 审计记录
interface ActionAuditRecord {
  actionId: string;
  actionType: string;
  userId: string;
  timestamp: Date;
  parameters: Record<string, any>;
  result: 'success' | 'failure';
  executionTime: number;
  error?: string;
}
```

### 8.1.3 Action 的权限控制

Action 的权限控制通过 `submissionCriteria` 中的用户上下文条件实现：

```typescript
submissionCriteria: [
  {
    type: 'userContext',
    operator: 'isAuthenticated',
    errorMessage: '请先登录'
  },
  {
    type: 'userContext',
    operator: 'hasRole',
    value: 'user',
    errorMessage: '需要用户权限'
  },
  {
    type: 'userContext',
    operator: 'inGroup',
    value: 'beta-testers',
    errorMessage: '需要 Beta 测试权限'
  }
]
```

### 8.1.4 Action 的版本管理

Action Type 支持版本管理，确保向后兼容：

```typescript
// Action Type 版本管理
interface ActionTypeVersion {
  version: string;
  status: 'draft' | 'active' | 'deprecated';
  changes: string[];
  deprecatedParameters?: string[];
  newParameters?: ParameterDefinition[];
}

const submitReviewV2: ActionTypeV2 = {
  ...submitReviewActionType,
  version: '2.0',
  changes: [
    '新增 pros/cons 参数',
    'rating 改为 overallRating'
  ],
  deprecatedParameters: ['rating'],
  newParameters: [
    {
      apiName: 'pros',
      displayName: '优点',
      dataType: { type: 'list' },
      required: false
    },
    {
      apiName: 'cons',
      displayName: '缺点',
      dataType: { type: 'list' },
      required: false
    }
  ]
};
```

🎯 **实践环节**：分析 AI-API-COMPASS 的 Action Type 定义

---

## 8.2 Action 执行引擎

### 8.2.1 13 种 Logic Rules 详解

Action 执行引擎支持 13 种 Logic Rules，每种规则对应一种业务操作：

| 规则 | 说明 | 示例 |
|------|------|------|
| `create` | 创建新对象 | 创建 UserReview |
| `update` | 更新对象属性 | 更新工具评分 |
| `delete` | 删除对象 | 删除过期评价 |
| `link` | 创建对象关系 | 关联工具和分类 |
| `unlink` | 解除对象关系 | 移除工具标签 |
| `function` | 执行计算函数 | 计算排名 |
| `condition` | 条件分支 | 根据评分决定是否展示 |
| `loop` | 循环执行 | 批量更新工具 |
| `parallel` | 并行执行 | 同时计算多个指标 |
| `transform` | 数据转换 | 转换数据格式 |
| `validate` | 数据验证 | 验证评分范围 |
| `notify` | 发送通知 | 通知用户评价已审核 |
| `webhook` | 外部回调 | 调用外部 API |

```typescript
// backend/src/ontology/action-executor.ts
export class ActionExecutor {
  async executeAction(
    actionType: ActionTypeV2,
    parameters: ActionParameters,
    context: ActionExecutionContext = {}
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. 创建 Action 记录
    const actionRecord = await this.prisma.actions.create({
      data: {
        id: actionId,
        actionTypeId: actionType.rid || actionType.apiName,
        objectId: parameters.objectId,
        parameters: parameters.parameters,
        status: 'pending',
        submittedAt: new Date(),
        submittedBy: context.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      // 2. 验证提交条件
      if (actionType.submissionCriteria && actionType.submissionCriteria.length > 0) {
        const criteriaResult = this.criteriaEngine.evaluate(
          actionType.submissionCriteria as any,
          parameters.parameters,
          {
            userId: context.userId,
            userRole: context.userRole,
            userGroups: context.userGroups,
            timestamp: context.timestamp || new Date(),
            requestId: context.requestId,
            metadata: context.metadata,
          }
        );

        if (!criteriaResult.passed) {
          const error = criteriaResult.errors[0];
          await this.prisma.actions.update({
            where: { id: actionId },
            data: {
              status: 'failed',
              error: error?.code || 'VALIDATION_FAILED',
              errorDetails: JSON.stringify(criteriaResult.errors),
              completedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          return {
            success: false,
            actionId,
            transactionId,
            status: 'failed',
            error: {
              code: error?.code || 'VALIDATION_FAILED',
              message: error?.message || 'Validation failed',
              details: criteriaResult.errors,
            },
            executionTime: Date.now() - startTime,
          };
        }
      }

      // 3. 执行 Action
      await this.prisma.actions.update({
        where: { id: actionId },
        data: {
          status: 'in_progress',
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const objectType = parameters.objectType || 'AIGCTool';
      const writebackResult = await writebackEngine.executeWriteback(
        objectType,
        actionType.apiName,
        parameters.parameters,
        {
          userId: context.userId,
          sessionId: context.sessionId,
          transactionId,
        },
        {
          pre: async () => {
            return { validated: true };
          },
          execute: async () => {
            const result = await this.performAction(
              actionType,
              parameters,
              context
            );
            return result;
          },
          post: async () => {
            return { completed: true };
          },
          rollback: async () => {
            await this.rollbackAction(actionType, actionId, parameters);
          },
        }
      );

      // 4. 更新状态
      if (writebackResult.success) {
        await this.prisma.actions.update({
          where: { id: actionId },
          data: {
            status: 'completed',
            result: JSON.stringify(writebackResult.results),
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          actionId,
          transactionId: writebackResult.transactionId,
          status: 'completed',
          result: writebackResult.results,
          executionTime: Date.now() - startTime,
          webhookResults: writebackResult.results,
        };
      } else {
        await this.prisma.actions.update({
          where: { id: actionId },
          data: {
            status: writebackResult.rollbackPerformed ? 'rolled_back' : 'failed',
            error: writebackResult.error,
            errorDetails: JSON.stringify(writebackResult.results),
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return {
          success: false,
          actionId,
          transactionId: writebackResult.transactionId,
          status: writebackResult.rollbackPerformed ? 'rolled_back' : 'failed',
          error: {
            code: 'EXECUTION_FAILED',
            message: writebackResult.error || 'Action execution failed',
            details: writebackResult.results,
          },
          executionTime: Date.now() - startTime,
          webhookResults: writebackResult.results,
        };
      }
    } catch (error) {
      await this.prisma.actions.update({
        where: { id: actionId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: false,
        actionId,
        transactionId,
        status: 'failed',
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        executionTime: Date.now() - startTime,
      };
    }
  }
}
```

### 8.2.2 表达式求值器（Expression Evaluator）

表达式求值器支持在 Action 中动态计算值：

```typescript
// 表达式求值器
export class ExpressionEvaluator {
  evaluate(expression: string, context: Record<string, any>): any {
    // 支持简单的表达式
    // 例如: "${tool.rating} * 2"
    // 例如: "${user.name} + ' reviewed ' + ${tool.name}"
    
    const interpolated = expression.replace(/\$\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
    
    // 安全求值
    return this.safeEvaluate(interpolated);
  }
  
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }
  
  private safeEvaluate(expression: string): any {
    // 使用安全的求值方式，避免代码注入
    // 仅支持基本运算符: +, -, *, /, %, ==, !=, <, >, <=, >=, &&, ||, !
    const sanitized = expression.replace(/[^\w\s+\-*/%==!<>&|.'"()[\],]/g, '');
    
    try {
      // 使用 Function 构造器进行安全求值
      const fn = new Function('return ' + sanitized);
      return fn();
    } catch {
      return expression;
    }
  }
}
```

### 8.2.3 副作用处理（Side Effects）

副作用是 Action 执行后的附加行为：

```typescript
// 副作用类型
interface SideEffect {
  type: 'actionLog' | 'notification' | 'webhook' | 'cacheInvalidate' | 'eventEmit';
  enabled: boolean;
  config?: Record<string, any>;
}

// 副作用处理器
export class SideEffectHandler {
  async handle(sideEffects: SideEffect[], actionResult: ActionExecutionResult) {
    for (const effect of sideEffects) {
      if (!effect.enabled) continue;
      
      switch (effect.type) {
        case 'actionLog':
          await this.logAction(actionResult);
          break;
        case 'notification':
          await this.sendNotification(actionResult, effect.config);
          break;
        case 'webhook':
          await this.callWebhook(actionResult, effect.config);
          break;
        case 'cacheInvalidate':
          await this.invalidateCache(actionResult, effect.config);
          break;
        case 'eventEmit':
          await this.emitEvent(actionResult, effect.config);
          break;
      }
    }
  }
  
  private async logAction(result: ActionExecutionResult) {
    await prisma.action_logs.create({
      data: {
        actionId: result.actionId,
        transactionId: result.transactionId,
        status: result.status,
        result: JSON.stringify(result.result),
        error: result.error ? JSON.stringify(result.error) : null,
        executionTime: result.executionTime,
        createdAt: new Date(),
      }
    });
  }
  
  private async sendNotification(result: ActionExecutionResult, config?: any) {
    // 发送通知（邮件、短信、推送等）
  }
  
  private async callWebhook(result: ActionExecutionResult, config?: any) {
    // 调用外部 Webhook
  }
  
  private async invalidateCache(result: ActionExecutionResult, config?: any) {
    // 清除缓存
  }
  
  private async emitEvent(result: ActionExecutionResult, config?: any) {
    // 发送事件到消息队列
  }
}
```

🎯 **实践环节**：在 AI-API-COMPASS 中实现一个新的 Action

---

## 8.3 提交条件引擎（Submission Criteria Engine）

### 8.3.1 什么是提交条件：Action 执行前的最后一道防线

提交条件（Submission Criteria）是 Action 执行前的验证规则，确保输入数据满足业务要求。

```typescript
// backend/src/ontology/submission-criteria-engine.ts
export class SubmissionCriteriaEngine {
  evaluate(
    criteria: CriterionDefinition[],
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext = {}
  ): CriteriaEvaluationResult {
    const startTime = Date.now();
    const errors: CriteriaError[] = [];

    for (const criterion of criteria) {
      const result = this.evaluateCriterion(criterion, inputData, context);
      if (!result.passed && result.error) {
        errors.push(result.error);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      evaluatedAt: new Date(),
      executionTime: Date.now() - startTime,
    };
  }
}
```

### 8.3.2 条件类型：字段验证、状态检查、权限验证

**字段验证**：

```typescript
// 字段必填
{
  type: 'field required',
  field: 'overallRating',
  errorMessage: '评分不能为空'
}

// 字段类型
{
  type: 'field type',
  field: 'overallRating',
  valueType: 'integer',
  errorMessage: '评分必须是整数'
}

// 字段范围
{
  type: 'field range',
  field: 'overallRating',
  value: { min: 1, max: 5 },
  errorMessage: '评分必须在 1-5 之间'
}

// 字段长度
{
  type: 'field length',
  field: 'title',
  operator: 'lte',
  value: 100,
  errorMessage: '标题不能超过 100 字'
}

// 字段模式
{
  type: 'field pattern',
  field: 'email',
  value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
  errorMessage: '邮箱格式不正确'
}
```

**状态检查**：

```typescript
// 字段比较
{
  type: 'field comparison',
  field: 'status',
  operator: 'eq',
  value: 'active',
  errorMessage: '工具必须处于活跃状态'
}
```

**权限验证**：

```typescript
// 用户角色
{
  type: 'user context',
  operator: 'hasRole',
  value: 'admin',
  errorMessage: '需要管理员权限'
}

// 用户组
{
  type: 'user context',
  operator: 'inGroup',
  value: 'beta-testers',
  errorMessage: '需要 Beta 测试权限'
}

// 认证状态
{
  type: 'user context',
  operator: 'isAuthenticated',
  errorMessage: '请先登录'
}
```

### 8.3.3 条件组合：AND / OR / NOT 逻辑

```typescript
// AND 组合
{
  type: 'AND',
  conditions: [
    {
      type: 'field required',
      field: 'overallRating',
      errorMessage: '评分不能为空'
    },
    {
      type: 'field range',
      field: 'overallRating',
      value: { min: 1, max: 5 },
      errorMessage: '评分必须在 1-5 之间'
    }
  ]
}

// OR 组合
{
  type: 'OR',
  conditions: [
    {
      type: 'user context',
      operator: 'hasRole',
      value: 'admin',
      errorMessage: '需要管理员权限'
    },
    {
      type: 'user context',
      operator: 'hasRole',
      value: 'moderator',
      errorMessage: '需要版主权限'
    }
  ]
}

// NOT 组合
{
  type: 'NOT',
  nested: {
    type: 'field comparison',
    field: 'status',
    operator: 'eq',
    value: 'banned',
    errorMessage: '用户已被封禁'
  }
}
```

🎯 **实践环节**：为 AI-API-COMPASS 的评分 Action 添加提交条件

```typescript
// 练习：为 submitReview 添加完整的提交条件
export const submitReviewActionType: ActionTypeV2 = {
  ...submitReviewActionType,
  submissionCriteria: [
    // 1. 用户必须登录
    {
      type: 'user context',
      operator: 'isAuthenticated',
      errorMessage: '请先登录后再提交评价'
    },
    
    // 2. 评分必须存在且在 1-5 之间
    {
      type: 'AND',
      conditions: [
        {
          type: 'field required',
          field: 'overallRating',
          errorMessage: '请提供评分'
        },
        {
          type: 'field type',
          field: 'overallRating',
          valueType: 'integer',
          errorMessage: '评分必须是整数'
        },
        {
          type: 'field range',
          field: 'overallRating',
          value: { min: 1, max: 5 },
          errorMessage: '评分必须在 1-5 之间'
        }
      ]
    },
    
    // 3. 标题和内容不能为空
    {
      type: 'AND',
      conditions: [
        {
          type: 'field required',
          field: 'title',
          errorMessage: '请填写评价标题'
        },
        {
          type: 'field required',
          field: 'content',
          errorMessage: '请填写评价内容'
        }
      ]
    },
    
    // 4. 标题长度限制
    {
      type: 'field length',
      field: 'title',
      operator: 'lte',
      value: 100,
      errorMessage: '标题不能超过 100 字'
    },
    
    // 5. 内容长度限制
    {
      type: 'field length',
      field: 'content',
      operator: 'gte',
      value: 10,
      errorMessage: '评价内容不能少于 10 字'
    },
    
    // 6. 用户不能评价自己的工具（如果是提供商）
    {
      type: 'NOT',
      nested: {
        type: 'field comparison',
        field: 'isToolOwner',
        operator: 'eq',
        value: true,
        errorMessage: '不能评价自己的工具'
      }
    }
  ]
};
```

---

## 8.4 Writeback 机制

### 8.4.1 什么是 Writeback：从 Ontology 回写到数据源

Writeback 是 Ontology 的重要特性，它允许将 Ontology 中的变更同步回外部系统。

```
外部系统 → [同步] → Ontology → [处理] → 外部系统
                ↑              ↓
                └─ Writeback ─┘
```

### 8.4.2 Writeback 的技术实现：Webhook 模式

AI-API-COMPASS 使用 Webhook 模式实现 Writeback：

```typescript
// backend/src/ontology/writeback-webhook.ts
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
```

### 8.4.3 Writeback 的事务与幂等性

Writeback 支持事务和幂等性：

```typescript
export class WritebackEngine {
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

    // 执行前置 Webhook
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
      // 执行前置处理
      if (handlers.pre) {
        await handlers.pre();
      }

      // 执行主逻辑
      payload.eventType = 'execute';
      await handlers.execute();

      // 执行后置处理
      payload.eventType = 'post_webhook';
      if (handlers.post) {
        const postResult = await handlers.post();
        payload.metadata = { ...payload.metadata, result: postResult };
      }

      // 执行后置 Webhook
      if (config.postWebhooks && config.postWebhooks.length > 0) {
        const postResults = await this.executor.executeWebhooks(config.postWebhooks, payload);
        results.push(...postResults);
      }

      // 执行成功 Webhook
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
      // 执行错误 Webhook
      payload.eventType = 'error';
      payload.metadata = {
        ...payload.metadata,
        error: error instanceof Error ? error.message : String(error),
      };

      if (config.errorWebhooks && config.errorWebhooks.length > 0) {
        const errorResults = await this.executor.executeWebhooks(config.errorWebhooks, payload);
        results.push(...errorResults);
      }

      // 执行回滚
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
}
```

### 8.4.4 Writeback 的安全考量

Writeback 涉及外部系统调用，需要考虑安全性：

1. **认证**：Webhook 调用需要认证
2. **加密**：敏感数据需要加密传输
3. **限流**：防止 Webhook 被滥用
4. **超时**：设置合理的超时时间
5. **重试**：失败时重试，但避免无限重试

```typescript
// Webhook 安全配置
const secureWebhookConfig: WebhookConfig = {
  id: 'secure-webhook',
  name: 'Secure Webhook',
  url: 'https://api.example.com/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.WEBHOOK_TOKEN,
    'X-Request-ID': generateRequestId(),
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  timeout: 30000,
  enabled: true,
};
```

🎯 **实践环节**：分析 AI-API-COMPASS 的 writeback-webhook 实现

---

## 8.5 Function 执行引擎

### 8.5.1 Function 的注册与发现

Function 需要注册到 Ontology 中才能被调用：

```typescript
// Function 注册
export class FunctionRegistry {
  private functions: Map<string, FunctionDefinition> = new Map();

  registerFunction(definition: FunctionDefinition): void {
    this.functions.set(definition.apiName, definition);
  }

  getFunction(apiName: string): FunctionDefinition | undefined {
    return this.functions.get(apiName);
  }

  getAllFunctions(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  getFunctionsByCategory(category: string): FunctionDefinition[] {
    return this.getAllFunctions().filter(f => f.metadata?.category === category);
  }
}

// 注册所有 Function
export const functionRegistry = new FunctionRegistry();

// 注册排名函数
functionRegistry.registerFunction(getCompositeRankingsFunction);
functionRegistry.registerFunction(getPerformanceRankingsFunction);
functionRegistry.registerFunction(getPopularityRankingsFunction);

// 注册热度函数
functionRegistry.registerFunction(calculateHeatScoreFunction);
functionRegistry.registerFunction(getTrendingToolsFunction);

// 注册推荐函数
functionRegistry.registerFunction(getHomeRecommendationsFunction);
functionRegistry.registerFunction(getScenarioRecommendationsFunction);
```

### 8.5.2 Function 的参数解析与类型检查

Function 执行前需要解析和验证参数：

```typescript
export class FunctionExecutor {
  async execute(functionApiName: string, parameters: Record<string, any>) {
    // 1. 获取函数定义
    const funcDef = functionRegistry.getFunction(functionApiName);
    if (!funcDef) {
      throw new Error(`Function not found: ${functionApiName}`);
    }

    // 2. 解析参数
    const parsedParams = this.parseParameters(parameters, funcDef.parameters);

    // 3. 类型检查
    const typeCheckResult = this.typeCheck(parsedParams, funcDef.parameters);
    if (!typeCheckResult.valid) {
      throw new Error(`Type check failed: ${typeCheckResult.errors.join(', ')}`);
    }

    // 4. 执行函数
    return funcDef.handler(parsedParams);
  }

  private parseParameters(
    input: Record<string, any>,
    paramDefs: ParameterDefinition[]
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const paramDef of paramDefs) {
      const value = input[paramDef.apiName];

      if (value === undefined || value === null) {
        if (paramDef.required) {
          throw new Error(`Missing required parameter: ${paramDef.apiName}`);
        }
        result[paramDef.apiName] = paramDef.defaultValue;
      } else {
        result[paramDef.apiName] = value;
      }
    }

    return result;
  }

  private typeCheck(
    params: Record<string, any>,
    paramDefs: ParameterDefinition[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const paramDef of paramDefs) {
      const value = params[paramDef.apiName];
      if (value === undefined || value === null) continue;

      switch (paramDef.dataType.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Parameter ${paramDef.apiName} must be a string`);
          }
          break;
        case 'integer':
          if (!Number.isInteger(value)) {
            errors.push(`Parameter ${paramDef.apiName} must be an integer`);
          }
          break;
        case 'double':
          if (typeof value !== 'number') {
            errors.push(`Parameter ${paramDef.apiName} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter ${paramDef.apiName} must be a boolean`);
          }
          break;
        case 'list':
          if (!Array.isArray(value)) {
            errors.push(`Parameter ${paramDef.apiName} must be a list`);
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

### 8.5.3 Function 的执行与结果缓存

Function 支持结果缓存，提高性能：

```typescript
export class CachedFunctionExecutor extends FunctionExecutor {
  private cache: Map<string, { result: any; expiresAt: number }> = new Map();

  async execute(functionApiName: string, parameters: Record<string, any>) {
    const funcDef = functionRegistry.getFunction(functionApiName);
    if (!funcDef) {
      throw new Error(`Function not found: ${functionApiName}`);
    }

    // 检查缓存
    if (funcDef.metadata?.cacheConfig?.enabled) {
      const cacheKey = this.generateCacheKey(functionApiName, parameters);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result;
      }
    }

    // 执行函数
    const result = await super.execute(functionApiName, parameters);

    // 写入缓存
    if (funcDef.metadata?.cacheConfig?.enabled) {
      const cacheKey = this.generateCacheKey(functionApiName, parameters);
      const ttl = funcDef.metadata.cacheConfig.ttl || 300;
      this.cache.set(cacheKey, {
        result,
        expiresAt: Date.now() + ttl * 1000,
      });
    }

    return result;
  }

  private generateCacheKey(functionApiName: string, parameters: Record<string, any>): string {
    return `${functionApiName}:${JSON.stringify(parameters)}`;
  }
}
```

### 8.5.4 46 个 Function 的分类与实现

AI-API-COMPASS 的 46 个 Function 按业务领域分类：

| 类别 | 数量 | 示例 |
|------|------|------|
| **排名** | 8 | `getCompositeRankings`, `getPerformanceRankings` |
| **热度** | 8 | `calculateHeatScore`, `getTrendingTools` |
| **评分** | 7 | `calculateAverageRating`, `detectRatingAnomaly` |
| **推荐** | 7 | `getHomeRecommendations`, `getScenarioRecommendations` |
| **防作弊** | 6 | `detectGamingBehavior`, `calculateRiskScore` |
| **场景** | 5 | `matchScenario`, `getScenarioTools` |
| **通用** | 5 | `searchTools`, `filterTools` |

🎯 **实践环节**：实现一个新的排名 Function

```typescript
// 练习：实现 getNewArrivals 函数（获取新上架工具）
export const getNewArrivalsFunction: FunctionV2 = {
  rid: 'ri.aigc.main.function.get-new-arrivals',
  apiName: 'getNewArrivals',
  displayName: '新上架',
  description: '获取最近30天内新上架的AI工具',
  
  decorator: 'QueryFunction',
  
  parameters: [
    {
      apiName: 'days',
      displayName: '天数',
      description: '最近多少天内',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 30
    },
    {
      apiName: 'limit',
      displayName: '返回数量',
      dataType: { type: 'integer' },
      required: false,
      defaultValue: 10
    }
  ],
  
  returnType: {
    dataType: { type: 'object' },
    description: '新上架工具列表'
  },
  
  boundObjectTypes: ['AIGCTool'],
  timeoutMs: 10000,
  performsEdits: false,
  
  metadata: {
    category: 'discovery',
    cacheConfig: {
      enabled: true,
      ttl: 3600  // 1小时缓存
    }
  },
  
  handler: async (params) => {
    const days = params.days || 30;
    const limit = params.limit || 10;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const tools = await prisma.objects.findMany({
      where: {
        objectTypeApiName: 'AIGCTool',
        status: 'active',
        createdAt: {
          gte: cutoffDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    return {
      tools: tools.map(t => ({
        rid: t.rid,
        name: (t.properties as any).name,
        slug: (t.properties as any).slug,
        description: (t.properties as any).description,
        createdAt: t.createdAt
      })),
      total: tools.length
    };
  }
};
```

---

## 本章小结

本章深入介绍了 Ontology 动态层的核心组件：

1. **Action Type**：定义业务操作，包含参数、规则、副作用、提交条件
2. **Action 执行引擎**：支持 13 种 Logic Rules，实现完整的执行生命周期
3. **提交条件引擎**：验证输入数据，支持 AND/OR/NOT 组合
4. **Writeback 机制**：将 Ontology 变更同步回外部系统，支持事务和幂等性
5. **Function 执行引擎**：注册、发现、执行 Function，支持结果缓存

通过 AI-API-COMPASS 的真实代码，我们看到了动态层如何让数据"活起来"，驱动业务操作。
