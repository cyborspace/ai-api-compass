/**
 * API Types - 前端类型定义
 * 严格对应后端 API 返回的数据结构
 */

// =============================================================================
// Base Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

// =============================================================================
// AIGC Tool Types
// =============================================================================

export interface AIGCTool {
  rid: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  developer: string;
  websiteUrl?: string;
  logoUrl?: string;
  pricingType: string;
  startingPrice?: number;
  averageRating: number;
  viewCount: number;
  favoriteCount: number;
  compareCount: number;
  reviewCount: number;
  heatScore?: number;
  status: string;
  releaseDate?: string;
  lastUpdated?: string;
  categories: ToolCategory[];
  capabilities: string[];
  modalities?: string[];
  platforms?: string[];
  availableInChina?: boolean;
  hasApi?: boolean;
  hasWebInterface?: boolean;
  hasDesktopApp?: boolean;
  hasMobileApp?: boolean;
  technicalSpec?: TechnicalSpec;
  pricingPlans?: PricingPlan[];
  // 后端返回的扁平化属性
  inputPrice?: number;
  outputPrice?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  pricingModel?: string;
  apiDocsUrl?: string;
  openaiCompatible?: boolean;
}

export interface TechnicalSpec {
  rid?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  mmluScore?: number;
  humanEvalScore?: number;
  gsm8kScore?: number;
  multimodalSupport?: boolean;
  reasoningCapability?: boolean;
  codeGeneration?: boolean;
  toolUse?: boolean;
  ragSupport?: boolean;
  fineTuningSupport?: boolean;
  knowledgeCutoff?: string;
  languages?: string[];
}

export interface PricingPlan {
  rid?: string;
  name: string;
  description?: string;
  pricePerMonth?: number;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
  isFree: boolean;
  features?: string[];
}

export interface ToolCategory {
  rid: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  toolCount?: number;
}

// =============================================================================
// Ranking Types
// =============================================================================

export type RankingType = 'composite' | 'price_performance' | 'speed' | 'quality' | 'popularity' | 'rising';
export type PerspectiveType = 'default' | 'performance' | 'value' | 'community';

export interface ScoreBreakdownItem {
  score: number;
  weight: number;
  contribution: number;
}

export interface RankingEntry {
  rank: number;
  rid: string;
  name: string;
  slug: string;
  score: number;
  pricingModel: string;
  contextWindow: number;
  developer: string;
  capabilities: string[];
  averageRating: number;
  previousRank?: number;
  rankChange?: number;
  trend: 'up' | 'down' | 'stable' | 'new';
  dimensions?: Record<string, number>;
  breakdown?: Record<string, ScoreBreakdownItem>;
}

export interface RankingResult {
  type: RankingType;
  perspective: PerspectiveType;
  total: number;
  entries: RankingEntry[];
  updatedAt: string;
  weights: Record<string, number>;
  explanation: string[];
}

// =============================================================================
// Heat Types
// =============================================================================

export interface HeatSnapshot {
  rid: string;
  toolRid: string;
  toolSlug: string;
  toolName: string;
  period: string;
  viewCount: number;
  favoriteCount: number;
  compareCount: number;
  reviewCount: number;
  avgRating: number;
  heatScore: number;
  trend: 'up' | 'down' | 'stable' | 'rising' | 'falling';
  trendChange: number;
  recordedAt: string;
}

// =============================================================================
// Recommendation Types
// =============================================================================

export interface RecommendationItem {
  tool: AIGCTool;
  score: number;
  reasons: string[];
  matchedCapabilities: string[];
}

export interface RecommendationResult {
  success: boolean;
  items?: RecommendationItem[];
  total?: number;
  scenario?: string;
  error?: string;
}

export interface PresetScenario {
  rid: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  requiredCapabilities?: string[];
  constraints?: {
    maxPrice?: number;
    modalities?: string[];
    platform?: string;
    region?: string;
  };
}

// =============================================================================
// Rating Types
// =============================================================================

export interface UserRating {
  rid: string;
  toolRid: string;
  userRid?: string;
  overallRating: number;
  easeOfUseRating?: number;
  performanceRating?: number;
  valueRating?: number;
  reviewTitle?: string;
  reviewContent?: string;
  pros?: string[];
  cons?: string[];
  helpfulCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  toolRid: string;
  averageRating: number;
  totalRatings: number;
  distribution: Record<number, number>;
  averageEaseOfUse?: number;
  averagePerformance?: number;
  averageValue?: number;
}
