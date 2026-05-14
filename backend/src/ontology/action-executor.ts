/**
 * Action Executor with Writeback Webhook Integration
 * 
 * 在现有 Action Executor 基础上集成 Writeback Webhook
 * 支持执行前验证、事务性保障和外部系统集成
 */

import { PrismaClient } from '@prisma/client';
import type { ActionTypeV2 } from './types.js';
import { SubmissionCriteriaEngine } from './submission-criteria-engine.js';
import { writebackEngine } from './writeback-webhook.js';

export interface ActionExecutionContext {
  userId?: string;
  userRole?: string;
  userGroups?: string[];
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime: number;
  webhookResults?: any[];
}

export interface ActionParameters {
  objectType?: string;
  objectId?: string;
  parameters: Record<string, any>;
}

/**
 * Enhanced Action Executor
 * 
 * 支持:
 * - Submission Criteria 验证
 * - Writeback Webhook 集成
 * - 事务性保障
 * - 错误回滚
 */
export class ActionExecutor {
  private prisma: PrismaClient;
  private criteriaEngine: SubmissionCriteriaEngine;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.criteriaEngine = new SubmissionCriteriaEngine();
  }

  /**
   * Execute an Action with Writeback Webhook support
   */
  async executeAction(
    actionType: ActionTypeV2,
    parameters: ActionParameters,
    context: ActionExecutionContext = {}
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  /**
   * Perform the actual action
   */
  private async performAction(
    actionType: ActionTypeV2,
    parameters: ActionParameters,
    context: ActionExecutionContext
  ): Promise<any> {
    const { apiName, parameters: paramDefs } = actionType;
    const values = parameters.parameters;

    switch (apiName) {
      case 'submitReview':
        return this.executeSubmitReview(values, context);

      case 'compareTools':
        return this.executeCompareTools(values, context);

      case 'trackEvent':
        return this.executeTrackEvent(values, context);

      case 'calculateHeat':
        return this.executeCalculateHeat(values, context);

      case 'updateToolRating':
        return this.executeUpdateRating(values, context);

      default:
        throw new Error(`Unknown action type: ${apiName}`);
    }
  }

  private async executeSubmitReview(values: any, context: ActionExecutionContext) {
    const { toolRid, userId, rating, reviewContent, pros, cons } = values;

    const review = await this.prisma.user_ratings.create({
      data: {
        id: `rating-${Date.now()}`,
        toolRid,
        userId: userId || context.userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        overallRating: rating,
        reviewContent,
        pros: pros || [],
        cons: cons || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.updateToolAggregateRating(toolRid);

    return { reviewId: review.id, success: true };
  }

  private async executeCompareTools(values: any, context: ActionExecutionContext) {
    const { toolSlugs, comparisonType } = values;

    const tools = await this.prisma.objects.findMany({
      where: {
        rid: { in: toolSlugs.map((slug: string) => `ri.aigc.main.object.aigc-tool.${slug}`) },
        status: 'active'
      },
      include: {
        object_types: true
      }
    });

    return {
      tools: tools.map(t => ({
        rid: t.rid,
        name: (t.properties as any).name,
        slug: (t.properties as any).slug,
        description: (t.properties as any).description
      })),
      comparisonType
    };
  }

  private async executeTrackEvent(values: any, context: ActionExecutionContext) {
    const { toolRid, eventType, metadata } = values;

    const event = await this.prisma.user_events.create({
      data: {
        id: `event-${Date.now()}`,
        toolRid,
        eventType,
        userId: context.userId,
        sessionId: context.sessionId,
        metadata: metadata || {},
        weight: this.getEventWeight(eventType),
        createdAt: new Date(),
      },
    });

    return { eventId: event.id, success: true };
  }

  private async executeCalculateHeat(values: any, context: ActionExecutionContext) {
    const { toolRid, period } = values;

    const events = await this.prisma.user_events.findMany({
      where: {
        toolRid,
        createdAt: {
          gte: this.getPeriodStart(period)
        }
      }
    });

    const eventCount = events.length;
    const weightedScore = events.reduce((sum, e) => sum + e.weight * e.weight, 0);
    const heatScore = Math.min(100, (weightedScore / Math.max(1, eventCount)) * 10);

    const snapshot = await this.prisma.tool_heat_snapshots.upsert({
      where: {
        toolRid_period: { toolRid, period: period || '24h' }
      },
      create: {
        id: `heat-${Date.now()}`,
        toolRid,
        period: period || '24h',
        heatScore,
        rawScore: eventCount,
        eventCount,
        weightedScore,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        heatScore,
        rawScore: eventCount,
        eventCount,
        weightedScore,
        calculatedAt: new Date()
      }
    });

    return { heatScore: snapshot.heatScore, eventCount };
  }

  private async executeUpdateRating(values: any, context: ActionExecutionContext) {
    const { toolRid, newRating } = values;

    await this.updateToolAggregateRating(toolRid);

    return { success: true };
  }

  private async rollbackAction(
    actionType: ActionTypeV2,
    actionId: string,
    parameters: ActionParameters
  ): Promise<void> {
    switch (actionType.apiName) {
      case 'submitReview':
        await this.prisma.user_ratings.deleteMany({
          where: {
            toolRid: parameters.parameters.toolRid,
            sessionId: parameters.parameters.sessionId,
          }
        });
        break;

      default:
        console.warn(`Rollback not implemented for action: ${actionType.apiName}`);
    }
  }

  private async updateToolAggregateRating(toolRid: string) {
    const ratings = await this.prisma.user_ratings.findMany({
      where: { toolRid, isFlagged: false }
    });

    if (ratings.length === 0) return;

    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;
    const weightedAverageRating = ratings.reduce((sum, r) => sum + r.overallRating * r.weight, 0) /
      ratings.reduce((sum, r) => sum + r.weight, 0);

    const ratingCounts = [0, 0, 0, 0, 0];
    ratings.forEach(r => {
      if (r.overallRating >= 1 && r.overallRating <= 5) {
        ratingCounts[r.overallRating - 1]++;
      }
    });

    await this.prisma.tool_ratings.upsert({
      where: { toolRid },
      create: {
        id: `ratings-${Date.now()}`,
        toolRid,
        totalRatings,
        averageRating,
        weightedAverageRating,
        rating5Count: ratingCounts[4],
        rating4Count: ratingCounts[3],
        rating3Count: ratingCounts[2],
        rating2Count: ratingCounts[1],
        rating1Count: ratingCounts[0],
        reviewCount: ratings.filter(r => r.reviewContent).length,
        updatedAt: new Date(),
      },
      update: {
        totalRatings,
        averageRating,
        weightedAverageRating,
        rating5Count: ratingCounts[4],
        rating4Count: ratingCounts[3],
        rating3Count: ratingCounts[2],
        rating2Count: ratingCounts[1],
        rating1Count: ratingCounts[0],
      }
    });
  }

  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      search: 0.5,
      click: 1.0,
      compare: 1.5,
      bookmark: 2.0,
      share: 2.5,
      review: 3.0,
    };
    return weights[eventType] || 1.0;
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}
