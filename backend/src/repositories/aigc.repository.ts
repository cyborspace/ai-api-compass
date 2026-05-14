/**
 * AIGC Repository
 * 
 * 基于 Ontology 的数据访问层
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

/**
 * Object 查询参数
 */
export interface ObjectQueryParams {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

/**
 * 工具视图类型
 */
export interface ToolView {
  rid: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  developer?: string;
  pricingType?: string;
  startingPrice?: number;
  supportedModalities?: string[];
  platform?: string[];
  viewCount?: number;
  favoriteCount?: number;
  compareCount?: number;
  averageRating?: number;
  isFeatured?: boolean;
  status?: string;
  createdAt?: Date;
  categoryLink?: any[];
  pricingPlans?: any[];
  capabilities?: any[];
  tagLinks?: any[];
}

// ============================================================================
// AIGC Repository
// ============================================================================

export class AIGCToolRepository {
  private async getAIGCToolTypeId(): Promise<string | null> {
    const type = await prisma.object_types.findFirst({ where: { apiName: 'AIGCTool' } });
    if (!type) return null;

    const objectsWithType = await prisma.objects.findFirst({
      where: { objectTypeId: type.rid },
      select: { objectTypeId: true }
    });

    if (objectsWithType) return type.rid;

    const objectsWithApiName = await prisma.objects.findFirst({
      where: { objectTypeId: 'AIGCTool' },
      select: { objectTypeId: true }
    });

    if (objectsWithApiName) return 'AIGCTool';

    return type.rid;
  }

  private transformObjectToTool(obj: any): ToolView {
    const props = (obj.properties || {}) as Record<string, any>;
    return {
      rid: obj.rid,
      slug: props.slug,
      name: props.name,
      tagline: props.tagline,
      description: props.description,
      logoUrl: props.logoUrl,
      websiteUrl: props.websiteUrl,
      developer: props.developer,
      pricingType: props.pricingType || props.pricingModel,
      startingPrice: props.startingPrice,
      supportedModalities: props.supportedModalities || props.modalities || [],
      platform: props.platform || props.platforms || [],
      viewCount: props.viewCount || 0,
      favoriteCount: props.favoriteCount || 0,
      compareCount: props.compareCount || 0,
      averageRating: props.averageRating,
      isFeatured: props.isFeatured || false,
      status: props.status || 'active',
      createdAt: obj.createdAt,
      categoryLink: props.categoryLink || obj.categoryLink,
      pricingPlans: props.pricingPlans || obj.pricingPlans,
      capabilities: props.capabilities || props.modalities || props.supportedModalities || [],
      tagLinks: props.tagLinks || obj.tagLinks,
    };
  }

  /**
   * 获取所有工具
   */
  async getTools(params: ObjectQueryParams = {}): Promise<ToolView[]> {
    const { limit = 20, offset = 0, orderBy = { createdAt: 'desc' } } = params;

    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return [];

    const objects = await prisma.objects.findMany({
      where: { objectTypeId: toolTypeId },
      take: limit,
      skip: offset,
      orderBy,
    });

    return objects.map(obj => this.transformObjectToTool(obj));
  }

  /**
   * 根据 slug 获取工具
   */
  async getToolBySlug(slug: string): Promise<ToolView | null> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return null;

    const obj = await prisma.objects.findFirst({
      where: {
        objectTypeId: toolTypeId,
        properties: { path: ['slug'], equals: slug }
      }
    });

    if (!obj) return null;
    return this.transformObjectToTool(obj);
  }

  /**
   * 根据 rid 获取工具
   */
  async getToolByRid(rid: string): Promise<ToolView | null> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return null;

    const obj = await prisma.objects.findFirst({
      where: {
        objectTypeId: toolTypeId,
        rid
      }
    });

