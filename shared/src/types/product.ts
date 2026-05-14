// ============================================================
// Product Types - 产品相关类型
// ============================================================

export interface ProductCategory {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  rid?: string;
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  developer?: string;
  releaseDate?: string;
  pricingType: 'free' | 'freemium' | 'paid' | 'subscription';
  startingPrice?: number;
  currency: string;
  isFeatured: boolean;
  isVerified: boolean;
  viewCount: number;
  favoriteCount: number;
  compareCount: number;
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttribute {
  id: string;
  rid?: string;
  productId: string;
  categoryId: string;
  groupName: string;
  attributeKey: string;
  attributeLabel: string;
  attributeValue: string;
  valueType: 'text' | 'number' | 'boolean' | 'array' | 'url' | 'date';
  isHighlighted: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryTemplate {
  id: string;
  rid?: string;
  categoryId: string;
  name: string;
  attributeDefinitions: AttributeDefinition[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeDefinition {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

// 类别标识符
export const CATEGORY_API_NAMES = {
  AI_MODEL: 'ai-model',
  IDE: 'ide',
  IMAGE_GENERATOR: 'image-generator',
  PPT_TOOL: 'ppt-tool',
  WEBSITE: 'website',
} as const;

export type CategoryApiName =
  | typeof CATEGORY_API_NAMES.AI_MODEL
  | typeof CATEGORY_API_NAMES.IDE
  | typeof CATEGORY_API_NAMES.IMAGE_GENERATOR
  | typeof CATEGORY_API_NAMES.PPT_TOOL
  | typeof CATEGORY_API_NAMES.WEBSITE;

// 产品列表查询参数
export interface ProductListParams {
  category?: string;
  query?: string;
  filters?: ProductFilters;
  sortBy?: 'name' | 'price' | 'popularity' | 'recent';
  page?: number;
  pageSize?: number;
}

export interface ProductFilters {
  pricing?: ('free' | 'freemium' | 'paid' | 'subscription')[];
  platforms?: string[];
  features?: string[];
  providers?: string[];
}

// 产品对比项
export interface CompareItem {
  id: string;
  productId: string;
  product: Product;
  attributes: ProductAttribute[];
}
