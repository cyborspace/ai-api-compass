// ============================================================
// Favorite Item Repository - 收藏项仓储
// ============================================================

import { BaseRepository, prisma } from './base.repository.js';

export interface CreateFavoriteItemInput {
  userId: string;
  categoryId: string;
  type: 'product' | 'custom';
  productId?: string;
  customTitle?: string;
  customUrl?: string;
  customDescription?: string;
  customIcon?: string;
  note?: string;
  sortOrder?: number;
}

export interface UpdateFavoriteItemInput {
  categoryId?: string;
  sortOrder?: number;
  note?: string;
}

// Type assertion for accessing inherited methods
const _ = (repo: any) => repo;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export class FavoriteItemRepository extends BaseRepository<any, AnyRecord, AnyRecord> {
  constructor() {
    super(prisma, 'favoriteItem');
  }

  async findByUserId(userId: string, options?: { categoryId?: string }): Promise<any[]> {
    const where: any = { userId };
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    return _(this).findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        category: true,
      },
    });
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<any | null> {
    return _(this).findFirst({
      where: { userId, productId, type: 'product' },
    });
  }

  async findByUserAndUrl(userId: string, customUrl: string): Promise<any | null> {
    return _(this).findFirst({
      where: { userId, customUrl, type: 'custom' },
    });
  }

  async findByCategory(categoryId: string): Promise<any[]> {
    return _(this).findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async toggle(
    userId: string,
    productId: string,
    categoryId: string
  ): Promise<{ favorited: boolean; item?: any }> {
    const existing = await this.findByUserAndProduct(userId, productId);

    if (existing) {
      await _(this).delete(existing.id);
      return { favorited: false };
    }

    const item = await _(this).create({
      userId,
      categoryId,
      type: 'product',
      productId,
    });
    return { favorited: true, item };
  }

  async move(itemId: string, newCategoryId: string): Promise<any> {
    return _(this).update(itemId, { categoryId: newCategoryId });
  }

  async reorder(categoryId: string, itemIds: string[]): Promise<void> {
    // TODO: favoriteItem model does not exist in current schema
    // await prisma.$transaction(
    //   itemIds.map((id, index) =>
    //     prisma.favoriteItem.update({
    //       where: { id },
    //       data: { sortOrder: index },
    //     })
    //   )
    // );
  }

  async getTotalCount(userId: string): Promise<number> {
    return _(this).count({ where: { userId } });
  }

  protected prepareCreateData(data: AnyRecord): AnyRecord {
    return {
      ...data,
      sortOrder: data.sortOrder || 0,
    };
  }
}

export const favoriteItemRepository = new FavoriteItemRepository();
