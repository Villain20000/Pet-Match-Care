import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconEmoji: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export const useAllBadges = () =>
  useQuery({
    queryKey: ['badges', 'all'],
    queryFn: async () => {
      const res = await api.get<{ count: number; badges: Badge[] }>('/badges');
      return res.data.badges;
    },
  });

export const useMyBadges = () =>
  useQuery({
    queryKey: ['badges', 'mine'],
    queryFn: async () => {
      const res = await api.get<{ count: number; badges: Badge[] }>('/badges/mine');
      return res.data.badges;
    },
  });

export interface LeaderboardRow {
  user: { id: string; fullName: string | null; karmaPoints: number; avatarUrl: string | null };
  reports: number;
}

export const useLeaderboard = (municipality: string) =>
  useQuery({
    queryKey: ['leaderboard', municipality],
    queryFn: async () => {
      const res = await api.get<{ count: number; leaderboard: LeaderboardRow[] }>(
        '/badges/leaderboard/municipality',
        { params: { municipality } },
      );
      return res.data.leaderboard;
    },
    enabled: !!municipality,
  });
