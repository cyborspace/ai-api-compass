/**
 * AIGC Service
 * 
 * 业务逻辑层 - 实现 Ontology Function
 */

import { aigcRepository } from '../repositories/aigc.repository.js';
import type { FunctionExecutionResult } from '../ontology/types';

// =============================================================================
// Tool Service
// =============================================================================

export class ToolService {
  /**
   * searchTools Function
   * 搜索工具
   */
  async searchTools(params: {
    query?: string;
    category?: string;
    pricingType?: string;
    modalities?: string[];
    limit?: number;
    offset?: number;
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const tools = await aigcRepository.searchTools(params);

      return {
        success: true,
        returnValue: {
          tools,
          total: tools.length,
          query: params
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: tools.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * getSimilarTools Function
   * 获取相似工具
   */
  async getSimilarTools(params: {
    toolSlug: string;
    limit?: number;
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const similarTools = await aigcRepository.getSimilarTools(params);

      return {
        success: true,
        returnValue: {
          referenceTool: params.toolSlug,
          similarTools,
          total: similarTools.length
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: similarTools.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * findCostEffectiveAlternatives Function
   * 寻找性价比替代
   */
  async findCostEffectiveAlternatives(params: {
    toolSlug: string;
    maxPrice?: number;
    limit?: number;
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const alternatives = await aigcRepository.findCostEffectiveAlternatives(params);

      // 计算节省金额
      const savings = alternatives.map(alt => ({
        tool: alt,
        savingAmount: 0,
        savingPercent: 0
      }));

      return {
        success: true,
        returnValue: {
          referenceTool: params.toolSlug,
          maxPrice: params.maxPrice,
          alternatives: savings,
          total: alternatives.length
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: alternatives.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * getToolDetails Function
   * 获取工具详情
   */
  async getToolDetails(slug: string): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const tool = await aigcRepository.getToolBySlug(slug);
      if (!tool) {
        return {
          success: false,
          error: 'Tool not found',
          executionTimeMs: Date.now() - startTime
        };
      }

      // 获取关联数据
      const links = await aigcRepository.getToolLinks(slug);

      return {
        success: true,
        returnValue: {
          ...tool,
          links
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: 1
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * incrementViewCount Function
   * 增加浏览数
   */
  async incrementViewCount(slug: string): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const tool = await aigcRepository.incrementViewCount(slug);

      return {
        success: true,
        returnValue: {
          slug,
          newViewCount: tool.viewCount
        },
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}

// =============================================================================
// Compare Service
// =============================================================================

export class CompareService {
  /**
   * compareTools Function
   * 多维度对比工具
   */
  async compareTools(params: {
    toolSlugs: string[];
    dimension?: 'all' | 'pricing' | 'capability' | 'performance' | 'reputation';
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      if (params.toolSlugs.length < 2) {
        return {
          success: false,
          error: 'Need at least 2 tools to compare',
          executionTimeMs: Date.now() - startTime
        };
      }

      const comparison = await aigcRepository.compareTools({
        toolSlugs: params.toolSlugs,
        dimension: params.dimension || 'all'
      });

      if (!comparison) {
        return {
          success: false,
          error: 'Tools not found',
          executionTimeMs: Date.now() - startTime
        };
      }

      // 记录对比会话
      // TODO: 保存到数据库

      // 增加工具对比计数
      await Promise.all(
        params.toolSlugs.map(slug => aigcRepository.incrementCompareCount(slug))
      );

      return {
        success: true,
        returnValue: comparison,
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: comparison.tools.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * generateComparisonReport Function
   * 生成对比报告
   */
  async generateComparisonReport(params: {
    toolSlugs: string[];
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      // 获取全面对比数据
      const fullComparison = await aigcRepository.compareTools({
        toolSlugs: params.toolSlugs,
        dimension: 'all'
      });

      if (!fullComparison) {
        return {
          success: false,
          error: 'Tools not found',
          executionTimeMs: Date.now() - startTime
        };
      }

      // 生成分析
      const report = {
        summary: this.generateSummary(fullComparison),
        pricingAnalysis: this.analyzePricing(fullComparison.pricing),
        capabilityAnalysis: this.analyzeCapabilities(fullComparison.capability),
        recommendation: this.generateRecommendation(fullComparison),
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        returnValue: {
          ...fullComparison,
          report
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: params.toolSlugs.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * 生成摘要
   */
  private generateSummary(comparison: any) {
    const tools = comparison.tools;

    return {
      totalTools: tools.length,
      pricingTypes: [...new Set(tools.map(t => t.pricingType))],
      avgRating: tools.reduce((sum, t) => sum + (t.averageRating || 0), 0) / tools.length,
      totalViews: tools.reduce((sum, t) => sum + (t.viewCount || 0), 0)
    };
  }

  /**
   * 分析定价
   */
  private analyzePricing(pricing: any) {
    const prices = pricing.startingPrice.filter((p: any) => p.value !== null);

    if (prices.length === 0) return null;

    const values = prices.map((p: any) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const cheapest = prices.find((p: any) => p.value === min);
    const mostExpensive = prices.find((p: any) => p.value === max);

    return {
      priceRange: { min, max, avg },
      cheapest: cheapest?.slug,
      mostExpensive: mostExpensive?.slug,
      savingOpportunity: max - min
    };
  }

  /**
   * 分析能力
   */
  private analyzeCapabilities(capability: any) {
    const allModalities = capability.modalities.flatMap((m: any) => m.value || []);
    const modalityCounts = allModalities.reduce((acc: any, mod: string) => {
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {});

    return {
      commonModalities: Object.entries(modalityCounts as Record<string, number>)
        .filter(([_, count]) => (count as number) > 1)
        .map(([mod]) => mod),
      uniqueModalities: Object.entries(modalityCounts as Record<string, number>)
        .filter(([_, count]) => (count as number) === 1)
        .map(([mod]) => mod)
    };
  }

  /**
   * 生成推荐
   */
  private generateRecommendation(comparison: any) {
    const tools = comparison.tools;

    // 基于评分的推荐
    const byRating = [...tools].sort((a, b) => 
      (b.averageRating || 0) - (a.averageRating || 0)
    );

    // 基于热度的推荐
    const byPopularity = [...tools].sort((a, b) => 
      (b.viewCount || 0) - (a.viewCount || 0)
    );

    // 基于价格的推荐
    const freeTools = tools.filter(t => t.pricingType === 'free');
    const cheapest = [...tools]
      .filter(t => t.startingPrice !== null)
      .sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0))[0];

    return {
      bestRating: byRating[0]?.slug,
      mostPopular: byPopularity[0]?.slug,
      bestFree: freeTools[0]?.slug,
      mostCostEffective: cheapest?.slug
    };
  }
}

// =============================================================================
// Review Service
// =============================================================================

export class ReviewService {
  /**
   * submitReview Function
   * 提交评价
   */
  async submitReview(params: {
    toolSlug: string;
    userName?: string;
    title: string;
    content: string;
    overallRating: number;
    pros?: string[];
    cons?: string[];
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      // 验证评分
      if (params.overallRating < 1 || params.overallRating > 5) {
        return {
          success: false,
          error: 'Rating must be between 1 and 5',
          executionTimeMs: Date.now() - startTime
        };
      }

      const review = await aigcRepository.createReview(params);

      return {
        success: true,
        returnValue: {
          reviewId: review.id,
          toolSlug: params.toolSlug,
          rating: params.overallRating,
          message: 'Review submitted successfully'
        },
        executionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * getToolReviews Function
   * 获取工具评价
   */
  async getToolReviews(params: {
    toolSlug: string;
    limit?: number;
    offset?: number;
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const reviews = await aigcRepository.getToolReviews(params.toolSlug, {
        limit: params.limit,
        offset: params.offset
      });

      if (!reviews) {
        return {
          success: false,
          error: 'Tool not found',
          executionTimeMs: Date.now() - startTime
        };
      }

      return {
        success: true,
        returnValue: {
          toolSlug: params.toolSlug,
          reviews,
          total: reviews.length
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: reviews.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}

// =============================================================================
// Trend Service
// =============================================================================

export class TrendService {
  /**
   * getTrends Function
   * 获取趋势数据
   */
  async getTrends(params: {
    toolSlugs: string[];
    days?: number;
  }): Promise<FunctionExecutionResult> {
    const startTime = Date.now();

    try {
      const trends = await Promise.all(
        params.toolSlugs.map(slug => 
          aigcRepository.getTrendMetrics(slug, params.days || 30)
        )
      );

      const trendsMap = params.toolSlugs.reduce((acc, slug, idx) => {
        acc[slug] = trends[idx];
        return acc;
      }, {} as any);

      return {
        success: true,
        returnValue: {
          toolSlugs: params.toolSlugs,
          days: params.days || 30,
          trends: trendsMap
        },
        executionTimeMs: Date.now() - startTime,
        objectsLoaded: params.toolSlugs.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}

// =============================================================================
// Export Service Instances
// =============================================================================

export const toolService = new ToolService();
export const compareService = new CompareService();
export const reviewService = new ReviewService();
export const trendService = new TrendService();
