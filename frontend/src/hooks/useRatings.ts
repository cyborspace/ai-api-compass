/**
 * useRatings Hook - SWR 数据获取模式
 */

import useSWR from 'swr';
import type { RatingStats, UserRating } from '@/types/api';
import { fetchRatings, fetchToolRatingStats, submitRating } from '@/lib/api';

export function useRatings(
  rid: string,
  params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
) {
  const key = rid ? `ratings:${rid}:${JSON.stringify(params)}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetchRatings(rid, params),
    {
      revalidateOnFocus: false,
    }
  );

  const ratings = data?.success && data?.data ? (data.data.ratings as UserRating[]) : [];
  const total = data?.success && data?.data ? (data.data.total as number) : 0;

  return {
    data: ratings,
    total,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export function useToolRatings(
  rid: string,
  params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
) {
  const key = rid ? `tool-ratings:${rid}:${JSON.stringify(params)}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetchRatings(rid, params),
    {
      revalidateOnFocus: false,
    }
  );

  const ratings = data?.success && data?.data ? (data.data.ratings as UserRating[]) : [];
  const total = data?.success && data?.data ? (data.data.total as number) : 0;

  return {
    ratings,
    total,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export function useToolRatingStats(rid: string) {
  const { data, error, isLoading } = useSWR(
    rid ? `rating-stats:${rid}` : null,
    () => fetchToolRatingStats(rid),
    {
      revalidateOnFocus: false,
    }
  );

  const stats = data?.success && data?.data ? (data.data as RatingStats) : null;

  return {
    stats,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useSubmitRating() {
  const submit = async (body: {
    toolRid: string;
    overallRating: number;
    easeOfUseRating?: number;
    performanceRating?: number;
    valueRating?: number;
    reviewTitle?: string;
    reviewContent?: string;
    pros?: string[];
    cons?: string[];
  }) => {
    const res = await submitRating(body);
    if (!res.success || !res.data) throw new Error(res.error || '提交失败');
    return res.data;
  };

  return { submit };
}
