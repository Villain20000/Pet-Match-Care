/**
 * React Query setup. The queryClient is exported so providers and tests
 * share the same instance. The persister writes every successful query
 * to AsyncStorage so the app shows the last-known state when offline.
 */
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const STORAGE_KEY = '@petmatchcare/queries';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: 1000 * 60 * 60 * 24, // keep cache 24h
      staleTime: 1000 * 30, // 30s before we consider data stale
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false; // don't retry 4xx
        }
        return failureCount < 2;
      },
    },
    mutations: {
      networkMode: 'online',
      retry: 0,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  } as any,
  key: STORAGE_KEY,
  throttleTime: 1_000,
});