    if (!obj) return null;
    return this.transformObjectToTool(obj);
  }

  /**
   * 搜索工具
   */
  async searchTools(params: {
    query?: string;
    category?: string;
    pricingType?: string;
    modalities?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ToolView[]> {
    const { query, category, pricingType, modalities, limit = 20, offset = 0 } = params;

    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return [];

    const where: any = { objectTypeId: toolTypeId };

    if (query) {
      where.AND = where.AND || [];
      (where.AND as any[]).push({
        OR: [
          { properties: { path: ['name'], string_contains: query } },
          { properties: { path: ['description'], string_contains: query } },
          { properties: { path: ['developer'], string_contains: query } }
        ]
      });
    }

    if (pricingType) {
      where.AND = where.AND || [];
      (where.AND as any[]).push({
        properties: { path: ['pricingType'], equals: pricingType }
      });
    }

    const objects = await prisma.objects.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    return objects.map(obj => this.transformObjectToTool(obj));
  }

  /**
   * 获取热门工具
   */
  async getHotTools(limit: number = 10): Promise<ToolView[]> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return [];

    const objects = await prisma.objects.findMany({
      where: { objectTypeId: toolTypeId },
      take: limit * 2,
    });

    const tools = objects.map(obj => this.transformObjectToTool(obj));
    tools.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    return tools.slice(0, limit);
  }

  /**
   * 获取精选工具
   */
  async getFeaturedTools(limit: number = 10): Promise<ToolView[]> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return [];

    const objects = await prisma.objects.findMany({
      where: { objectTypeId: toolTypeId },
      take: limit * 2,
    });

    const tools = objects.map(obj => this.transformObjectToTool(obj));
    const featuredTools = tools.filter(t => t.isFeatured);
    return featuredTools.slice(0, limit);
  }

  /**
   * 获取最新工具
   */
  async getLatestTools(limit: number = 10): Promise<ToolView[]> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return [];

    const objects = await prisma.objects.findMany({
      where: { objectTypeId: toolTypeId },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return objects.map(obj => this.transformObjectToTool(obj));
  }

  /**
   * 获取工具数量
   */
  async getToolCount(): Promise<number> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return 0;

    return prisma.objects.count({ where: { objectTypeId: toolTypeId } });
  }

  /**
   * 增加浏览数
   */
  async incrementViewCount(slug: string): Promise<{ viewCount: number }> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return { viewCount: 0 };

    const obj = await prisma.objects.findFirst({
      where: {
        objectTypeId: toolTypeId,
        properties: { path: ['slug'], equals: slug }
      }
    });

    if (obj) {
      const props = obj.properties as Record<string, any>;
      const currentCount = (props?.viewCount as number) || 0;
      const newCount = currentCount + 1;
      await prisma.objects.update({
        where: { id: obj.id },
        data: { properties: { ...props, viewCount: newCount } as any }
      });
      return { viewCount: newCount };
    }
    return { viewCount: 0 };
  }

  /**
   * 增加收藏数
   */
  async incrementFavoriteCount(slug: string): Promise<void> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return;

    const obj = await prisma.objects.findFirst({
      where: {
        objectTypeId: toolTypeId,
        properties: { path: ['slug'], equals: slug }
      }
    });

    if (obj) {
      const props = obj.properties as Record<string, any>;
      const currentCount = (props?.favoriteCount as number) || 0;
      await prisma.objects.update({
        where: { id: obj.id },
        data: { properties: { ...props, favoriteCount: currentCount + 1 } as any }
      });
    }
  }

  /**
   * 增加对比数
   */
  async incrementCompareCount(slug: string): Promise<void> {
    const toolTypeId = await this.getAIGCToolTypeId();
    if (!toolTypeId) return;

    const obj = await prisma.objects.findFirst({
      where: {
        objectTypeId: toolTypeId,
        properties: { path: ['slug'], equals: slug }
      }
    });

    if (obj) {
      const props = obj.properties as Record<string, any>;
      const currentCount = (props?.compareCount as number) || 0;
      await prisma.objects.update({
        where: { id: obj.id },
        data: { properties: { ...props, compareCount: currentCount + 1 } as any }
      });
    }
  }

  // Stub methods for service compatibility
  async getSimilarTools(params: { toolSlug: string; limit?: number }): Promise<ToolView[]> {
    const tool = await this.getToolBySlug(params.toolSlug);
    if (!tool) return [];
    const allTools = await this.getTools({ limit: 100 });
    return allTools.filter(t => t.slug !== params.toolSlug).slice(0, params.limit || 5);
  }

  async findCostEffectiveAlternatives(params: { toolSlug: string; maxPrice?: number; limit?: number }): Promise<ToolView[]> {
    const allTools = await this.getTools({ limit: 100 });
    return allTools.filter(t => {
      if (t.slug === params.toolSlug) return false;
      if (params.maxPrice && t.startingPrice && t.startingPrice > params.maxPrice) return false;
      return t.pricingType === 'free' || (t.startingPrice || 0) < (params.maxPrice || Infinity);
    }).slice(0, params.limit || 5);
  }

  async getToolLinks(slug: string): Promise<any[]> {
    return [];
  }

  async compareTools(params: { toolSlugs: string[]; dimension?: string }): Promise<any> {
    const tools = await Promise.all(params.toolSlugs.map(s => this.getToolBySlug(s)));
    const validTools = tools.filter(Boolean) as ToolView[];
    return {
      tools: validTools,
      pricing: { startingPrice: validTools.map(t => ({ slug: t.slug, value: t.startingPrice })) },
      capability: { modalities: validTools.map(t => ({ slug: t.slug, value: t.supportedModalities })) },
    };
  }

  async createReview(params: any): Promise<any> {
    return { id: crypto.randomUUID(), ...params };
  }

  async getToolReviews(toolSlug: string, options?: ObjectQueryParams): Promise<any[]> {
    return [];
  }

  async getTrendMetrics(slug: string, days: number): Promise<any> {
    return { slug, days, views: 0, favorites: 0 };
  }
}

export const aigcRepository = new AIGCToolRepository();

export default AIGCToolRepository;
