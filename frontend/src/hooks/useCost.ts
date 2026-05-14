/**
 * Cost Calculator Hooks
 */

import useSWR from "swr";
import { request } from "@/lib/api";

// =============================================================================
// API Functions
// =============================================================================

async function fetchCostModels() {
  const res = await request<{ success: boolean; data: any[] }>("/api/aigc/cost/models");
  if (!res.success) throw new Error("Failed to load models");
  return res.data;
}

async function fetchCostComparison(params: {
  inputText: string;
  expectedOutputTokens: number;
  callsPerDay: number;
  daysPerMonth?: number;
  modelIds?: string[];
}) {
  const res = await request<{ success: boolean; data: any }>("/api/aigc/cost/compare", {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.success) throw new Error("Failed to compare costs");
  return res.data;
}

// =============================================================================
// Hooks
// =============================================================================

export function useCostModels() {
  const { data, error, isLoading } = useSWR("cost-models", fetchCostModels, {
    revalidateOnFocus: false,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useCostComparison(
  params: {
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
    daysPerMonth?: number;
    modelIds?: string[];
  } | null
) {
  const { data, error, isLoading } = useSWR(
    params ? ["cost-comparison", JSON.stringify(params)] : null,
    () => (params ? fetchCostComparison(params) : null),
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
