/**
 * Value Type Constraint Validation Engine
 *
 * 运行时强制执行 Value Type 约束
 * 支持: enum, regex, range, array 约束类型
 */

import type { OntologyValueType } from './types';

// =============================================================================
// Types
// =============================================================================

export interface ConstraintViolation {
  propertyName: string;
  propertyValue: any;
  constraintType: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationContext {
  objectTypeApiName?: string;
  actionTypeApiName?: string;
  parameterName?: string;
}

export type ConstraintType = 'enum' | 'regex' | 'range' | 'array' | 'required';

// =============================================================================
// Constraint Validators
// =============================================================================

interface EnumConstraint {
  type: 'enum';
  enum: { options: string[] };
}

interface RegexConstraint {
  type: 'regex';
  regex: { pattern: string; partialMatch?: boolean };
}

interface RangeConstraint {
  type: 'range';
  range: { min?: number; max?: number; inclusive?: boolean };
}

interface ArrayConstraint {
  type: 'array';
  array: {
    uniqueValues?: boolean;
    minLength?: number;
    maxLength?: number;
    valueConstraint?: any;
  };
}

type Constraint = EnumConstraint | RegexConstraint | RangeConstraint | ArrayConstraint;

/**
 * 验证单个值是否满足约束
 */
export function validateValue(
  value: any,
  constraint: Constraint,
  context?: { propertyName?: string; valueTypeName?: string }
): ConstraintViolation | null {
  const propertyName = context?.propertyName ?? 'unknown';

  switch (constraint.type) {
    case 'enum': {
      const options = constraint.enum.options;
      if (value === null || value === undefined) return null;
      if (!options.includes(String(value))) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'enum',
          message: `Value '${value}' is not in allowed options: [${options.join(', ')}]`,
          details: { allowedOptions: options },
        };
      }
      return null;
    }

    case 'regex': {
      if (value === null || value === undefined) return null;
      const pattern = new RegExp(constraint.regex.pattern);
      const testValue = String(value);
      const matches = constraint.regex.partialMatch
        ? pattern.test(testValue)
        : pattern.test(testValue);
      if (!matches) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'regex',
          message: `Value '${value}' does not match pattern: ${constraint.regex.pattern}`,
          details: { pattern: constraint.regex.pattern },
        };
      }
      return null;
    }

    case 'range': {
      if (value === null || value === undefined) return null;
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'range',
          message: `Value '${value}' is not a valid number`,
        };
      }
      const { min, max, inclusive = true } = constraint.range;
      if (min !== undefined) {
        const minOk = inclusive ? numValue >= min : numValue > min;
        if (!minOk) {
          return {
            propertyName,
            propertyValue: value,
            constraintType: 'range',
            message: `Value ${numValue} is below minimum ${inclusive ? min : `> ${min}`}`,
            details: { min, inclusive },
          };
        }
      }
      if (max !== undefined) {
        const maxOk = inclusive ? numValue <= max : numValue < max;
        if (!maxOk) {
          return {
            propertyName,
            propertyValue: value,
            constraintType: 'range',
            message: `Value ${numValue} exceeds maximum ${inclusive ? max : `< ${max}`}`,
            details: { max, inclusive },
          };
        }
      }
      return null;
    }

    case 'array': {
      if (value === null || value === undefined) return null;
      if (!Array.isArray(value)) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'array',
          message: `Value is not an array`,
        };
      }
      const { minLength, maxLength, uniqueValues, valueConstraint } = constraint.array;
      if (minLength !== undefined && value.length < minLength) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'array',
          message: `Array length ${value.length} is below minimum ${minLength}`,
          details: { minLength },
        };
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return {
          propertyName,
          propertyValue: value,
          constraintType: 'array',
          message: `Array length ${value.length} exceeds maximum ${maxLength}`,
          details: { maxLength },
        };
      }
      if (uniqueValues) {
        const seen = new Set();
        for (const item of value) {
          const key = JSON.stringify(item);
          if (seen.has(key)) {
            return {
              propertyName,
              propertyValue: value,
              constraintType: 'array',
              message: `Array contains duplicate value: ${item}`,
              details: { duplicateValue: item },
            };
          }
          seen.add(key);
        }
      }
      if (valueConstraint) {
        for (let i = 0; i < value.length; i++) {
          const itemViolation = validateValue(value[i], valueConstraint, {
            propertyName: `${propertyName}[${i}]`,
          });
          if (itemViolation) return itemViolation;
        }
      }
      return null;
    }

    default:
      return null;
  }
}

