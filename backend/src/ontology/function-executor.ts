/**
 * Function Executor
 * 
 * Ontology Function 执行引擎
 * 将定义的 Function 连接到实际的业务逻辑实现
 */

import { PrismaClient } from '@prisma/client';
import type { FunctionV2 } from './types.js';

// Import existing services
import { RankingCalculator } from '../services/ranking/ranking-calculator.js';
import { HeatCalculator } from '../services/heat-calculator.js';
import { CompositeScorer } from '../services/ranking/composite-scorer.js';
import { RecommendationEngine } from '../services/recommendation/rec-engine.js';
import { AntiGamingService } from '../services/ranking/anti-gaming.js';
import { ScenarioMatcher } from '../services/recommendation/scenario-match.js';

export interface FunctionExecutorContext {
  prisma: PrismaClient;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface FunctionExecutorResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    executionTime: number;
    cacheHit: boolean;
  };
}

/**
 * Function Executor Class
 * 执行 Ontology Functions
 */
export class FunctionExecutor {
  private prisma: PrismaClient;
  private rankingCalculator: RankingCalculator;
  private heatCalculator: HeatCalculator;
  private compositeScorer: CompositeScorer;
  private recommendationEngine: RecommendationEngine;
  private antiGamingService: AntiGamingService;
  private scenarioMatcher: ScenarioMatcher;
  private cache: Map<string, { data: any; expiresAt: number }>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.rankingCalculator = new RankingCalculator(prisma);
    this.heatCalculator = new HeatCalculator(prisma);
    this.compositeScorer = new CompositeScorer(prisma);
    this.recommendationEngine = new RecommendationEngine(prisma);
    this.antiGamingService = new AntiGamingService(prisma);
    this.scenarioMatcher = new ScenarioMatcher();
    this.cache = new Map();
  }

  /**
   * Execute a Function
   */
  async execute(
    func: FunctionV2,
    parameters: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<FunctionExecutorResult> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(func.apiName, parameters);
    const cached = this.getCache(cacheKey);
    if (cached && func.metadata?.cacheConfig?.enabled) {
      return {
        success: true,
        data: cached,
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit: true,
        },
      };
    }

    try {
      // Execute based on function category
      let data: any;
      switch (func.metadata?.category) {
        case 'ranking':
          data = await this.executeRankingFunction(func.apiName, parameters, context);
          break;
        case 'heat':
          data = await this.executeHeatFunction(func.apiName, parameters, context);
          break;
        case 'scoring':
          data = await this.executeScoringFunction(func.apiName, parameters, context);
          break;
        case 'recommendation':
          data = await this.executeRecommendationFunction(func.apiName, parameters, context);
          break;
        case 'anti-gaming':
          data = await this.executeAntiGamingFunction(func.apiName, parameters, context);
          break;
        case 'scenario':
          data = await this.executeScenarioFunction(func.apiName, parameters, context);
          break;
        default:
          data = await this.executeDefaultFunction(func.apiName, parameters, context);
      }

      // Cache result
      if (func.metadata?.cacheConfig?.enabled) {
        this.setCache(cacheKey, data, func.metadata.cacheConfig.ttl || 300);
      }

      return {
        success: true,
        data,
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
        metadata: {
          executionTime: Date.now() - startTime,
          cacheHit: false,
        },
      };
    }
  }

  // ==================== Ranking Functions ====================

  private async executeRankingFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'getCompositeRankings':
        return this.rankingCalculator.getRankings({
          type: 'composite',
          perspective: params.perspective,
          category: params.category,
          limit: params.limit,
          offset: params.offset,
        });

      case 'getPerformanceRankings':
        return this.rankingCalculator.getRankings({
          type: 'quality',
          category: params.category,
          limit: params.limit,
          offset: params.offset,
        });

      case 'getValueRankings':
        return this.rankingCalculator.getRankings({
          type: 'price_performance',
          category: params.category,
          limit: params.limit,
          offset: params.offset,
        });

      case 'getQualityRankings':
        return this.rankingCalculator.getRankings({
          type: 'quality',
          category: params.category,
          limit: params.limit,
          offset: params.offset,
        });

      case 'getPopularityRankings':
        return this.rankingCalculator.getRankings({
          type: 'popularity',
          category: params.category,
          limit: params.limit,
          offset: params.offset,
        });

      case 'getRisingRankings':
        return this.rankingCalculator.getRisingRankings({
          perspective: params.perspective,
          limit: params.limit,
          days: params.days,
        });

      case 'getToolRankingDetail':
        return this.rankingCalculator.getToolRanking({
          toolSlug: params.toolSlug,
          perspective: params.perspective,
        });

      case 'getRankingCategories':
        return this.rankingCalculator.getAllRankingTypes();

      default:
        throw new Error(`Unknown ranking function: ${apiName}`);
    }
  }

  // ==================== Heat Functions ====================

  private async executeHeatFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'calculateToolHeat':
        return this.heatCalculator.calculateHeat(params.toolRid, params.period || '24h');

      case 'calculateAllPeriodsHeat':
        return this.heatCalculator.calculateAllPeriods(params.toolRid);

      case 'getToolHeatScore':
        return this.heatCalculator.getToolHeat(params.toolRid);

      case 'getHotTools':
        return this.heatCalculator.getHotTools(
          params.period || '24h',
          params.limit || 20,
          params.offset || 0
        );

      case 'getRisingTools':
        return this.heatCalculator.getRisingTools(params.period || '7d', params.limit || 20);

      case 'getHeatTrend':
        return this.heatCalculator.getToolHeat(params.toolRid);

      case 'getHeatHistory':
        return this.heatCalculator.getHeatHistory(
          params.toolRid,
          params.period || '24h',
          params.days || 7
        );

      case 'recordUserEvent':
        return this.heatCalculator.recordEvent({
          toolRid: params.toolRid,
          eventType: params.eventType,
          userId: params.userId || context?.userId,
          sessionId: params.sessionId || context?.sessionId,
          metadata: params.metadata,
        });

      default:
        throw new Error(`Unknown heat function: ${apiName}`);
    }
  }

  // ==================== Scoring Functions ====================

  private async executeScoringFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'calculateToolScore':
        const tool = await this.prisma.functions.findUnique({
          where: { apiName: params.toolSlug },
        });
        if (!tool) throw new Error(`Tool not found: ${params.toolSlug}`);
        
        const dimensions = await this.compositeScorer.extractDimensionsFromTool({
          slug: tool.apiName,
        });
        return this.compositeScorer.calculateScore(dimensions, params.perspective || 'default');

      case 'getScoreBreakdown':
        const tool2 = await this.prisma.functions.findUnique({
          where: { apiName: params.toolSlug },
        });
        if (!tool2) throw new Error(`Tool not found: ${params.toolSlug}`);
        
        const dimensions2 = await this.compositeScorer.extractDimensionsFromTool({
          slug: tool2.apiName,
        });
        const scoreResult = this.compositeScorer.calculateScore(dimensions2, params.perspective || 'default');
        return {
          totalScore: scoreResult.totalScore,
          breakdown: scoreResult.breakdown,
          dimensions: scoreResult.dimensions,
          weights: scoreResult.weights,
        };

      case 'getPerspectiveConfig':
        return this.compositeScorer.getPerspectiveWeights(params.perspective as any);

      case 'getAllPerspectives':
        return this.compositeScorer.getAllPerspectives();

      case 'extractToolDimensions':
        const tool3 = await this.prisma.functions.findUnique({
          where: { apiName: params.toolSlug },
        });
        if (!tool3) throw new Error(`Tool not found: ${params.toolSlug}`);
        return this.compositeScorer.extractDimensionsFromTool({
          slug: tool3.apiName,
        });

      case 'compareToolScores':
        const tools = await this.prisma.functions.findMany({
          where: { apiName: { in: params.toolSlugs } },
        });
        const scores = await Promise.all(
          tools.map(async (t) => {
            const dimensions = await this.compositeScorer.extractDimensionsFromTool({
              slug: t.apiName,
            });
            return {
              tool: t,
              score: this.compositeScorer.calculateScore(dimensions, params.perspective || 'default'),
            };
          })
        );
        return { tools: scores };

      case 'getDimensionLeader':
        const allTools = await this.prisma.functions.findMany({
          where: params.category ? {
            status: 'active',
          } : undefined,
        });
        const leaders = await Promise.all(
          allTools.map(async (t) => {
            const dimensions = await this.compositeScorer.extractDimensionsFromTool({
              slug: t.apiName,
            });
            return { tool: t, dimensionScore: dimensions[params.dimension as keyof typeof dimensions] || 0 };
          })
        );
        return leaders.sort((a, b) => b.dimensionScore - a.dimensionScore).slice(0, params.limit || 10);

      default:
        throw new Error(`Unknown scoring function: ${apiName}`);
    }
  }

  // ==================== Recommendation Functions ====================

  private async executeRecommendationFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'getHomeRecommendations':
        return this.recommendationEngine.getHomeRecommendations({
          limit: params.limit,
          offset: params.offset,
          mixRatio: params.mixRatio,
        });

      case 'getSearchRecommendations':
        return this.recommendationEngine.getSearchRecommendations({
          query: params.query,
          category: params.category,
          limit: params.limit,
          relevanceWeight: params.relevanceWeight,
          heatWeight: params.heatWeight,
        });

      case 'getScenarioRecommendations':
        return this.recommendationEngine.getScenarioRecommendations({
          scenario: params.scenario,
          description: params.description,
          constraints: params.constraints,
          limit: params.limit,
        });

      case 'getPersonalizedRecommendations':
        return this.recommendationEngine.getSimilarTools({
          toolRid: params.userId,
          limit: params.limit,
          includeReasons: true,
        });

      case 'getSimilarTools':
        return this.recommendationEngine.getSimilarTools({
          toolRid: params.toolRid,
          limit: params.limit,
          includeReasons: params.includeReasons,
        });

      case 'getTrendingTools':
        return this.heatCalculator.getRisingTools('7d', params.limit || 10);

      case 'matchUseCase':
        return this.scenarioMatcher.matchScenario(params.query, params.description);

      default:
        throw new Error(`Unknown recommendation function: ${apiName}`);
    }
  }

  // ==================== Anti-Gaming Functions ====================

  private async executeAntiGamingFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'detectUserRisk':
        return this.antiGamingService.detectAnomaly({
          userId: params.userId,
          sessionId: params.sessionId,
          ipAddress: params.ipAddress,
          action: params.action,
          toolRid: params.toolRid,
        });

      case 'getRiskProfile':
        return this.antiGamingService.getUserRiskProfile(params.userId);

      case 'getRiskStatistics':
        return this.antiGamingService.getStatistics();

      case 'getHighRiskUsers':
        return this.antiGamingService.getHighRiskUsers();

      case 'clearUserRisk':
        this.antiGamingService.clearUserRisk(params.userId);
        return true;

      case 'recordActivity':
        await this.antiGamingService.recordActivity({
          userId: params.userId || context?.userId,
          sessionId: params.sessionId || context?.sessionId,
          ipAddress: params.ipAddress,
          action: params.action,
          toolRid: params.toolRid,
          metadata: params.metadata,
        });
        return true;

      default:
        throw new Error(`Unknown anti-gaming function: ${apiName}`);
    }
  }

  // ==================== Scenario Functions ====================

  private async executeScenarioFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'getPresetScenarios':
        return this.scenarioMatcher.getPresetScenarios();

      case 'getScenarioConfig':
        return (this.scenarioMatcher as any).getScenarioConfig(params.scenarioId);

      case 'matchScenario':
        return this.scenarioMatcher.matchScenario(params.query, params.description);

      case 'getToolsForScenario':
        const scenario = (this.scenarioMatcher as any).getScenarioConfig(params.scenarioId);
        if (!scenario) throw new Error(`Scenario not found: ${params.scenarioId}`);
        
        return this.recommendationEngine.getScenarioRecommendations({
          scenario: params.scenarioId,
          constraints: params.constraints,
          limit: params.limit,
        });

      case 'searchScenarios':
        return (this.scenarioMatcher as any).searchScenarios(params.query, params.limit);

      default:
        throw new Error(`Unknown scenario function: ${apiName}`);
    }
  }

  // ==================== Default Functions ====================

  private async executeDefaultFunction(
    apiName: string,
    params: Record<string, any>,
    context?: Partial<FunctionExecutorContext>
  ): Promise<any> {
    switch (apiName) {
      case 'searchTools':
        return this.prisma.functions.findMany({
          where: {
            OR: [
              { displayName: { contains: params.query, mode: 'insensitive' } },
              { description: { contains: params.query, mode: 'insensitive' } },
            ],
          },
          take: params.limit || 20,
        });

      case 'compareTools':
        const tools = await this.prisma.functions.findMany({
          where: { apiName: { in: params.toolSlugs } },
        });
        return { tools };

      case 'getSimilarTools':
        const similar = await this.prisma.functions.findMany({
          where: {
            apiName: { not: params.toolSlug },
            status: 'active',
          },
          take: params.limit || 5,
        });
        return { tools: similar };

      case 'incrementViewCount':
        await this.prisma.functions.update({
          where: { apiName: params.toolSlug },
          data: { updatedAt: new Date() },
        });
        return true;

      default:
        throw new Error(`Unknown function: ${apiName}`);
    }
  }

  // ==================== Cache Methods ====================

  private getCacheKey(apiName: string, params: Record<string, any>): string {
    return `${apiName}:${JSON.stringify(params)}`;
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}
