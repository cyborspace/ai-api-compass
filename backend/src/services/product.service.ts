// ============================================================
// Product Service - 产品服务
// ============================================================

import { productRepository, ProductFilters } from '../repositories/product.repository.js';
import { prisma } from '../repositories/base.repository.js';

// Type cast for repository methods not recognized by TypeScript
const repo = productRepository as any;

export interface ProductListResult {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ProductService {
  async getProducts(params: {
    category?: string;
    query?: string;
    filters?: ProductFilters;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<ProductListResult> {
    const {
      category,
      query,
      filters = {},
      page = 1,
      pageSize = 20,
      sortBy = 'name',
      order = 'asc',
    } = params;

    let products: any[];
    let total: number;

    if (query) {
      const result = await repo.search(query, { ...filters, categoryId: category }, { page, pageSize });
      products = result.products;
      total = result.total;
    } else if (category) {
      const result = await repo.findByCategory(category, { page, pageSize, sortBy, order });
      products = result.products;
      total = result.total;
    } else {
      products = await repo.findMany({
        where: { status: 'active', ...filters },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true },
      });
      total = await repo.count({ where: { status: 'active' } });
    }

    return {
      items: products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getProductBySlug(slug: string): Promise<any | null> {
    const product = await repo.findBySlug(slug);
    if (product) {
      await repo.incrementViewCount(product.id);
    }
    return product;
  }

  async getProductById(id: string): Promise<any | null> {
    return repo.findById(id);
  }

  async getFeaturedProducts(limit: number = 10): Promise<any[]> {
    return repo.getFeatured(limit);
  }

  async getProductsByCategory(categoryId: string, page: number = 1, pageSize: number = 20): Promise<ProductListResult> {
    const result = await repo.findByCategory(categoryId, { page, pageSize });
    return {
      items: result.products,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async createProduct(data: {
    categoryId: string;
    name: string;
    slug: string;
    logoUrl?: string;
    websiteUrl?: string;
    description?: string;
    developer?: string;
    pricingType?: string;
    startingPrice?: number;
  }): Promise<any> {
    return repo.create(data);
  }

  async updateProduct(id: string, data: Partial<{
    name: string;
    slug: string;
    logoUrl: string;
    websiteUrl: string;
    description: string;
    developer: string;
    pricingType: string;
    startingPrice: number;
    status: string;
  }>): Promise<any> {
    return repo.update(id, data);
  }

  async getCategories(): Promise<any[]> {
    return prisma.object_types.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
    });
  }

  async getCategoryByApiName(apiName: string): Promise<any | null> {
    return prisma.object_types.findUnique({
      where: { apiName },
    });
  }

  async getProductAttributes(productId: string): Promise<any[]> {
    return prisma.object_properties.findMany({
      where: { objectId: productId },
      orderBy: [
        { prop_name: 'asc' },
      ],
    });
  }

  async getProductsByIds(ids: string[]): Promise<any[]> {
    return repo.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    });
  }
}

export const productService = new ProductService();