// =============================================================================
// Value Type Validation
// =============================================================================

/**
 * 使用 Value Type 定义验证属性值
 */
export function validateWithValueType(
  propertyName: string,
  propertyValue: any,
  valueType: OntologyValueType
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  if (valueType.constraints && Array.isArray(valueType.constraints)) {
    for (const constraint of valueType.constraints) {
      const violation = validateValue(propertyValue, constraint as Constraint, {
        propertyName,
        valueTypeName: valueType.apiName,
      });
      if (violation) {
        violations.push(violation);
      }
    }
  }

  return violations;
}

// =============================================================================
// Object Properties Validation
// =============================================================================

export interface ObjectPropertyDefinition {
  apiName: string;
  dataType?: { type: string };
  valueTypeApiName?: string;
  required?: boolean;
  defaultValue?: any;
}

/**
 * 验证对象的所有属性
 */
export function validateObjectProperties(
  properties: Record<string, any>,
  propertyDefinitions: ObjectPropertyDefinition[],
  valueTypes: Map<string, OntologyValueType>
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (const def of propertyDefinitions) {
    const value = properties[def.apiName];

    // Required check
    if (def.required && (value === undefined || value === null || value === '')) {
      violations.push({
        propertyName: def.apiName,
        propertyValue: value,
        constraintType: 'required',
        message: `Property '${def.apiName}' is required but missing or empty`,
      });
      continue;
    }

    // Skip validation if value is null/undefined and not required
    if (value === null || value === undefined) continue;

    // Value Type constraint validation
    if (def.valueTypeApiName) {
      const valueType = valueTypes.get(def.valueTypeApiName);
      if (valueType) {
        const typeViolations = validateWithValueType(def.apiName, value, valueType);
        violations.push(...typeViolations);
      }
    }
  }

  return violations;
}

// =============================================================================
// Action Parameter Validation
// =============================================================================

export interface ParameterDefinition {
  apiName: string;
  displayName?: string;
  dataType?: { type: string };
  valueTypeApiName?: string;
  required?: boolean;
  defaultValue?: any;
}

/**
 * 验证 Action 参数
 */
export function validateActionParameters(
  parameters: Record<string, any>,
  parameterDefinitions: ParameterDefinition[],
  valueTypes: Map<string, OntologyValueType>
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  for (const def of parameterDefinitions) {
    const value = parameters[def.apiName];

    // Required check
    if (def.required && (value === undefined || value === null)) {
      violations.push({
        propertyName: def.apiName,
        propertyValue: value,
        constraintType: 'required',
        message: `Parameter '${def.apiName}' (${def.displayName ?? def.apiName}) is required`,
      });
      continue;
    }

    if (value === null || value === undefined) continue;

    // Value Type validation
    if (def.valueTypeApiName) {
      const valueType = valueTypes.get(def.valueTypeApiName);
      if (valueType) {
        const typeViolations = validateWithValueType(def.apiName, value, valueType);
        violations.push(...typeViolations);
      }
    }
  }

  return violations;
}

// =============================================================================
// Validation Result Helpers
// =============================================================================

export function formatValidationErrors(violations: ConstraintViolation[]): string {
  if (violations.length === 0) return '';

  const lines = violations.map((v) => {
    let msg = `[${v.constraintType.toUpperCase()}] ${v.propertyName}: ${v.message}`;
    if (v.details) {
      msg += ` (${JSON.stringify(v.details)})`;
    }
    return msg;
  });

  return lines.join('\n');
}

export function createValidationError(violations: ConstraintViolation[]): Error {
  const message = formatValidationErrors(violations);
  const error = new Error(`Validation failed with ${violations.length} violation(s):\n${message}`);
  (error as any).violations = violations;
  (error as any).isValidationError = true;
  return error;
}

export function isValidationError(error: any): boolean {
  return error?.isValidationError === true;
}
