/**
 * Ontology Health Checker
 *
 * 检查 Ontology 设计的健康状态
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface HealthCheckIssue {
  type: 'object_count' | 'link_type' | 'action_complexity' | 'property' | 'naming';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  details?: any;
}

export interface HealthCheckResult {
  status: 'ok' | 'warning' | 'error';
  score: number;
  checks: {
    objectCount: { status: string; message: string; score: number };
    linkTypes: { status: string; message: string; score: number; issues: number };
    actionComplexity: { status: string; message: string; score: number; issues: number };
    properties: { status: string; message: string; score: number };
    naming: { status: string; message: string; score: number };
  };
  issues: HealthCheckIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}

// =============================================================================
// Ontology Health Checker
// =============================================================================

export class OntologyHealthChecker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 执行健康检查
   */
  async check(): Promise<HealthCheckResult> {
    const issues: HealthCheckIssue[] = [];

    // 1. 检查对象数量
    const objectCountCheck = await this.checkObjectCount(issues);

    // 2. 检查 Link Types
    const linkTypeCheck = await this.checkLinkTypes(issues);

    // 3. 检查 Action 复杂度
    const actionCheck = await this.checkActionComplexity(issues);

    // 4. 检查 Properties
    const propertyCheck = await this.checkProperties(issues);

    // 5. 检查命名规范
    const namingCheck = await this.checkNaming(issues);

    // 计算总分
    const scores = [
      objectCountCheck.score,
      linkTypeCheck.score,
      actionCheck.score,
      propertyCheck.score,
      namingCheck.score,
    ];
    const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const infos = issues.filter(i => i.severity === 'info').length;

    return {
      status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok',
      score: totalScore,
      checks: {
        objectCount: objectCountCheck,
        linkTypes: linkTypeCheck,
        actionComplexity: actionCheck,
        properties: propertyCheck,
        naming: namingCheck,
      },
      issues,
      summary: {
        totalIssues: issues.length,
        errors,
        warnings,
        infos,
      },
    };
  }

  // =============================================================================
  // Private Check Methods
  // =============================================================================

  private async getAIGCToolTypeId(): Promise<string | null> {
    const type = await this.prisma.object_types.findUnique({
      where: { apiName: 'AIGCTool' },
    });
    return type?.id || null;
  }

  private async checkObjectCount(issues: HealthCheckIssue[]): Promise<any> {
    const toolTypeId = await this.getAIGCToolTypeId();
    const count = toolTypeId
      ? await this.prisma.objects.count({ where: { objectTypeId: toolTypeId } })
      : 0;

    if (count < 3) {
      issues.push({
        type: 'object_count',
        severity: 'warning',
        message: `对象数量过少（${count} 个），可能遗漏核心业务对象`,
        suggestion: '检查是否遗漏了关键业务对象',
      });
      return { status: 'warning', message: `对象数量过少（${count} 个）`, score: 50 };
    }

    if (count > 20) {
      issues.push({
        type: 'object_count',
        severity: 'warning',
        message: `对象数量过多（${count} 个），可能存在过度设计`,
        suggestion: '检查是否有对象可以合并或用 Property 替代',
      });
      return { status: 'warning', message: `对象数量过多（${count} 个）`, score: 70 };
    }

    return { status: 'ok', message: `对象数量合理（${count} 个）`, score: 100 };
  }

  private async checkLinkTypes(issues: HealthCheckIssue[]): Promise<any> {
    const linkIssues: HealthCheckIssue[] = [];

    // 获取所有 Link Types
    const linkTypes = await this.prisma.link_types.findMany();

    // 检查是否有孤立的 Link Type（没有关联的 objects）
    const links = await this.prisma.links.count();
    if (links === 0 && linkTypes.length > 0) {
      linkIssues.push({
        type: 'link_type',
        severity: 'info',
        message: `存在 ${linkTypes.length} 个 Link Type 但没有创建任何 Link 实例`,
        suggestion: '检查是否需要创建 Link 实例来关联对象',
      });
    }

    // 检查 Link Type 的 source 和 target 是否指向存在的 Object Type
    const objectTypeIds = new Set(
      (await this.prisma.object_types.findMany({ select: { id: true } })).map(o => o.id)
    );

    for (const lt of linkTypes) {
      if (!objectTypeIds.has(lt.sourceObjectTypeId)) {
        linkIssues.push({
          type: 'link_type',
          severity: 'error',
          message: `Link Type "${lt.apiName}" 的 sourceObjectTypeId 指向不存在的 Object Type`,
          suggestion: '修复 sourceObjectTypeId 或创建对应的 Object Type',
        });
      }
      if (!objectTypeIds.has(lt.targetObjectTypeId)) {
        linkIssues.push({
          type: 'link_type',
          severity: 'error',
          message: `Link Type "${lt.apiName}" 的 targetObjectTypeId 指向不存在的 Object Type`,
          suggestion: '修复 targetObjectTypeId 或创建对应的 Object Type',
        });
      }
    }

    issues.push(...linkIssues);

    const score = Math.max(0, 100 - linkIssues.length * 10);
    return {
      status: linkIssues.length > 0 ? 'warning' : 'ok',
      message: linkIssues.length > 0 ? `发现 ${linkIssues.length} 个 Link Type 问题` : 'Link Type 设计合理',
      score,
      issues: linkIssues.length,
    };
  }

  private async checkActionComplexity(issues: HealthCheckIssue[]): Promise<any> {
    const actionIssues: HealthCheckIssue[] = [];

    // 检查 Action Types
    const actionTypes = await this.prisma.action_types.findMany();

    for (const at of actionTypes) {
      const params = at.parameters as any[] || [];
      if (params.length > 10) {
        actionIssues.push({
          type: 'action_complexity',
          severity: 'warning',
          message: `Action Type "${at.apiName}" 参数过多（${params.length} 个）`,
          suggestion: '考虑拆分 Action 或减少参数数量',
        });
      }

      const rules = at.rules as any[] || [];
      if (rules.length > 20) {
        actionIssues.push({
          type: 'action_complexity',
          severity: 'warning',
          message: `Action Type "${at.apiName}" 规则过于复杂（${rules.length} 条）`,
          suggestion: '考虑简化规则逻辑',
        });
      }
    }

    issues.push(...actionIssues);

    const score = Math.max(0, 100 - actionIssues.length * 5);
    return {
      status: actionIssues.length > 0 ? 'warning' : 'ok',
      message: actionIssues.length > 0 ? `发现 ${actionIssues.length} 个 Action 复杂度问题` : 'Action 复杂度正常',
      score,
      issues: actionIssues.length,
    };
  }

  private async checkProperties(issues: HealthCheckIssue[]): Promise<any> {
    const propertyIssues: HealthCheckIssue[] = [];

    // 检查 Object Types 的 Properties 定义
    const objectTypes = await this.prisma.object_types.findMany();

    for (const ot of objectTypes) {
      const rawProperties = ot.properties;
      const properties = Array.isArray(rawProperties) ? rawProperties : [];

      // 检查是否有 Property 缺少 apiName
      for (const prop of properties) {
        const p = prop as Record<string, any>;
        if (!p.apiName) {
          propertyIssues.push({
            type: 'property',
            severity: 'error',
            message: `Object Type "${ot.apiName}" 中存在缺少 apiName 的 Property`,
            suggestion: '为所有 Property 定义 apiName',
          });
        }
        if (!p.dataType) {
          propertyIssues.push({
            type: 'property',
            severity: 'error',
            message: `Object Type "${ot.apiName}" 的 Property "${p.apiName || 'unknown'}" 缺少 dataType`,
            suggestion: '为 Property 定义 dataType',
          });
        }
      }

      // 检查是否有重复的属性名
      const apiNames = properties.map(p => (p as Record<string, any>).apiName).filter(Boolean);
      const duplicates = apiNames.filter((item, index) => apiNames.indexOf(item) !== index);
      if (duplicates.length > 0) {
        propertyIssues.push({
          type: 'property',
          severity: 'error',
          message: `Object Type "${ot.apiName}" 中存在重复的属性名: ${[...new Set(duplicates)].join(', ')}`,
          suggestion: '删除重复的属性定义',
        });
      }
    }

    // 检查 objects 中是否有缺少关键属性的实例
    const toolTypeId = await this.getAIGCToolTypeId();
    if (toolTypeId) {
      const tools = await this.prisma.objects.findMany({
        where: { objectTypeId: toolTypeId },
      });

      for (const tool of tools) {
        const props = tool.properties as Record<string, any> || {};
        if (!props.name) {
          propertyIssues.push({
            type: 'property',
            severity: 'warning',
            message: `工具实例缺少 name 属性`,
            suggestion: '为工具实例添加 name 属性',
          });
        }
        if (!props.description) {
          propertyIssues.push({
            type: 'property',
            severity: 'info',
            message: `工具 "${props.name || 'unknown'}" 缺少描述`,
            suggestion: '为工具添加描述信息',
          });
        }
      }
    }

    issues.push(...propertyIssues);

    const score = Math.max(0, 100 - propertyIssues.length * 5);
    return {
      status: propertyIssues.length > 0 ? 'warning' : 'ok',
      message: propertyIssues.length > 0 ? `发现 ${propertyIssues.length} 个 Property 问题` : 'Properties 完整',
      score,
    };
  }

  private async checkNaming(issues: HealthCheckIssue[]): Promise<any> {
    const namingIssues: HealthCheckIssue[] = [];

    // 检查 Object Types 命名规范
    const objectTypes = await this.prisma.object_types.findMany();
    for (const ot of objectTypes) {
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(ot.apiName)) {
        namingIssues.push({
          type: 'naming',
          severity: 'warning',
          message: `Object Type "${ot.apiName}" 不符合 PascalCase 命名规范`,
          suggestion: 'Object Type apiName 应该使用 PascalCase',
        });
      }
    }

    // 检查 Link Types 命名规范
    const linkTypes = await this.prisma.link_types.findMany();
    for (const lt of linkTypes) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(lt.apiName)) {
        namingIssues.push({
          type: 'naming',
          severity: 'warning',
          message: `Link Type "${lt.apiName}" 不符合 camelCase 命名规范`,
          suggestion: 'Link Type apiName 应该使用 camelCase',
        });
      }
    }

    // 检查 Action Types 命名规范
    const actionTypes = await this.prisma.action_types.findMany();
    for (const at of actionTypes) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(at.apiName)) {
        namingIssues.push({
          type: 'naming',
          severity: 'warning',
          message: `Action Type "${at.apiName}" 不符合 camelCase 命名规范`,
          suggestion: 'Action Type apiName 应该使用 camelCase',
        });
      }
    }

    // 检查工具实例 slug 命名
    const toolTypeId = await this.getAIGCToolTypeId();
    if (toolTypeId) {
      const tools = await this.prisma.objects.findMany({
        where: { objectTypeId: toolTypeId },
      });
      for (const tool of tools) {
        const props = tool.properties as any;
        const slug = props?.slug;
        if (slug && !/^[a-z0-9-]+$/.test(slug)) {
          namingIssues.push({
            type: 'naming',
            severity: 'warning',
            message: `工具 "${props?.name || 'unknown'}" 的 slug "${slug}" 不符合命名规范`,
            suggestion: 'slug 应该只包含小写字母、数字和连字符',
          });
        }
      }
    }

    issues.push(...namingIssues);

    const score = Math.max(0, 100 - namingIssues.length * 10);
    return {
      status: namingIssues.length > 0 ? 'warning' : 'ok',
      message: namingIssues.length > 0 ? `发现 ${namingIssues.length} 个命名问题` : '命名规范',
      score,
    };
  }
}

// =============================================================================
// Singleton
// =============================================================================

let checker: OntologyHealthChecker | null = null;

export function getOntologyHealthChecker(prisma: PrismaClient): OntologyHealthChecker {
  if (!checker) {
    checker = new OntologyHealthChecker(prisma);
  }
  return checker;
}
