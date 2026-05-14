/**
 * Data Quality Checker
 *
 * 检查 Ontology 数据质量
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface DataQualityRule {
  objectType: string;
  field: string;
  rule: 'required' | 'enum' | 'range' | 'unique' | 'pattern' | 'custom';
  values?: string[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  customCheck?: (value: any) => boolean;
  severity: 'error' | 'warning' | 'info';
}

export interface QualityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  object: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface QualityReport {
  totalObjects: number;
  issues: QualityIssue[];
  issueRate: number;
  score: number;
  breakdown: {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
    validity: number;
  };
}

// =============================================================================
// Quality Rules
// =============================================================================

const TOOL_QUALITY_RULES: DataQualityRule[] = [
  // 完整性规则
  { objectType: 'AIGCTool', field: 'name', rule: 'required', severity: 'error' },
  { objectType: 'AIGCTool', field: 'slug', rule: 'required', severity: 'error' },
  { objectType: 'AIGCTool', field: 'description', rule: 'required', severity: 'warning' },
  { objectType: 'AIGCTool', field: 'developer', rule: 'required', severity: 'error' },
  { objectType: 'AIGCTool', field: 'pricingType', rule: 'required', severity: 'error' },
  { objectType: 'AIGCTool', field: 'logoUrl', rule: 'required', severity: 'warning' },
  { objectType: 'AIGCTool', field: 'websiteUrl', rule: 'required', severity: 'warning' },

  // 准确性规则
  { objectType: 'AIGCTool', field: 'inputPrice', rule: 'range', min: 0, severity: 'warning' },
  { objectType: 'AIGCTool', field: 'outputPrice', rule: 'range', min: 0, severity: 'warning' },
  { objectType: 'AIGCTool', field: 'contextWindow', rule: 'range', min: 0, severity: 'warning' },
  { objectType: 'AIGCTool', field: 'maxOutputTokens', rule: 'range', min: 0, severity: 'warning' },

  // 一致性规则
  {
    objectType: 'AIGCTool',
    field: 'pricingType',
    rule: 'enum',
    values: ['free', 'freemium', 'subscription', 'pay_per_use', 'enterprise'],
    severity: 'error',
  },

  // 有效性规则
  { objectType: 'AIGCTool', field: 'averageRating', rule: 'range', min: 0, max: 5, severity: 'error' },
];

const REVIEW_QUALITY_RULES: DataQualityRule[] = [
  { objectType: 'UserReview', field: 'overallRating', rule: 'range', min: 1, max: 5, severity: 'error' },
];

// =============================================================================
// Data Quality Checker
// =============================================================================

export class DataQualityChecker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取 AIGCTool 的 Object Type ID
   */
  private async getAIGCToolTypeId(): Promise<string | null> {
    const type = await this.prisma.object_types.findUnique({
      where: { apiName: 'AIGCTool' },
    });
    return type?.id || null;
  }

  /**
   * 检查工具数据质量
   */
  async checkToolDataQuality(): Promise<QualityReport> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) {
      return this.buildReport(0, []);
    }

    const tools = await this.prisma.objects.findMany({
      where: { objectTypeId: toolTypeId },
    });
    const issues: QualityIssue[] = [];

    for (const tool of tools) {
      const props = tool.properties as any;
      for (const rule of TOOL_QUALITY_RULES) {
        const value = props?.[rule.field];
        const issue = this.evaluateRule(rule, value, props?.slug || tool.id);
        if (issue) {
          issues.push({
            ...issue,
            object: props?.slug || tool.id,
          });
        }
      }
    }

    return this.buildReport(tools.length, issues);
  }

  /**
   * 检查评价数据质量
   */
  async checkReviewDataQuality(): Promise<QualityReport> {
    const reviews = await this.prisma.user_ratings.findMany();
    const issues: QualityIssue[] = [];

    for (const review of reviews) {
      for (const rule of REVIEW_QUALITY_RULES) {
        const value = (review as any)[rule.field];
        const issue = this.evaluateRule(rule, value, review.id);
        if (issue) {
          issues.push({
            ...issue,
            object: review.id,
          });
        }
      }
    }

    return this.buildReport(reviews.length, issues);
  }

  /**
   * 检查所有数据质量
   */
  async checkAllDataQuality(): Promise<{
    tools: QualityReport;
    reviews: QualityReport;
    overall: QualityReport;
  }> {
    const [tools, reviews] = await Promise.all([
      this.checkToolDataQuality(),
      this.checkReviewDataQuality(),
    ]);

    const allIssues = [...tools.issues, ...reviews.issues];
    const totalObjects = tools.totalObjects + reviews.totalObjects;

    return {
      tools,
      reviews,
      overall: this.buildReport(totalObjects, allIssues),
    };
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private evaluateRule(
    rule: DataQualityRule,
    value: any,
    objectId: string
  ): QualityIssue | null {
    switch (rule.rule) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return {
            type: 'completeness',
            severity: rule.severity,
            object: objectId,
            field: rule.field,
            message: `${rule.field} 不能为空`,
            suggestion: `请补充 ${rule.field}`,
          };
        }
        break;

      case 'enum':
        if (value && !rule.values?.includes(value)) {
          return {
            type: 'consistency',
            severity: rule.severity,
            object: objectId,
            field: rule.field,
            message: `${rule.field} 值 "${value}" 不在允许列表中`,
            suggestion: `允许的值为: ${rule.values?.join(', ')}`,
          };
        }
        break;

      case 'range':
        if (value !== undefined && value !== null) {
          if (rule.min !== undefined && value < rule.min) {
            return {
              type: 'accuracy',
              severity: rule.severity,
              object: objectId,
              field: rule.field,
              message: `${rule.field} 不能小于 ${rule.min}`,
              suggestion: `请检查 ${rule.field} 的值`,
            };
          }
          if (rule.max !== undefined && value > rule.max) {
            return {
              type: 'accuracy',
              severity: rule.severity,
              object: objectId,
              field: rule.field,
              message: `${rule.field} 不能大于 ${rule.max}`,
              suggestion: `请检查 ${rule.field} 的值`,
            };
          }
        }
        break;

      case 'pattern':
        if (value && rule.pattern && !rule.pattern.test(value)) {
          return {
            type: 'validity',
            severity: rule.severity,
            object: objectId,
            field: rule.field,
            message: `${rule.field} 格式不正确`,
            suggestion: `请检查 ${rule.field} 的格式`,
          };
        }
        break;

      case 'custom':
        if (rule.customCheck && !rule.customCheck(value)) {
          return {
            type: 'validity',
            severity: rule.severity,
            object: objectId,
            field: rule.field,
            message: `${rule.field} 未通过自定义验证`,
          };
        }
        break;
    }

    return null;
  }

  private buildReport(totalObjects: number, issues: QualityIssue[]): QualityReport {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const infos = issues.filter(i => i.severity === 'info');

    // 计算各维度得分
    const completenessIssues = issues.filter(i => i.type === 'completeness');
    const accuracyIssues = issues.filter(i => i.type === 'accuracy');
    const consistencyIssues = issues.filter(i => i.type === 'consistency');
    const uniquenessIssues = issues.filter(i => i.type === 'uniqueness');
    const validityIssues = issues.filter(i => i.type === 'validity');

    const completeness = Math.max(0, 100 - (completenessIssues.length / Math.max(totalObjects, 1)) * 100);
    const accuracy = Math.max(0, 100 - (accuracyIssues.length / Math.max(totalObjects, 1)) * 100);
    const consistency = Math.max(0, 100 - (consistencyIssues.length / Math.max(totalObjects, 1)) * 100);
    const uniqueness = Math.max(0, 100 - (uniquenessIssues.length / Math.max(totalObjects, 1)) * 100);
    const validity = Math.max(0, 100 - (validityIssues.length / Math.max(totalObjects, 1)) * 100);

    const score = Math.round((completeness + accuracy + consistency + uniqueness + validity) / 5);

    return {
      totalObjects,
      issues,
      issueRate: totalObjects > 0 ? issues.length / totalObjects : 0,
      score,
      breakdown: {
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        consistency: Math.round(consistency),
        uniqueness: Math.round(uniqueness),
        validity: Math.round(validity),
      },
    };
  }
}

// =============================================================================
// Singleton
// =============================================================================

let checker: DataQualityChecker | null = null;

export function getDataQualityChecker(prisma: PrismaClient): DataQualityChecker {
  if (!checker) {
    checker = new DataQualityChecker(prisma);
  }
  return checker;
}
