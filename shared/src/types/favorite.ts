// ============================================================
// Favorite Types - 收藏相关类型
// ============================================================

export interface UserFavoriteCategory {
  id: string;
  rid?: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string;
  rid?: string;
  userId: string;
  categoryId: string;
  type: 'product' | 'custom';
  productId?: string;
  product?: import('./product').Product;
  customTitle?: string;
  customUrl?: string;
  customDescription?: string;
  customIcon?: string;
  sortOrder: number;
  note?: string;
  createdAt: string;
  category?: UserFavoriteCategory;
}

export interface CreateCategoryParams {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryParams {
  name?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface CreateFavoriteItemParams {
  categoryId: string;
  type: 'product' | 'custom';
  productId?: string;
  customTitle?: string;
  customUrl?: string;
  customDescription?: string;
  customIcon?: string;
  note?: string;
}

export interface UpdateFavoriteItemParams {
  categoryId?: string;
  sortOrder?: number;
  note?: string;
}

export interface MoveFavoriteItemParams {
  itemId: string;
  newCategoryId: string;
}

// 默认收藏分类
export const DEFAULT_FAVORITE_CATEGORIES: Omit<UserFavoriteCategory, 'id' | 'rid' | 'userId' | 'itemCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '编程工具',
    icon: '💻',
    color: '#3B82F6',
    sortOrder: 0,
    isDefault: false,
  },
  {
    name: 'AI 对话',
    icon: '💬',
    color: '#8B5CF6',
    sortOrder: 1,
    isDefault: false,
  },
  {
    name: '文生图',
    icon: '🎨',
    color: '#EC4899',
    sortOrder: 2,
    isDefault: false,
  },
  {
    name: 'PPT 创建',
    icon: '📊',
    color: '#F59E0B',
    sortOrder: 3,
    isDefault: false,
  },
  {
    name: '个人工具',
    icon: '🛠️',
    color: '#10B981',
    sortOrder: 4,
    isDefault: false,
  },
];
