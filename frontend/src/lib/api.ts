/**
 * API Client - Palantir Ontology API
 * 所有数据请求统一通过此文件，严格对应后端 API
 */

import {
  type AIGCTool,
  type ToolCategory,
  type RankingResult,
  type RankingType,
  type PerspectiveType,
  type RecommendationResult,
  type PresetScenario,
  type RatingStats,
  type UserRating,
  type HeatSnapshot,
  type ApiResponse,
  type PaginatedResponse,
} from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// =============================================================================
// HTTP Client
// =============================================================================

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// AIGC Tools API
// =============================================================================

export async function fetchTools(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  categories?: string[];
  pricingTypes?: string[];
  capabilities?: string[];
  availableInChina?: boolean | null;
  sortBy?: string;
}): Promise<PaginatedResponse<AIGCTool>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.categories && params.categories.length > 0) {
    searchParams.set('categories', params.categories.join(','));
  }
  if (params?.pricingTypes && params.pricingTypes.length > 0) {
    searchParams.set('pricingTypes', params.pricingTypes.join(','));
  }
  if (params?.capabilities && params.capabilities.length > 0) {
    searchParams.set('capabilities', params.capabilities.join(','));
  }
  if (params?.availableInChina !== null && params?.availableInChina !== undefined) {
    searchParams.set('availableInChina', String(params.availableInChina));
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }

  const query = searchParams.toString();
  return request(`/api/aigc/tools${query ? `?${query}` : ''}`);
}

export async function fetchToolBySlug(slug: string): Promise<ApiResponse<AIGCTool>> {
  return request(`/api/aigc/tools/${slug}`);
}

export async function fetchCategories(): Promise<ApiResponse<ToolCategory[]>> {
  return request('/api/aigc/categories');
}

export async function searchTools(query: string, limit?: number): Promise<ApiResponse<AIGCTool[]>> {
  const searchParams = new URLSearchParams();
  searchParams.set('search', query);
  if (limit) searchParams.set('limit', String(limit));
  return request(`/api/aigc/tools?${searchParams.toString()}`);
}

export async function fetchSuggestions(query: string): Promise<ApiResponse<Array<{
  slug: string;
  name: string;
  tagline?: string;
  pricingType?: string;
}>>> {
  return request(`/api/aigc/suggestions?query=${encodeURIComponent(query)}`);
}

// =============================================================================
// Rankings API
// =============================================================================

export async function fetchRankingTypes(): Promise<ApiResponse<Array<{
  type: RankingType;
  name: string;
  description: string;
}>>> {
  return request('/api/aigc/rankings/types');
}

export async function fetchPerspectives(): Promise<ApiResponse<Array<{
  type: PerspectiveType;
  name: string;
  description: string;
}>>> {
  return request('/api/aigc/rankings/perspectives');
}

export async function fetchRankings(
  type: RankingType,
  params?: {
    perspective?: PerspectiveType;
    category?: string;
    limit?: number;
  }
): Promise<ApiResponse<RankingResult>> {
  const searchParams = new URLSearchParams();
  if (params?.perspective) searchParams.set('perspective', params.perspective);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return request(`/api/aigc/rankings/${type}${query ? `?${query}` : ''}`);
}

// =============================================================================
// Recommendations API
// =============================================================================

export async function fetchHomeRecommendations(params?: {
  limit?: number;
  offset?: number;
  hotRatio?: number;
  risingRatio?: number;
  featuredRatio?: number;
}): Promise<RecommendationResult> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.hotRatio) searchParams.set('hotRatio', String(params.hotRatio));
  if (params?.risingRatio) searchParams.set('risingRatio', String(params.risingRatio));
  if (params?.featuredRatio) searchParams.set('featuredRatio', String(params.featuredRatio));

  const query = searchParams.toString();
  const res = await request<RecommendationResult>(`/api/aigc/recommendations/home${query ? `?${query}` : ''}`);
  if (!res.success || !res.items) throw new Error('Failed to load recommendations');
  return res;
}

export async function fetchScenarioRecommendations(body: {
  scenario: string;
  description?: string;
  constraints?: {
    maxPrice?: number;
    modalities?: string[];
    platform?: string;
    region?: string;
  };
  limit?: number;
  enhanceWithLLM?: boolean;
}): Promise<RecommendationResult & { enhanced?: boolean; llmUsed?: boolean; llmError?: string }> {
  const res = await request<RecommendationResult & { enhanced?: boolean; llmUsed?: boolean; llmError?: string }>('/api/aigc/recommendations/scenario', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.success || !res.items) throw new Error(res.error || 'Failed to load recommendations');
  return res;
}

