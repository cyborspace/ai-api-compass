/**
 * Monitoring Hooks
 */

import useSWR from "swr";
import { request } from "@/lib/api";

async function fetchMonitoringData(type: string) {
  let endpoint: string;
  switch (type) {
    case 'queries':
      endpoint = '/api/aigc/monitoring/queries';
      break;
    case 'slow':
      endpoint = '/api/aigc/monitoring/slow-queries';
      break;
    default:
      endpoint = '/api/aigc/monitoring/metrics';
  }

  const res = await request<{ success: boolean; data: any }>(endpoint);
  if (!res.success) throw new Error("Failed to load monitoring data");
  return res.data;
}

export function useMonitoring(type: 'overview' | 'queries' | 'slow') {
  const { data, error, isLoading, mutate } = useSWR(
    `monitoring-${type}`,
    () => fetchMonitoringData(type),
    {
      revalidateOnFocus: false,
      refreshInterval: type === 'overview' ? 30000 : 0,
    }
  );

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}
