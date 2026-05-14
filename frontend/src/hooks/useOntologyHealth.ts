/**
 * Ontology Health Hook
 */

import useSWR from "swr";
import { request } from "@/lib/api";

async function fetchOntologyHealth() {
  const res = await request<{ success: boolean; data: any }>("/api/aigc/health/check");
  if (!res.success) throw new Error("Failed to load health data");
  return res.data;
}

export function useOntologyHealth() {
  const { data, error, isLoading, mutate } = useSWR(
    "ontology-health",
    fetchOntologyHealth,
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
