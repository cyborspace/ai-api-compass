"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useApi<T>(
  fetchFn: () => Promise<{ data: T }>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const { initialData, enabled = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFn();
      setData(response.data);
      onSuccess?.(response.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData, retryCount]);

  const refetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return { data, loading, error, refetch };
}

export function useApiMutation<T, P = void>(
  mutateFn: (params: P) => Promise<{ data: T }>
) {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mutateFn(params);
      setData(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { data, loading, error, mutate };
}
