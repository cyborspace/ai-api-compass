/**
 * useRankings Hook - SWR 数据获取模式
 */

import useSWR from 'swr';
import type { RankingEntry, RankingType, PerspectiveType } from '@/types/api';
import { fetchRankings, fetchRankingTypes, fetchPerspectives } from '@/lib/api';

export function useRankings(
  type: RankingType,
  params?: {
    perspective?: PerspectiveType;
    category?: string;
    limit?: number;
  }
) {
  const key = type ? `rankings:${type}:${params?.perspective || 'default'}:${params?.limit || 50}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetchRankings(type, params),
    {
      revalidateOnFocus: false,
    }
  );

  const ranking = data?.success && data?.data ? data.data : null;

  return {
    data: ranking,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export function useRankingMeta() {
  const { data: typesData } = useSWR('ranking-types', fetchRankingTypes, {
    revalidateOnFocus: false,
  });

  const { data: perspectivesData } = useSWR('perspectives', fetchPerspectives, {
    revalidateOnFocus: false,
  });

  return {
    types: typesData?.success && typesData?.data ? typesData.data : [],
    perspectives: perspectivesData?.success && perspectivesData?.data ? perspectivesData.data : [],
  };
}
