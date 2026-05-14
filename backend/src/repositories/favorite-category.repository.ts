// ============================================================
// Favorite Category Repository - 收藏分类仓储
// ============================================================

import { BaseRepository, prisma } from './base.repository.js';

export interface CreateFavoriteCategoryInput {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isDefault?: boolean;
}

export interface UpdateFavoriteCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// Type assertion for accessing inherited methods
const _ = (repo: any) => repo;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export class FavoriteCategoryRepository extends BaseRepository<any, AnyRecord, AnyRecord> {
  constructor() {
    super(prisma, 'userFavoriteCategory');
  }

  async findByUserId(userId: string): Promise<any[]> {
    return _(this).findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async findByUserIdAndName(userId: string, name: string): Promise<any | null> {
    return _(this).findFirst({
      where: { userId, name },
    });
  }

  async getWithItemCount(id: string): Promise<any | null> {
    return _(this).findById(id);
  }

  async reorder(userId: string, categoryIds: string[]): Promise<void> {
    // TODO: userFavoriteCategory model does not exist in current schema
    // await prisma.$transaction(
    //   categoryIds.map((id, index) =>
    //     prisma.userFavoriteCategory.update({
    //       where: { id },
    //       data: { sortOrder: index },
    //     })
    //   )
    // );
  }

  async createDefaults(userId: string): Promise<any[]> {
    const defaults = [
      { name: '编程工具', icon: '💻', color: '#3B82F6', sortOrder: 0, isDefault: false },
      { name: 'AI 对话', icon: '💬', color: '#8B5CF6', sortOrder: 1, isDefault: false },
      { name: '文生图', icon: '🎨', color: '#EC4899', sortOrder: 2, isDefault: false },
      { name: 'PPT 创建', icon: '📊', color: '#F59E0B', sortOrder: 3, isDefault: false },
      { name: '个人工具', icon: '🛠️', color: '#10B981', sortOrder: 4, isDefault: false },
    ];

    // TODO: userFavoriteCategory model does not exist in current schema
    return [] as any;
    // return prisma.userFavoriteCategory.createMany({
    //   data: defaults.map((d) => ({ ...d, userId })),
    // }) as any;
  }

  protected prepareCreateData(data: AnyRecord): AnyRecord {
    return {
      ...data,
      icon: data.icon || '📁',
      color: data.color || '#6B7280',
      sortOrder: data.sortOrder || 0,
      isDefault: data.isDefault || false,
    };
  }
}

export const favoriteCategoryRepository = new FavoriteCategoryRepository();
