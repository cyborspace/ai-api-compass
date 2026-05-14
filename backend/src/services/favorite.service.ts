// ============================================================
// Favorite Service - 收藏服务
// ============================================================

import { favoriteItemRepository } from '../repositories/favorite-item.repository.js';
import { favoriteCategoryRepository } from '../repositories/favorite-category.repository.js';
import { productRepository } from '../repositories/product.repository.js';

// Type cast for repository methods not recognized by TypeScript
const categoryRepo = favoriteCategoryRepository as any;
const itemRepo = favoriteItemRepository as any;
const productRepo = productRepository as any;

export class FavoriteService {
  async getCategories(userId: string): Promise<any[]> {
    return categoryRepo.findByUserId(userId);
  }

  async getCategoryById(id: string): Promise<any | null> {
    return categoryRepo.findById(id);
  }

  async createCategory(userId: string, data: {
    name: string;
    icon?: string;
    color?: string;
  }): Promise<any> {
    return categoryRepo.create({ userId, ...data });
  }

  async updateCategory(id: string, data: any): Promise<any> {
    return categoryRepo.update(id, data);
  }

  async deleteCategory(id: string): Promise<any> {
    return categoryRepo.delete(id);
  }

  async reorderCategories(userId: string, categoryIds: string[]): Promise<void> {
    await categoryRepo.reorder(userId, categoryIds);
  }

  async initDefaultCategories(userId: string): Promise<any[]> {
    return categoryRepo.createDefaults(userId);
  }

  async getItems(userId: string, categoryId?: string): Promise<any[]> {
    return itemRepo.findByUserId(userId, { categoryId });
  }

  async getItemsByCategory(categoryId: string): Promise<any[]> {
    return itemRepo.findByCategory(categoryId);
  }

  async addProductToFavorites(userId: string, productId: string, categoryId: string): Promise<any> {
    const product = await productRepo.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const existing = await itemRepo.findByUserAndProduct(userId, productId);
    if (existing) {
      return existing;
    }

    const item = await itemRepo.create({
      userId,
      categoryId,
      type: 'product',
      productId,
    });

    await productRepo.incrementFavoriteCount(productId, 1);
    return item;
  }

  async addCustomLink(userId: string, categoryId: string, data: {
    customTitle: string;
    customUrl: string;
    customDescription?: string;
    customIcon?: string;
    note?: string;
  }): Promise<any> {
    return itemRepo.create({
      userId,
      categoryId,
      type: 'custom',
      customTitle: data.customTitle,
      customUrl: data.customUrl,
      customDescription: data.customDescription,
      customIcon: data.customIcon,
      note: data.note,
    });
  }

  async updateItem(itemId: string, data: any): Promise<any> {
    return itemRepo.update(itemId, data);
  }

  async removeItem(itemId: string): Promise<any> {
    const item = await itemRepo.findById(itemId);
    if (item?.productId) {
      await productRepo.incrementFavoriteCount(item.productId, -1);
    }
    return itemRepo.delete(itemId);
  }

  async toggleFavorite(userId: string, productId: string, categoryId: string): Promise<{ favorited: boolean; item?: any }> {
    const result = await itemRepo.toggle(userId, productId, categoryId);

    await productRepo.incrementFavoriteCount(productId, result.favorited ? 1 : -1);
    return result;
  }

  async moveItem(itemId: string, newCategoryId: string): Promise<any> {
    return itemRepo.move(itemId, newCategoryId);
  }

  async reorderItems(categoryId: string, itemIds: string[]): Promise<void> {
    await itemRepo.reorder(categoryId, itemIds);
  }

  async getTotalCount(userId: string): Promise<number> {
    return itemRepo.getTotalCount(userId);
  }
}

export const favoriteService = new FavoriteService();
