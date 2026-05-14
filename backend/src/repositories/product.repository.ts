// ============================================================
// Product Repository - 产品仓储
// ============================================================

import { BaseRepository, prisma } from './base.repository.js';
import { Prisma } from '@prisma/client';

export interface ProductFilters {
  categoryId?: string;
  pricingType?: string[];
  search?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  status?: string;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  developer?: string;
  releaseDate?: Date;
  pricingType?: string;
  startingPrice?: number;
  currency?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  status?: string;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  developer?: string;
  releaseDate?: Date;
  pricingType?: string;
  startingPrice?: number;
  currency?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  status?: string;
}

// Type assertion for accessing inherited methods
const _ = (repo: any) => repo;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export class ProductRepository extends BaseRepository<any, AnyRecord, AnyRecord> {
  constructor() {
    super(prisma, 'product');
  }

  async findBySlug(slug: string): Promise<any | null> {
    return _(this).findFirst({
      where: { slug },
      include: {
        category: true,
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findByCategory(
    categoryId: string,
    options?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<{ products: any[]; total: number }> {
    const { page = 1, pageSize = 20, sortBy = 'name', order = 'asc' } = options || {};

    const where = { categoryId };
    const orderBy = { [sortBy]: order };

    const [products, total] = await Promise.all([
      _(this).findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          attributes: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      _(this).count({ where }),
    ]);

    return { products, total };
  }

  async search(
    query: string,
    filters?: ProductFilters,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ products: any[]; total: number }> {
    const { page = 1, pageSize = 20 } = options || {};

    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { developer: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.pricingType?.length) {
      where.pricingType = { in: filters.pricingType };
    }

    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [products, total] = await Promise.all([
      _(this).findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { viewCount: 'desc' },
        include: {
          category: true,
        },
      }),
      _(this).count({ where }),
    ]);

    return { products, total };
  }

  async incrementViewCount(id: string): Promise<void> {
    await prisma.objects.update({
      where: { id },
      data: { properties: { viewCount: { increment: 1 } } },
    });
  }

  async incrementFavoriteCount(id: string, increment: number = 1): Promise<void> {
    await prisma.objects.update({
      where: { id },
      data: { properties: { favoriteCount: { increment } } },
    });
  }

  async incrementCompareCount(id: string, increment: number = 1): Promise<void> {
    await prisma.objects.update({
      where: { id },
      data: { properties: { compareCount: { increment } } },
    });
  }

  async getFeatured(limit: number = 10): Promise<any[]> {
    return _(this).findMany({
      where: { isFeatured: true, status: 'active' },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: { category: true },
    });
  }

  protected prepareCreateData(data: AnyRecord): AnyRecord {
    return {
      ...data,
      slug: data.slug || this.generateSlug(data.name),
      currency: data.currency || 'USD',
      pricingType: data.pricingType || 'free',
      status: data.status || 'active',
      viewCount: 0,
      favoriteCount: 0,
      compareCount: 0,
      isFeatured: data.isFeatured || false,
      isVerified: data.isVerified || false,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const productRepository = new ProductRepository();
