// ============================================================
// Shared Types - 统一导出
// ============================================================

// Ontology Types
export * from './ontology';

// Product Types
export * from './product';

// User Types
export * from './user';

// Favorite Types
export * from './favorite';

// Compare Types
export * from './compare';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Search Types
export interface SearchHistory {
  id: string;
  rid?: string;
  userId: string;
  query: string;
  filters: Record<string, unknown>;
  resultCount: number;
  searchType: 'keyword' | 'ai-guided' | 'scenario';
  createdAt: string;
}

export interface SearchSession {
  id: string;
  rid?: string;
  userId: string;
  intent?: string;
  answers: SearchAnswer[];
  recommendedProductIds: string[];
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
  completedAt?: string;
}

export interface SearchAnswer {
  question: string;
  answer: string;
  selectedOption?: string;
}

// Recently Viewed
export interface RecentlyViewed {
  id: string;
  rid?: string;
  userId: string;
  productId: string;
  product?: import('./product').Product;
  viewedAt: string;
}

// Price Alert
export interface PriceAlert {
  id: string;
  rid?: string;
  userId: string;
  productId: string;
  product?: import('./product').Product;
  threshold: number;
  isActive: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
}

// Product Review
export interface ProductReview {
  id: string;
  rid?: string;
  productId: string;
  userId: string;
  user?: import('./user').User;
  rating: number;
  title?: string;
  content?: string;
  pros: string[];
  cons: string[];
  useCase?: string;
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Team Types
export interface Team {
  id: string;
  rid?: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  rid?: string;
  teamId: string;
  userId: string;
  user?: import('./user').User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

// API Key Types
export interface ApiKey {
  id: string;
  rid?: string;
  teamId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

// Usage Report
export interface UsageReport {
  id: string;
  rid?: string;
  teamId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  breakdown: {
    byModel?: Record<string, number>;
    byKey?: Record<string, number>;
    byDay?: Record<string, number>;
  };
  generatedAt: string;
}
