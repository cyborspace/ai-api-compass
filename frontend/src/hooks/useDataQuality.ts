/**
 * Data Quality Hooks
 */

import useSWR from "swr";
import { request } from "@/lib/api";

async function fetchDataQuality(type: string) {
  const endpoint = type === 'overall' ? '/api/aigc/quality/check' : 
                   type === 'tools' ? '/api/aigc/quality/tools' : 
                   '/api/aigc/quality/reviews';
  
  const res = await request<{ success: boolean; data: any }>(endpoint);
  if (!res.success) throw new Error("Failed to load quality data");
  return res.data;
}

export function useDataQuality(type: 'overall' | 'tools' | 'reviews') {
  const { data, error, isLoading, mutate } = useSWR(
    `data-quality-${type}`,
    () => fetchDataQuality(type),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}
