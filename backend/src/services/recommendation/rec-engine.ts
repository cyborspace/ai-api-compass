/**
 * Recommendation Engine
 * 
 * 个性化推荐引擎核心服务
 * 
 * 功能:
 * - 基于热度的推荐
 * - 基于场景的推荐
 * - 相似工具推荐
 * - 混合推荐策略
 */

import { PrismaClient } from '@prisma/client';
import { aigcRepository } from '../../repositories/aigc.repository.js';
import { ScenarioMatcher, ScenarioMatchResult, PRESET_SCENARIOS } from './scenario-match.js';

// =============================================================================
// Types & Interfaces
// =============================================================================

/** 推荐场景类型 */
export type RecommendationScene = 'home' | 'search' | 'scenario' | 'similar';

/** 推荐结果项 */
export interface RecommendationItem {
  tool: any;
  score: number;
  reasons: string[];
  matchDetails: {
    heatScore?: number;
    scenarioMatch?: number;
    similarityScore?: number;
    categoryMatch?: boolean;
    pricingMatch?: boolean;
  };
}

/** 推荐结果 */
export interface RecommendationResult {
  success: boolean;
  scene: RecommendationScene;
  items: RecommendationItem[];
  metadata: {
    total: number;
    generatedAt: string;
    algorithm: string;
    params: Record<string, any>;
  };
  error?: string;
}

/** 首页推荐参数 */
export interface HomeRecommendationParams {
  limit?: number;
  offset?: number;
  mixRatio?: {
    hot: number;      // 热门工具比例
    rising: number;   // 新兴工具比例
    featured: number; // 精选工具比例
  };
}

/** 搜索推荐参数 */
export interface SearchRecommendationParams {
  query: string;
  category?: string;
  limit?: number;
  relevanceWeight?: number;  // 相关度权重
  heatWeight?: number;       // 热度权重
}

/** 场景推荐参数 */
export interface ScenarioRecommendationParams {
  scenario: string;
  description?: string;
  constraints?: {
    maxPrice?: number;
    modalities?: string[];
    platform?: string;
    region?: string;
  };
  limit?: number;
}

/** 相似工具推荐参数 */
export interface SimilarToolsParams {
  toolRid: string;
  limit?: number;
  includeReasons?: boolean;
}

/** 推荐算法配置 */
export interface RecommendationConfig {
  maxResults: number;
  minScore: number;
  diversifyResults: boolean;
  diversificationFactor: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: RecommendationConfig = {
  maxResults: 20,
  minScore: 0.03,
  diversifyResults: true,
  diversificationFactor: 0.3,
};

const DEFAULT_MIX_RATIO = {
  hot: 0.5,
  rising: 0.3,
  featured: 0.2,
};

// =============================================================================
// Recommendation Engine Class
// =============================================================================

export class RecommendationEngine {
  private prisma: PrismaClient;
  private scenarioMatcher: ScenarioMatcher;
  private config: RecommendationConfig;

