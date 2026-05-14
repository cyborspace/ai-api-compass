/**
 * useTools Hook - SWR 数据获取模式
 * 使用 SWR 替代自定义 useEffect 数据获取
 */

import useSWR from 'swr';
import type { AIGCTool, ToolCategory, PaginatedResponse } from '@/types/api';
import { fetchTools, fetchCategories, fetchToolBySlug } from '@/lib/api';

const toolsFetcher = (key: string): Promise<PaginatedResponse<AIGCTool>> => {
  const url = new URL(key, 'http://localhost');
  const limit = url.searchParams.get('limit');
  const offset = url.searchParams.get('offset');
  const search = url.searchParams.get('search');
  const categories = url.searchParams.get('categories');
  const pricingTypes = url.searchParams.get('pricingTypes');
  const capabilities = url.searchParams.get('capabilities');
  const availableInChina = url.searchParams.get('availableInChina');
  const sortBy = url.searchParams.get('sortBy');
  return fetchTools({
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
    search: search || undefined,
    categories: categories ? categories.split(',') : undefined,
    pricingTypes: pricingTypes ? pricingTypes.split(',') : undefined,
    capabilities: capabilities ? capabilities.split(',') : undefined,
    availableInChina: availableInChina ? availableInChina === 'true' : null,
    sortBy: sortBy || undefined,
  });
};

const toolDetailFetcher = (key: string) => {
  return fetchToolBySlug(key.replace('tool:', ''));
};

const categoriesFetcher = () => {
  return fetchCategories();
};

export function useToolsList(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  categories?: string[];
  pricingTypes?: string[];
  capabilities?: string[];
  availableInChina?: boolean | null;
  sortBy?: string;
}) {
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

  const key = `tools?${searchParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<AIGCTool>>(
    key,
    toolsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export function useToolDetail(slug: string) {
  const { data, error, isLoading } = useSWR(
    slug ? `tool:${slug}` : null,
    toolDetailFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const tool = data?.success && data?.data ? (data.data as AIGCTool) : null;

  return {
    data: tool,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR('categories', categoriesFetcher, {
    revalidateOnFocus: false,
  });

  const categories = data?.success && data?.data ? (data.data as ToolCategory[]) : [];

  return {
    data: categories,
    loading: isLoading,
    error: error?.message || null,
  };
}
