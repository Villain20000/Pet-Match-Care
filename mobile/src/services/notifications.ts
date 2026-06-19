/**
 * In-app notifications service. Wraps /api/notifications/* endpoints
 * with react-query hooks — the list refreshes every minute and on
 * foreground.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';

export interface NotificationDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  count: number;
  items: NotificationDto[];
}

export const fetchInbox = async (take = 50): Promise<NotificationListResponse> => {
  const res = await api.get<NotificationListResponse>('/notifications/inbox', { params: { take } });
  return res.data;
};

export const fetchUnreadCount = async (): Promise<{ count: number }> => {
  const res = await api.get<{ count: number }>('/notifications/unread');
  return res.data;
};

export const useInbox = (take = 50) =>
  useQuery({
    queryKey: ['notifications', 'inbox', take],
    queryFn: () => fetchInbox(take),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await api.post('/notifications/mark', { ids });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const notificationErrorMessage = ApiError;
