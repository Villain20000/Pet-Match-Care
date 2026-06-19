import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useCurrentStreak = () =>
  useQuery({
    queryKey: ['streak', 'me'],
    queryFn: async () => {
      const res = await api.get<{ streak: number }>('/streaks/me');
      return res.data.streak;
    },
  });

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ streak: number; newDay: boolean }>('/streaks/check-in');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['streak'] });
      qc.invalidateQueries({ queryKey: ['badges', 'mine'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
