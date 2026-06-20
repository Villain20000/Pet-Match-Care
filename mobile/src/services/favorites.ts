/**
 * Favorites / wishlist client. Mirrors the `/api/favorites` endpoints.
 *
 * `useFavorites()` returns a React-Query-backed hook with the caller's
 * favorited pet ids plus `toggle(petId)` and `isFavorite(petId)` helpers.
 * The id set is also kept in a Zustand store so the AdoptionScreen heart
 * state can update instantly without waiting for a refetch.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';
import type { PetForAdoptionDto } from '@/types';

const OFFLINE_KEY = '@pmc/favoriteIds';

interface FavoriteState {
  ids: Set<string>;
  setIds: (ids: Set<string>) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  hydrateOffline: () => Promise<void>;
}

const useFavoriteStore = create<FavoriteState>((set, get) => ({
  ids: new Set<string>(),
  setIds: (ids) => set({ ids }),
  add: (id) => {
    const next = new Set(get().ids);
    next.add(id);
    set({ ids: next });
    void persistOffline(next);
  },
  remove: (id) => {
    const next = new Set(get().ids);
    next.delete(id);
    set({ ids: next });
    void persistOffline(next);
  },
  hydrateOffline: async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_KEY);
      if (raw) set({ ids: new Set(JSON.parse(raw) as string[]) });
    } catch {
      /* ignore */
    }
  },
}));

const persistOffline = async (ids: Set<string>) => {
  try {
    await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
};

export const favoritesApi = {
  async list(): Promise<PetForAdoptionDto[]> {
    const res = await api.get<{ count: number; pets: PetForAdoptionDto[] }>('/favorites');
    return res.data.pets;
  },
  async ids(): Promise<string[]> {
    const res = await api.get<{ count: number; ids: string[] }>('/favorites/ids');
    return res.data.ids;
  },
  async add(petId: string): Promise<void> {
    await api.post(`/favorites/${petId}`);
  },
  async remove(petId: string): Promise<void> {
    await api.delete(`/favorites/${petId}`);
  },
};

const FAV_IDS_KEY = 'favorites:ids';
const FAV_LIST_KEY = 'favorites:list';

/** Hook: subscribe to the favorite-id set + expose toggle/isFavorite. */
export const useFavorites = () => {
  const qc = useQueryClient();
  const ids = useFavoriteStore((s) => s.ids);
  const addStore = useFavoriteStore((s) => s.add);
  const removeStore = useFavoriteStore((s) => s.remove);

  const query = useQuery({
    queryKey: [FAV_IDS_KEY],
    queryFn: async () => {
      const list = await favoritesApi.ids();
      useFavoriteStore.getState().setIds(new Set(list));
      return list;
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    onMutate: (petId: string) => {
      const isFav = useFavoriteStore.getState().ids.has(petId);
      if (isFav) removeStore(petId);
      else addStore(petId);
      return { petId, wasFav: isFav };
    },
    mutationFn: async (petId: string) => {
      const isFav = useFavoriteStore.getState().ids.has(petId);
      if (isFav) await favoritesApi.add(petId);
      else await favoritesApi.remove(petId);
    },
    onError: (_e, _petId, ctx) => {
      // Rollback on failure.
      if (ctx?.wasFav) addStore(ctx.petId);
      else if (ctx) removeStore(ctx.petId);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [FAV_IDS_KEY] });
      void qc.invalidateQueries({ queryKey: [FAV_LIST_KEY] });
    },
  });

  return {
    ids,
    isFavorite: (petId: string) => ids.has(petId),
    toggle: (petId: string) => toggleMutation.mutate(petId),
    loading: query.isLoading,
  };
};

/** Hook for the Favorites screen: full pet list. */
export const useFavoritePets = () =>
  useQuery({
    queryKey: [FAV_LIST_KEY],
    queryFn: async () => favoritesApi.list(),
    staleTime: 30_000,
  });

export { useFavoriteStore };