export async function fetchSearchRecommendations(params: {
  query: string;
  category?: string;
  limit?: number;
  relevanceWeight?: number;
  heatWeight?: number;
}): Promise<RecommendationResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('query', params.query);
  if (params.category) searchParams.set('category', params.category);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.relevanceWeight) searchParams.set('relevanceWeight', String(params.relevanceWeight));
  if (params.heatWeight) searchParams.set('heatWeight', String(params.heatWeight));

  const res = await request<RecommendationResult>(`/api/aigc/recommendations/search?${searchParams.toString()}`);
  if (!res.success || !res.items) throw new Error(res.error || 'Failed to load recommendations');
  return res;
}

export async function fetchPresetScenarios(): Promise<ApiResponse<PresetScenario[]>> {
  return request('/api/aigc/recommendations/preset-scenarios');
}

export async function analyzeScenario(text: string, description?: string, useLLM?: boolean): Promise<ApiResponse<{
  scenarioId: string;
  scenarioName: string;
  confidence: number;
  requiredCapabilities: string[];
  extractedKeywords: string[];
  matchReasons: string[];
  llmAnalysis?: {
    requiredCapabilities: string[];
    preferredCategories: string[];
    priceSensitive: boolean;
    platformRequirements: string[];
    reasoning: string;
  };
}>> {
  return request('/api/aigc/recommendations/analyze', {
    method: 'POST',
    body: JSON.stringify({ text, description, useLLM }),
  });
}

// =============================================================================
// Ratings API
// =============================================================================

export async function fetchRatings(
  rid: string,
  params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
): Promise<ApiResponse<{
  ratings: UserRating[];
  total: number;
  hasMore: boolean;
}>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

  const query = searchParams.toString();
  return request(`/api/aigc/tools/${rid}/ratings${query ? `?${query}` : ''}`);
}

export async function fetchToolRatings(
  rid: string,
  params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
): Promise<ApiResponse<{
  ratings: UserRating[];
  total: number;
  hasMore: boolean;
}>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

  const query = searchParams.toString();
  return request(`/api/aigc/tools/${rid}/ratings${query ? `?${query}` : ''}`);
}

export async function fetchToolRatingStats(rid: string): Promise<ApiResponse<RatingStats>> {
  return request(`/api/aigc/tools/${rid}/ratings/stats`);
}

export async function submitRating(body: {
  toolRid: string;
  overallRating: number;
  easeOfUseRating?: number;
  performanceRating?: number;
  valueRating?: number;
  reviewTitle?: string;
  reviewContent?: string;
  pros?: string[];
  cons?: string[];
}): Promise<ApiResponse<{ ratingId: string; isFlagged: boolean; flagReason?: string }>> {
  return request('/api/aigc/ratings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// =============================================================================
// Heat API
// =============================================================================

export async function fetchToolHeat(rid: string, period?: string): Promise<ApiResponse<HeatSnapshot>> {
  const searchParams = new URLSearchParams();
  if (period) searchParams.set('period', period);
  const query = searchParams.toString();
  return request(`/api/aigc/tools/${rid}/heat${query ? `?${query}` : ''}`);
}

export async function fetchHotTools(period?: string, limit?: number): Promise<ApiResponse<{
  period: string;
  total: number;
  tools: HeatSnapshot[];
}>> {
  const searchParams = new URLSearchParams();
  if (period) searchParams.set('period', period);
  if (limit) searchParams.set('limit', String(limit));
  const query = searchParams.toString();
  return request(`/api/aigc/heat/hot${query ? `?${query}` : ''}`);
}

export async function fetchRisingTools(limit?: number): Promise<ApiResponse<{
  period: string;
  total: number;
  tools: HeatSnapshot[];
}>> {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.set('limit', String(limit));
  const query = searchParams.toString();
  return request(`/api/aigc/heat/rising${query ? `?${query}` : ''}`);
}

// =============================================================================
// Auth API
// =============================================================================

export async function login(body: { phone?: string; email?: string; password?: string; code?: string }): Promise<ApiResponse<{ token: string; user: unknown }>> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchMe(): Promise<ApiResponse<unknown>> {
  return request('/api/auth/me');
}
