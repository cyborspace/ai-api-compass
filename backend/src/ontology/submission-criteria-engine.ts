/**
 * Submission Criteria Engine
 * 
 * 实现 Palantir Foundry 风格的提交条件验证引擎
 * 支持复杂嵌套条件、逻辑运算符和自定义验证规则
 */

import type { SubmissionCriterion } from './types';

export interface CriteriaEvaluationContext {
  userId?: string;
  userRole?: string;
  userGroups?: string[];
  timestamp?: Date;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface CriteriaEvaluationResult {
  passed: boolean;
  errors: CriteriaError[];
  evaluatedAt: Date;
  executionTime: number;
}

export interface CriteriaError {
  criterion: string;
  field?: string;
  message: string;
  code: string;
}

export interface CriterionDefinition {
  type: string;
  field?: string;
  operator?: string;
  value?: any;
  valueType?: string;
  errorMessage?: string;
  conditions?: CriterionDefinition[];
  nested?: CriterionDefinition;
  and?: CriterionDefinition[];
  or?: CriterionDefinition[];
  not?: CriterionDefinition;
}

/**
 * Submission Criteria Evaluator
 * 
 * 支持的条件类型:
 * - field comparison: 字段比较
 * - value existence: 值存在性检查
 * - user context: 用户上下文验证
 * - time-based: 时间条件
 * - custom: 自定义验证
 */
export class SubmissionCriteriaEngine {
  /**
   * Evaluate submission criteria against input data
   */
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

  /**
   * Evaluate a single criterion
   */
  private evaluateCriterion(
    criterion: CriterionDefinition,
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext
  ): { passed: boolean; error?: CriteriaError } {
    const { type, field, operator, value, errorMessage, conditions, nested, and, or, not } = criterion;

    switch (type) {
      case 'AND':
        if (and && and.length > 0) {
          return this.evaluateAnd(and, inputData, context);
        }
        if (conditions) {
          return this.evaluateAnd(conditions, inputData, context);
        }
        break;

      case 'OR':
        if (or && or.length > 0) {
          return this.evaluateOr(or, inputData, context);
        }
        break;

      case 'NOT':
        if (not) {
          return this.evaluateNot(not, inputData, context);
        }
        if (nested) {
          return this.evaluateNot(nested, inputData, context);
        }
        break;

      case 'field comparison':
        return this.evaluateFieldComparison(field!, operator!, value, inputData, errorMessage);

      case 'field required':
        return this.evaluateFieldRequired(field!, inputData, errorMessage);

      case 'field type':
        return this.evaluateFieldType(field!, (criterion as any).valueType!, inputData, errorMessage);

      case 'field length':
        return this.evaluateFieldLength(field!, operator!, value, inputData, errorMessage);

      case 'field range':
        return this.evaluateFieldRange(field!, value, inputData, errorMessage);

      case 'field pattern':
        return this.evaluateFieldPattern(field!, value, inputData, errorMessage);

      case 'field in list':
        return this.evaluateFieldInList(field!, value, inputData, errorMessage);

      case 'user context':
        return this.evaluateUserContext(operator!, value, context, errorMessage);

      case 'time comparison':
        return this.evaluateTimeComparison(operator!, value, context, errorMessage);

      case 'custom':
        return this.evaluateCustom(field!, operator!, value, inputData, context, errorMessage);

      default:
        return {
          passed: true,
          error: undefined,
        };
    }

    return { passed: true };
  }

  // ==================== AND Condition ====================

  private evaluateAnd(
    conditions: CriterionDefinition[],
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext
  ): { passed: boolean; error?: CriteriaError } {
    for (const condition of conditions) {
      const result = this.evaluateCriterion(condition, inputData, context);
      if (!result.passed) {
        return result;
      }
    }
    return { passed: true };
  }

  // ==================== OR Condition ====================

