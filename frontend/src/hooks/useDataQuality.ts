/**
 * Data Quality Hooks
 */

import useSWR from "swr";
import { request } from "@/lib/api";

export interface QualityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  object: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface QualityReport {
  totalObjects: number;
  issues: QualityIssue[];
  issueRate: number;
  score: number;
  breakdown: {
    completeness: number;
    accuracy: number;
    consistency: number;
    uniqueness: number;
    validity: number;
  };
}

async function fetchDataQuality(type: string): Promise<QualityReport> {
  const endpoint = type === 'overall' ? '/api/aigc/quality/check' : 
                   type === 'tools' ? '/api/aigc/quality/tools' : 
                   '/api/aigc/quality/reviews';
  
  const res = await request<{ success: boolean; data: any }>(endpoint);
  if (!res.success) throw new Error("Failed to load quality data");
  
  // 处理不同接口返回的数据结构
  if (type === 'overall') {
    // /quality/check 返回 { tools, reviews, overall }
    return res.data.overall as QualityReport;
  }
  
  // /quality/tools 和 /quality/reviews 直接返回 QualityReport
  return res.data as QualityReport;
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
