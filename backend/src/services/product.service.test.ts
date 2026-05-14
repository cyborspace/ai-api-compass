/**
 * Product Service Tests
 * 验证产品服务的核心功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from './product.service';

// Mock prisma with importOriginal to preserve other exports
vi.mock('../repositories/base.repository', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    prisma: {
      object_types: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      object_properties: {
        findMany: vi.fn(),
      },
    },
  };
});

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should query object_types instead of productCategory', async () => {
      const { prisma } = await import('../repositories/base.repository');
      const mockCategories = [
        { id: '1', apiName: 'AIGCTool', displayName: 'AI工具', status: 'active' },
      ];
      (prisma.object_types.findMany as any).mockResolvedValue(mockCategories);

      const result = await productService.getCategories();

      expect(prisma.object_types.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        orderBy: { displayName: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getCategoryByApiName', () => {
    it('should query object_types by apiName', async () => {
      const { prisma } = await import('../repositories/base.repository');
      const mockCategory = { id: '1', apiName: 'AIGCTool', displayName: 'AI工具' };
      (prisma.object_types.findUnique as any).mockResolvedValue(mockCategory);

      const result = await productService.getCategoryByApiName('AIGCTool');

      expect(prisma.object_types.findUnique).toHaveBeenCalledWith({
        where: { apiName: 'AIGCTool' },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('getProductAttributes', () => {
    it('should query object_properties instead of productAttribute', async () => {
      const { prisma } = await import('../repositories/base.repository');
      const mockAttributes = [
        { id: '1', objectId: 'tool-1', prop_name: 'name', prop_value: 'Test Tool' },
      ];
      (prisma.object_properties.findMany as any).mockResolvedValue(mockAttributes);

      const result = await productService.getProductAttributes('tool-1');

      expect(prisma.object_properties.findMany).toHaveBeenCalledWith({
        where: { objectId: 'tool-1' },
        orderBy: [{ prop_name: 'asc' }],
      });
      expect(result).toEqual(mockAttributes);
    });
  });
});
