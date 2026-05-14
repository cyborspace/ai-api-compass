// ============================================================
// Compare Types - 对比相关类型
// ============================================================

import type { Product, ProductAttribute } from './product';

export interface CompareSession {
  id: string;
  rid?: string;
  userId: string;
  categoryId?: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  completedAt?: string;
  items?: CompareItem[];
}

export interface CompareItem {
  id: string;
  rid?: string;
  compareSessionId: string;
  productId: string;
  product?: Product;
  attributes?: ProductAttribute[];
  sortOrder: number;
  createdAt: string;
}

export interface CreateCompareSessionParams {
  categoryId?: string;
}

export interface AddCompareItemParams {
  sessionId: string;
  productId: string;
}

export interface CostCalculation {
  id: string;
  rid?: string;
  userId: string;
  productRids: string[];
  inputTokens: number;
  outputTokens: number;
  monthlyQueries?: number;
  results: CostResult[];
  createdAt: string;
}

export interface CostResult {
  productId: string;
  productName: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  monthlyCost?: number;
}

export interface CalculateCostParams {
  productRids: string[];
  inputTokens: number;
  outputTokens: number;
  monthlyQueries?: number;
}
