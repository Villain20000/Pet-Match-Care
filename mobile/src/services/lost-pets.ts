import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Species } from '@/types';

export interface LostPet {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  description: string;
  imageUrl: string;
  lastSeenAt: string;
  lastSeenLat: number;
  lastSeenLng: number;
  addressHint: string | null;
  reward: string | null;
  isFound: boolean;
}

export interface CreateLostPetInput {
  name: string;
  species: Species;
  breed?: string;
  microchipId?: string;
  description: string;
  imageUrl: string;
  lastSeenAt: string;
  lastSeenLat: number;
  lastSeenLng: number;
  addressHint?: string;
  reward?: string;
}

export const useLostPetList = (species?: Species) =>
  useQuery({
    queryKey: ['lostPets', species ?? 'ALL'],
    queryFn: async () => {
      const res = await api.get<{ count: number; pets: LostPet[] }>('/lost-pets', {
        params: species ? { species } : undefined,
      });
      return res.data.pets;
    },
  });

export const useMatches = (params: { lat: number; lng: number; species: Species; description: string }) =>
  useQuery({
    queryKey: ['lostPets', 'matches', params],
    queryFn: async () => {
      const res = await api.get<{ count: number; matches: { pet: LostPet; distanceKm: number }[] }>(
        '/lost-pets/matches',
        { params },
      );
      return res.data.matches;
    },
    enabled: !!params.lat && !!params.lng,
  });

export const useCreateLostPet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLostPetInput) => {
      const res = await api.post<{ success: boolean; pet: LostPet }>('/lost-pets', input);
      return res.data.pet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lostPets'] }),
  });
};

export const useMarkFound = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/lost-pets/${id}/found`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lostPets'] }),
  });
};
