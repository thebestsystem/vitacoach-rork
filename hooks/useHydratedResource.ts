import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";

import { loadFromStorage, saveToStorage } from "@/utils/storage";

type UseHydratedResourceOptions<T> = {
  queryKey?: QueryKey;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  retry?: number;
};

type StorageStatus = {
  isLoading: boolean;
  isHydrated: boolean;
  isSaving: boolean;
  loadError: Error | null;
  saveError: Error | null;
};

type HydratedResource<T> = {
  key: string;
  queryKey: QueryKey;
  data: T;
  setData: (updater: SetStateAction<T>) => Promise<T>;
  reset: () => Promise<T>;
  refresh: () => Promise<T>;
  status: StorageStatus;
};

const asError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown error");
};

export function useHydratedResource<T>(
  key: string,
  fallback: T,
  options: UseHydratedResourceOptions<T> = {},
): HydratedResource<T> {
  const queryClient = useQueryClient();
  const fallbackRef = useRef(fallback);
  const [state, setState] = useState<T>(fallbackRef.current);
  const stateRef = useRef(state);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const serialize = options.serialize;
  const deserialize = options.deserialize;
  const queryKey = useMemo<QueryKey>(() => options.queryKey ?? [key], [options.queryKey, key]);

  const query = useQuery<T>({
    queryKey,
    queryFn: async () =>
      loadFromStorage<T>(
        key,
        fallbackRef.current,
        deserialize ?? ((value) => JSON.parse(value) as T),
      ),
    staleTime: Infinity,
    retry: options.retry ?? 1,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (query.isError) {
      const err = asError(query.error);
      setLoadError(err);
      setState(fallbackRef.current);
      stateRef.current = fallbackRef.current;
    } else if (query.data !== undefined) {
      setState(query.data);
      stateRef.current = query.data;
      setLoadError(null);
    }
  }, [query.data, query.isError, query.error]);

  const persist = useCallback(
    async (value: T, previous: T) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await saveToStorage<T>(
          key,
          value,
          serialize ?? ((item) => JSON.stringify(item)),
        );
        queryClient.setQueryData(queryKey, value);
      } catch (error) {
        const err = asError(error);
        setSaveError(err);
        setState(previous);
        stateRef.current = previous;
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [key, queryClient, queryKey, serialize],
  );

  const setData = useCallback(
    async (updater: SetStateAction<T>) => {
      const previous = stateRef.current;
      const next =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(previous)
          : updater;

      setState(next);
      stateRef.current = next;

      try {
        await persist(next, previous);
      } catch {
        // persist already reverts state on failure
      }

      return next;
    },
    [persist],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);

    try {
      const refreshed = await loadFromStorage<T>(
        key,
        fallbackRef.current,
        deserialize ?? ((value) => JSON.parse(value) as T),
      );
      setState(refreshed);
      stateRef.current = refreshed;
      queryClient.setQueryData(queryKey, refreshed);
      return refreshed;
    } catch (error) {
      const err = asError(error);
      setLoadError(err);
      setState(fallbackRef.current);
      stateRef.current = fallbackRef.current;
      throw err;
    }
  }, [deserialize, key, queryClient, queryKey]);

  const reset = useCallback(() => setData(fallbackRef.current), [setData]);

  const status = useMemo<StorageStatus>(() => ({
    isLoading: query.isLoading,
    isHydrated: query.isFetched,
    isSaving,
    loadError,
    saveError,
  }), [query.isLoading, query.isFetched, isSaving, loadError, saveError]);

  return useMemo(
    () => ({
      key,
      queryKey,
      data: state,
      setData,
      reset,
      refresh,
      status,
    }),
    [key, queryKey, state, setData, reset, refresh, status],
  );
}

export type { HydratedResource, StorageStatus };