  private evaluateOr(
    conditions: CriterionDefinition[],
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext
  ): { passed: boolean; error?: CriteriaError } {
    const errors: CriteriaError[] = [];

    for (const condition of conditions) {
      const result = this.evaluateCriterion(condition, inputData, context);
      if (result.passed) {
        return { passed: true };
      }
      if (result.error) {
        errors.push(result.error);
      }
    }

    return {
      passed: false,
      error: {
        criterion: 'OR',
        message: errors.length > 0 ? errors[0].message : 'No OR condition passed',
        code: 'OR_CONDITION_FAILED',
      },
    };
  }

  // ==================== NOT Condition ====================

  private evaluateNot(
    condition: CriterionDefinition,
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext
  ): { passed: boolean; error?: CriteriaError } {
    const result = this.evaluateCriterion(condition, inputData, context);
    if (result.passed) {
      return {
        passed: false,
        error: {
          criterion: 'NOT',
          message: condition.errorMessage || 'Condition should not pass',
          code: 'NOT_CONDITION_FAILED',
        },
      };
    }
    return { passed: true };
  }

  // ==================== Field Comparison ====================

  private evaluateFieldComparison(
    field: string,
    operator: string,
    value: any,
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const fieldValue = this.getFieldValue(field, inputData);

    let passed = false;
    switch (operator) {
      case 'eq':
      case 'equals':
      case '==':
        passed = fieldValue === value;
        break;
      case 'ne':
      case 'notEquals':
      case '!=':
        passed = fieldValue !== value;
        break;
      case 'gt':
      case '>':
        passed = Number(fieldValue) > Number(value);
        break;
      case 'gte':
      case '>=':
        passed = Number(fieldValue) >= Number(value);
        break;
      case 'lt':
      case '<':
        passed = Number(fieldValue) < Number(value);
        break;
      case 'lte':
      case '<=':
        passed = Number(fieldValue) <= Number(value);
        break;
      case 'contains':
        passed = String(fieldValue).includes(String(value));
        break;
      case 'startsWith':
        passed = String(fieldValue).startsWith(String(value));
        break;
      case 'endsWith':
        passed = String(fieldValue).endsWith(String(value));
        break;
      case 'matches':
        passed = new RegExp(value).test(String(fieldValue));
        break;
      case 'isNull':
        passed = fieldValue === null || fieldValue === undefined;
        break;
      case 'isNotNull':
        passed = fieldValue !== null && fieldValue !== undefined;
        break;
      case 'isEmpty':
        passed = fieldValue === '' || fieldValue === null || fieldValue === undefined;
        break;
      case 'isNotEmpty':
        passed = fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
        break;
      case 'in':
        passed = Array.isArray(value) && value.includes(fieldValue);
        break;
      case 'notIn':
        passed = Array.isArray(value) && !value.includes(fieldValue);
        break;
      case 'between':
        const [min, max] = Array.isArray(value) ? value : [value, value];
        passed = Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
        break;
      case 'like':
        const pattern = value.replace(/%/g, '.*').replace(/_/g, '.');
        passed = new RegExp(`^${pattern}$`, 'i').test(String(fieldValue));
        break;
    }

    if (passed) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field comparison',
        field,
        message: errorMessage || `Field '${field}' failed comparison: ${operator} ${value}`,
        code: 'FIELD_COMPARISON_FAILED',
      },
    };
  }

  // ==================== Field Required ====================

  private evaluateFieldRequired(
    field: string,
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const value = this.getFieldValue(field, inputData);
    
    if (value !== null && value !== undefined && value !== '') {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field required',
        field,
        message: errorMessage || `Field '${field}' is required`,
        code: 'FIELD_REQUIRED',
      },
    };
  }

  // ==================== Field Type ====================

  private evaluateFieldType(
    field: string,
    expectedType: string,
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const value = this.getFieldValue(field, inputData);

    if (value === null || value === undefined) {
      return { passed: true }; // null/undefined values pass type check
    }

    let passed = false;
    switch (expectedType) {
      case 'string':
        passed = typeof value === 'string';
        break;
      case 'number':
        passed = typeof value === 'number' && !isNaN(value);
        break;
      case 'integer':
        passed = Number.isInteger(value);
        break;
      case 'boolean':
        passed = typeof value === 'boolean';
        break;
      case 'date':
        passed = !isNaN(Date.parse(value as string));
        break;
      case 'array':
        passed = Array.isArray(value);
        break;
      case 'object':
        passed = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'email':
        passed = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        break;
      case 'url':
        try {
          new URL(String(value));
          passed = true;
        } catch {
          passed = false;
        }
        break;
      case 'uuid':
        passed = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
        break;
      case 'slug':
        passed = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value));
        break;
      case 'rid':
        passed = /^ri\.[a-z]+\.main\.[a-z-]+\.[a-z0-9-]+$/.test(String(value));
        break;
    }

    if (passed) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field type',
        field,
        message: errorMessage || `Field '${field}' must be of type '${expectedType}'`,
        code: 'FIELD_TYPE_MISMATCH',
      },
    };
  }

  // ==================== Field Length ====================

  private evaluateFieldLength(
    field: string,
    operator: string,
    value: number,
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const fieldValue = this.getFieldValue(field, inputData);
    const length = typeof fieldValue === 'string' ? fieldValue.length : 
                   Array.isArray(fieldValue) ? fieldValue.length : 
                   String(fieldValue).length;

    let passed = false;
    switch (operator) {
      case 'eq':
      case '==':
        passed = length === value;
        break;
      case 'ne':
      case '!=':
        passed = length !== value;
        break;
      case 'gt':
      case '>':
        passed = length > value;
        break;
      case 'gte':
      case '>=':
        passed = length >= value;
        break;
      case 'lt':
      case '<':
        passed = length < value;
        break;
      case 'lte':
      case '<=':
        passed = length <= value;
        break;
      case 'between':
        const [min, max] = Array.isArray(value) ? value : [value, value];
        passed = length >= min && length <= max;
        break;
    }

    if (passed) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field length',
        field,
        message: errorMessage || `Field '${field}' length check failed`,
        code: 'FIELD_LENGTH_CHECK_FAILED',
      },
    };
  }

  // ==================== Field Range ====================

  private evaluateFieldRange(
    field: string,
    range: { min?: number; max?: number },
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const value = this.getFieldValue(field, inputData);
    const numValue = Number(value);

    if (isNaN(numValue)) {
      return {
        passed: false,
        error: {
          criterion: 'field range',
          field,
          message: errorMessage || `Field '${field}' must be a number`,
          code: 'FIELD_NOT_A_NUMBER',
        },
      };
    }

    if (range.min !== undefined && numValue < range.min) {
      return {
        passed: false,
        error: {
          criterion: 'field range',
          field,
          message: errorMessage || `Field '${field}' must be >= ${range.min}`,
          code: 'FIELD_BELOW_MIN',
        },
      };
    }

    if (range.max !== undefined && numValue > range.max) {
      return {
        passed: false,
        error: {
          criterion: 'field range',
          field,
          message: errorMessage || `Field '${field}' must be <= ${range.max}`,
          code: 'FIELD_ABOVE_MAX',
        },
      };
    }

    return { passed: true };
  }

  // ==================== Field Pattern ====================

  private evaluateFieldPattern(
    field: string,
    pattern: string | RegExp,
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const value = this.getFieldValue(field, inputData);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    if (regex.test(String(value))) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field pattern',
        field,
        message: errorMessage || `Field '${field}' does not match pattern '${pattern}'`,
        code: 'FIELD_PATTERN_MISMATCH',
      },
    };
  }

  // ==================== Field In List ====================

  private evaluateFieldInList(
    field: string,
    list: any[],
    inputData: Record<string, any>,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const value = this.getFieldValue(field, inputData);

    if (list.includes(value)) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'field in list',
        field,
        message: errorMessage || `Field '${field}' must be one of: ${list.join(', ')}`,
        code: 'FIELD_NOT_IN_LIST',
      },
    };
  }

  // ==================== User Context ====================

  private evaluateUserContext(
    operator: string,
    value: any,
    context: CriteriaEvaluationContext,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    switch (operator) {
      case 'hasRole':
        if (context.userRole === value) {
          return { passed: true };
        }
        return {
          passed: false,
          error: {
            criterion: 'user context',
            message: errorMessage || `User must have role '${value}'`,
            code: 'MISSING_ROLE',
          },
        };

      case 'inGroup':
        if (context.userGroups?.includes(value)) {
          return { passed: true };
        }
        return {
          passed: false,
          error: {
            criterion: 'user context',
            message: errorMessage || `User must be in group '${value}'`,
            code: 'NOT_IN_GROUP',
          },
        };

      case 'isAuthenticated':
        if (context.userId) {
          return { passed: true };
        }
        return {
          passed: false,
          error: {
            criterion: 'user context',
            message: errorMessage || 'User must be authenticated',
            code: 'NOT_AUTHENTICATED',
          },
        };

      case 'isAdmin':
        if (context.userRole === 'admin') {
          return { passed: true };
        }
        return {
          passed: false,
          error: {
            criterion: 'user context',
            message: errorMessage || 'Admin access required',
            code: 'NOT_ADMIN',
          },
        };

      default:
        return { passed: true };
    }
  }

  // ==================== Time Comparison ====================

  private evaluateTimeComparison(
    operator: string,
    value: any,
    context: CriteriaEvaluationContext,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    const now = context.timestamp || new Date();
    const valueTime = value instanceof Date ? value : new Date(value);

    let passed = false;
    switch (operator) {
      case 'before':
        passed = now < valueTime;
        break;
      case 'after':
        passed = now > valueTime;
        break;
      case 'between':
        if (Array.isArray(value)) {
          const [start, end] = value.map((v: any) => v instanceof Date ? v : new Date(v));
          passed = now >= start && now <= end;
        }
        break;
      case 'isWeekday':
        const day = now.getDay();
        passed = day >= 1 && day <= 5;
        break;
      case 'isWeekend':
        const weekendDay = now.getDay();
        passed = weekendDay === 0 || weekendDay === 6;
        break;
      case 'isBusinessHours':
        const hours = now.getHours();
        passed = hours >= 9 && hours < 17;
        break;
    }

    if (passed) {
      return { passed: true };
    }

    return {
      passed: false,
      error: {
        criterion: 'time comparison',
        message: errorMessage || `Time condition failed: ${operator}`,
        code: 'TIME_CONDITION_FAILED',
      },
    };
  }

  // ==================== Custom Validation ====================

  private evaluateCustom(
    name: string,
    operator: string,
    value: any,
    inputData: Record<string, any>,
    context: CriteriaEvaluationContext,
    errorMessage?: string
  ): { passed: boolean; error?: CriteriaError } {
    // Custom validators can be registered and called here
    // For now, we provide a placeholder
    return { passed: true };
  }

  // ==================== Helper Methods ====================

  private getFieldValue(field: string, data: Record<string, any>): any {
    const parts = field.split('.');
    let value: any = data;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Build criteria from ActionType definition
   */
  static buildCriteriaFromActionType(actionType: {
    submissionCriteria?: Array<{
      type?: string;
      parameter?: string;
      condition?: any;
      errorMessage?: string;
    }>;
  }): CriterionDefinition[] {
    if (!actionType.submissionCriteria) {
      return [];
    }

    return actionType.submissionCriteria.map((c) => ({
      type: c.type || 'field comparison',
      field: c.parameter,
      operator: c.condition?.operator,
      value: c.condition?.value,
      errorMessage: c.errorMessage,
    }));
  }
}