  constructor(prisma: PrismaClient, config?: Partial<RecommendationConfig>) {
    this.prisma = prisma;
    this.scenarioMatcher = new ScenarioMatcher();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // Public Methods - Main Recommendation Endpoints
  // ===========================================================================

  /**
   * 首页推荐
   * 混合热门工具、新兴工具和精选工具
   */
  async getHomeRecommendations(params: HomeRecommendationParams = {}): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { limit = 20, offset = 0, mixRatio = DEFAULT_MIX_RATIO } = params;

    try {
      const [hotTools, risingTools, featuredTools] = await Promise.all([
        this.getHotTools(Math.ceil(limit * mixRatio.hot) + 10),
        this.getRisingTools(Math.ceil(limit * mixRatio.rising) + 10),
        this.getFeaturedTools(Math.ceil(limit * mixRatio.featured) + 10),
      ]);

      const mixedItems = this.mixRecommendations(
        hotTools,
        risingTools,
        featuredTools,
        mixRatio,
        limit
      );

      const diversifiedItems = this.diversifyResults(mixedItems);

      return {
        success: true,
        scene: 'home',
        items: diversifiedItems.slice(offset, offset + limit),
        metadata: {
          total: diversifiedItems.length,
          generatedAt: new Date().toISOString(),
          algorithm: 'home-mixed-recommendation',
          params: { mixRatio, limit, offset },
        },
      };
    } catch (error) {
      return {
        success: false,
        scene: 'home',
        items: [],
        metadata: {
          total: 0,
          generatedAt: new Date().toISOString(),
          algorithm: 'home-mixed-recommendation',
          params: params,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 搜索推荐
   * 结合相关度和热度进行推荐
   */
  async getSearchRecommendations(params: SearchRecommendationParams): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { query, category, limit = 20, relevanceWeight = 0.6, heatWeight = 0.4 } = params;

    try {
      const searchResults = await aigcRepository.searchTools({
        query,
        category,
        limit: limit * 3,
      });

      const toolRids = searchResults.map(t => t.rid).filter(Boolean);
      const heatScores = await this.getHeatScores(toolRids);

      const items: RecommendationItem[] = searchResults.map(tool => {
        const relevanceScore = this.calculateRelevanceScore(tool, query);
        const heatScore = heatScores.get(tool.rid) || 0;
        const combinedScore = relevanceScore * relevanceWeight + (heatScore / 100) * heatWeight;

        return {
          tool,
          score: combinedScore,
          reasons: this.generateSearchReasons(tool, query, relevanceScore, heatScore),
          matchDetails: {
            heatScore,
            scenarioMatch: relevanceScore,
          },
        };
      });

      items.sort((a, b) => b.score - a.score);

      return {
        success: true,
        scene: 'search',
        items: items.slice(0, limit),
        metadata: {
          total: items.length,
          generatedAt: new Date().toISOString(),
          algorithm: 'search-relevance-heat',
          params: { query, relevanceWeight, heatWeight },
        },
      };
    } catch (error) {
      return {
        success: false,
        scene: 'search',
        items: [],
        metadata: {
          total: 0,
          generatedAt: new Date().toISOString(),
          algorithm: 'search-relevance-heat',
          params: params,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 场景推荐
   * 根据用户场景描述匹配推荐工具
   */
  async getScenarioRecommendations(params: ScenarioRecommendationParams): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { scenario, description, constraints, limit = 10 } = params;

    try {
      const scenarioMatch = await this.scenarioMatcher.matchScenario(scenario, description);
      const allTools = await aigcRepository.getTools({ limit: 200 });

      const items: RecommendationItem[] = [];

      for (const tool of allTools) {
        const matchResult = this.calculateScenarioMatchScore(tool, scenarioMatch, constraints);

        if (matchResult.score > this.config.minScore) {
          items.push({
            tool,
            score: matchResult.score,
            reasons: matchResult.reasons,
            matchDetails: {
              scenarioMatch: matchResult.score,
              categoryMatch: matchResult.categoryMatch,
              pricingMatch: matchResult.pricingMatch,
            },
          });
        }
      }

      items.sort((a, b) => b.score - a.score);
      const diversifiedItems = this.diversifyResults(items);

      return {
        success: true,
        scene: 'scenario',
        items: diversifiedItems.slice(0, limit),
        metadata: {
          total: items.length,
          generatedAt: new Date().toISOString(),
          algorithm: 'scenario-matching',
          params: { scenario, constraints },
        },
      };
    } catch (error) {
      return {
        success: false,
        scene: 'scenario',
        items: [],
        metadata: {
          total: 0,
          generatedAt: new Date().toISOString(),
          algorithm: 'scenario-matching',
          params: params,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 相似工具推荐
   * 基于类别、属性相似度推荐
   */
  async getSimilarTools(params: SimilarToolsParams): Promise<RecommendationResult> {
    const startTime = Date.now();
    const { toolRid, limit = 5, includeReasons = true } = params;

    try {
      const currentTool = await aigcRepository.getToolByRid(toolRid);
      if (!currentTool) {
        return {
          success: false,
          scene: 'similar',
          items: [],
          metadata: {
            total: 0,
            generatedAt: new Date().toISOString(),
            algorithm: 'similarity-based',
            params: params,
          },
          error: 'Tool not found',
        };
      }

      const similarTools = await this.findSimilarTools(currentTool, limit * 3);

      const items: RecommendationItem[] = similarTools.map(tool => {
        const similarity = this.calculateSimilarity(currentTool, tool);
        return {
          tool,
          score: similarity.score,
          reasons: includeReasons ? similarity.reasons : [],
          matchDetails: {
            similarityScore: similarity.score,
            categoryMatch: similarity.categoryMatch,
          },
        };
      });

      items.sort((a, b) => b.score - a.score);

      return {
        success: true,
        scene: 'similar',
        items: items.slice(0, limit),
        metadata: {
          total: items.length,
          generatedAt: new Date().toISOString(),
          algorithm: 'similarity-based',
          params: { toolRid, limit },
        },
      };
    } catch (error) {
      return {
        success: false,
        scene: 'similar',
        items: [],
        metadata: {
          total: 0,
          generatedAt: new Date().toISOString(),
          algorithm: 'similarity-based',
          params: params,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===========================================================================
  // Private Methods - Helper Functions
  // ===========================================================================

  /**
   * 获取热门工具
   */
  private async getHotTools(limit: number): Promise<RecommendationItem[]> {
    const tools = await aigcRepository.getHotTools(limit);

    return tools.map(tool => ({
      tool,
      score: this.normalizeViewCount(tool.viewCount || 0),
      reasons: ['热门工具', `浏览量 ${(tool.viewCount || 0).toLocaleString()}`],
      matchDetails: { heatScore: this.normalizeViewCount(tool.viewCount || 0) },
    }));
  }

  /**
   * 获取新兴工具（趋势上升）
   */
  private async getRisingTools(limit: number): Promise<RecommendationItem[]> {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tools = await aigcRepository.getLatestTools(limit);

    const recentTools = tools.filter(tool => {
      const createdAt = tool.createdAt;
      return createdAt && createdAt >= recentDate;
    });

    return recentTools.map(tool => ({
      tool,
      score: 0.7,
      reasons: ['新兴工具', '最近上线'],
      matchDetails: { heatScore: 0.7 },
    }));
  }

  /**
   * 获取精选工具
   */
  private async getFeaturedTools(limit: number): Promise<RecommendationItem[]> {
    const tools = await aigcRepository.getFeaturedTools(limit);

    return tools.map(tool => ({
      tool,
      score: 0.85,
      reasons: ['精选推荐', '官方推荐'],
      matchDetails: { heatScore: 0.85 },
    }));
  }

  /**
   * 混合推荐结果
   */
  private mixRecommendations(
    hotItems: RecommendationItem[],
    risingItems: RecommendationItem[],
    featuredItems: RecommendationItem[],
    mixRatio: { hot: number; rising: number; featured: number },
    limit: number
  ): RecommendationItem[] {
    const result: RecommendationItem[] = [];
    const usedRids = new Set<string>();

    let hotIdx = 0, risingIdx = 0, featuredIdx = 0;
    const hotCount = Math.ceil(limit * mixRatio.hot);
    const risingCount = Math.ceil(limit * mixRatio.rising);
    const featuredCount = Math.ceil(limit * mixRatio.featured);

    while (featuredIdx < featuredItems.length && result.filter(i => i.reasons.includes('精选推荐')).length < featuredCount) {
      const item = featuredItems[featuredIdx++];
      if (!usedRids.has(item.tool.rid)) {
        result.push(item);
        usedRids.add(item.tool.rid);
      }
    }

    while (hotIdx < hotItems.length && result.filter(i => i.reasons.includes('热门工具')).length < hotCount) {
      const item = hotItems[hotIdx++];
      if (!usedRids.has(item.tool.rid)) {
        result.push(item);
        usedRids.add(item.tool.rid);
      }
    }

    while (risingIdx < risingItems.length && result.filter(i => i.reasons.includes('新兴工具')).length < risingCount) {
      const item = risingItems[risingIdx++];
      if (!usedRids.has(item.tool.rid)) {
        result.push(item);
        usedRids.add(item.tool.rid);
      }
    }

    return result;
  }

  /**
   * 多样化结果
   */
  private diversifyResults(items: RecommendationItem[]): RecommendationItem[] {
    if (!this.config.diversifyResults) return items;

    const result: RecommendationItem[] = [];
    const categoryCount = new Map<string, number>();
    const maxPerCategory = 3;

    for (const item of items) {
      const category = this.inferCategory(item.tool);
      const count = categoryCount.get(category) || 0;

      if (count < maxPerCategory) {
        result.push(item);
        categoryCount.set(category, count + 1);
      }
    }

    return result;
  }

  private inferCategory(tool: any): string {
    const caps = tool.capabilities || tool.supportedModalities || tool.modalities || [];
    if (caps.some((c: string) => c.toLowerCase().includes('code') || c.toLowerCase().includes('code_generation'))) {
      return 'code';
    }
    if (caps.some((c: string) => c.toLowerCase().includes('image') || c.toLowerCase().includes('image_generation'))) {
      return 'image';
    }
    if (caps.some((c: string) => c.toLowerCase().includes('video') || c.toLowerCase().includes('video_generation'))) {
      return 'video';
    }
    if (caps.some((c: string) => c.toLowerCase().includes('audio') || c.toLowerCase().includes('speech'))) {
      return 'audio';
    }
    if (caps.some((c: string) => c.toLowerCase().includes('text') || c.toLowerCase().includes('text_generation'))) {
      return 'text';
    }
    return tool.pricingType || 'other';
  }

  /**
   * 计算相关度得分
   */
  private calculateRelevanceScore(tool: any, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    if (tool.name?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }

    if (tool.description?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }

    if (tool.developer?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * 生成搜索推荐理由
   */
  private generateSearchReasons(
    tool: any,
    query: string,
    relevanceScore: number,
    heatScore: number
  ): string[] {
    const reasons: string[] = [];

    if (tool.name?.toLowerCase().includes(query.toLowerCase())) {
      reasons.push(`名称匹配 "${query}"`);
    }

    if (heatScore > 50) {
      reasons.push('热门工具');
    }

    if (tool.pricingType === 'free') {
      reasons.push('免费使用');
    }

    if (tool.averageRating && tool.averageRating > 4) {
      reasons.push(`高评分 ${tool.averageRating.toFixed(1)}`);
    }

    return reasons.length > 0 ? reasons : ['相关推荐'];
  }

  /**
   * 获取热度得分
   */
  private async getHeatScores(toolRids: string[]): Promise<Map<string, number>> {
    const heatMap = new Map<string, number>();

    if (toolRids.length === 0) return heatMap;

    const snapshots = await this.prisma.tool_heat_snapshots.findMany({
      where: {
        toolRid: { in: toolRids },
        period: '24h',
      },
    });

    for (const snapshot of snapshots) {
      heatMap.set(snapshot.toolRid, snapshot.heatScore);
    }

    for (const rid of toolRids) {
      if (!heatMap.has(rid)) {
        heatMap.set(rid, 0);
      }
    }

    return heatMap;
  }

  /**
   * 计算场景匹配得分
   */
  private calculateScenarioMatchScore(
    tool: any,
    scenarioMatch: ScenarioMatchResult,
    constraints?: ScenarioRecommendationParams['constraints']
  ): { score: number; reasons: string[]; categoryMatch: boolean; pricingMatch: boolean } {
    let score = 0;
    const reasons: string[] = [];
    let categoryMatch = false;
    let pricingMatch = false;

    const requiredCapabilities = scenarioMatch.requiredCapabilities || [];

    const allToolFeatures = [
      ...(tool.supportedModalities || []),
      ...(tool.modalities || []),
      ...(tool.capabilities || []),
      tool.description || '',
      tool.name || ''
    ];

    const matchedCapabilities = requiredCapabilities.filter(cap =>
      allToolFeatures.some((tc: string) => tc.toLowerCase().includes(cap.toLowerCase()))
    );

    if (matchedCapabilities.length > 0) {
      score += (matchedCapabilities.length / Math.max(requiredCapabilities.length, 1)) * 0.4;
      reasons.push(`支持 ${matchedCapabilities.join(', ')}`);
    } else if (requiredCapabilities.length === 0) {
      score += 0.15;
      reasons.push('通用推荐');
    } else {
      score += 0.05;
      reasons.push('相关性待验证');
    }

    if (constraints?.maxPrice) {
      const isFree = tool.pricingType === 'free' || tool.pricingType === 'freemium' || tool.pricingType === 'open_source';
      if (isFree || (tool.startingPrice && tool.startingPrice <= constraints.maxPrice)) {
        score += 0.2;
        pricingMatch = true;
        reasons.push('价格符合预算');
      }
    } else if (scenarioMatch.priceSensitive) {
      const isFree = tool.pricingType === 'free' || tool.pricingType === 'freemium' || tool.pricingType === 'open_source';
      if (isFree) {
        score += 0.2;
        pricingMatch = true;
        reasons.push('免费使用');
      } else if (tool.startingPrice && tool.startingPrice <= 20) {
        score += 0.1;
        pricingMatch = true;
        reasons.push('低价可用');
      }
    }

    if (tool.description && scenarioMatch.requiredCapabilities?.length) {
      const descMatchCount = scenarioMatch.requiredCapabilities.filter(cap =>
        tool.description?.toLowerCase().includes(cap.toLowerCase())
      ).length;
      if (descMatchCount > 0 && matchedCapabilities.length === 0) {
        score += 0.08;
        reasons.push('描述相关');
      }
    }

    if (constraints?.platform) {
      if (tool.platform?.includes(constraints.platform)) {
        score += 0.1;
        reasons.push('平台兼容');
      }
    }

    return { score, reasons, categoryMatch, pricingMatch };
  }

  /**
   * 查找相似工具
   */
  private async findSimilarTools(tool: any, limit: number): Promise<any[]> {
    const similarTools: any[] = [];

    if (similarTools.length < limit) {
      const allTools = await aigcRepository.getTools({ limit: limit * 2 });
      const categoryTools = allTools.filter(t => 
        t.slug !== tool.slug
      );
      similarTools.push(...categoryTools.slice(0, limit - similarTools.length));
    }

    return similarTools.slice(0, limit);
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(
    sourceTool: any,
    targetTool: any
  ): { score: number; reasons: string[]; categoryMatch: boolean } {
    let score = 0;
    const reasons: string[] = [];
    let categoryMatch = false;

    const sourceModalities = new Set(sourceTool.supportedModalities || []);
    const targetModalities = new Set(targetTool.supportedModalities || []);
    const commonModalities = [...sourceModalities].filter(m => targetModalities.has(m));

    if (commonModalities.length > 0) {
      const modalityScore = commonModalities.length / Math.max(sourceModalities.size, targetModalities.size, 1);
      score += modalityScore * 0.5;
      reasons.push(`支持 ${commonModalities.join(', ')}`);
    }

    if (sourceTool.pricingType === targetTool.pricingType) {
      score += 0.3;
      reasons.push('定价模式相同');
    }

    const sourcePlatforms = new Set(sourceTool.platform || []);
    const targetPlatforms = new Set(targetTool.platform || []);
    const commonPlatforms = [...sourcePlatforms].filter(p => targetPlatforms.has(p));

    if (commonPlatforms.length > 0) {
      score += 0.2;
    }

    return { score, reasons, categoryMatch };
  }

  /**
   * 通过 RID 获取工具
   */
  private async getToolByRid(rid: string): Promise<any | null> {
    return await aigcRepository.getToolByRid(rid);
  }

  /**
   * 归一化浏览量到 0-1
   */
  private normalizeViewCount(viewCount: number): number {
    if (viewCount === 0) return 0;
    return Math.min(1, Math.log10(viewCount + 1) / 5);
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

let recommendationEngineInstance: RecommendationEngine | null = null;

export function getRecommendationEngine(prisma: PrismaClient): RecommendationEngine {
  if (!recommendationEngineInstance) {
    recommendationEngineInstance = new RecommendationEngine(prisma);
  }
  return recommendationEngineInstance;
}

export default RecommendationEngine;
