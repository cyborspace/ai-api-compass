/**
 * useRecommendations Hook - SWR 数据获取模式
 */

import useSWR from 'swr';
import type { AIGCTool, RecommendationResult, PresetScenario } from '@/types/api';
import {
  fetchHomeRecommendations,
  fetchScenarioRecommendations,
  fetchSearchRecommendations,
  fetchPresetScenarios,
  analyzeScenario,
} from '@/lib/api';

export function useHomeRecommendations(params?: {
  limit?: number;
  offset?: number;
  hotRatio?: number;
  risingRatio?: number;
  featuredRatio?: number;
}) {
  const { data, error, isLoading } = useSWR(
    ['home-recommendations', JSON.stringify(params)],
    () => fetchHomeRecommendations(params),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useScenarioRecommendations(body: {
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
}) {
  const { data, error, isLoading } = useSWR(
    body.scenario ? ['scenario-recommendations', JSON.stringify(body)] : null,
    () => fetchScenarioRecommendations(body),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    enhanced: data?.enhanced || false,
    llmUsed: data?.llmUsed || false,
  };
}

export function useSearchRecommendations(params: {
  query: string;
  category?: string;
  limit?: number;
  relevanceWeight?: number;
  heatWeight?: number;
}) {
  const { data, error, isLoading } = useSWR(
    params.query ? ['search-recommendations', JSON.stringify(params)] : null,
    () => fetchSearchRecommendations(params),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function usePresetScenarios() {
  const { data, error, isLoading } = useSWR('preset-scenarios', fetchPresetScenarios, {
    revalidateOnFocus: false,
  });

  const scenarios = data?.success && data?.data ? (data.data as PresetScenario[]) : [];

  return {
    data: scenarios,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useScenarioAnalyzer() {
  const analyze = async (text: string, description?: string, useLLM?: boolean) => {
    const res = await analyzeScenario(text, description, useLLM);
    if (!res.success || !res.data) throw new Error(res.error || '分析失败');
    return res.data;
  };

  return { analyze };
}
