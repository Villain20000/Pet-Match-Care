/**
 * In-app notifications service. Wraps /api/notifications/* endpoints
 * with react-query hooks — the list refreshes every minute and on
 * foreground.
 *
 * Also hosts the Expo push-notification helpers (`initNotifications`,
 * `registerPushToken`) so App.tsx can call into a single facade at boot.
 * Those wrappers are best-effort: failures are swallowed because losing
 * the push token shouldn't block the rest of the boot path.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ExpoNotifications from 'expo-notifications';
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

// ---------------------------------------------------------------------------
// Push-notification bridge (Expo). Best-effort, never blocks app boot.
// ---------------------------------------------------------------------------

/**
 * Set the foreground notification handler and ask for permission once.
 * Safe to call multiple times; idempotent.
 */
export const initNotifications = async (): Promise<void> => {
  try {
    ExpoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
    const { status } = await ExpoNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      await ExpoNotifications.requestPermissionsAsync();
    }
  } catch {
    // expo-notifications is unavailable on web or in older SDKs — skip silently.
  }
};

/**
 * Pull the Expo push token and POST it to /auth/push-token so the
 * backend can route nearby-alert pushes. Returns silently on token-fetch
 * failure so the boot flow keeps moving.
 *
 * `_token` is the current short-lived access token — kept in the
 * signature for a future audit hook (e.g. logging device-scope), but
 * the axios auth interceptor already attaches it to the request.
 */
export const registerPushToken = async (
  _token: string,
): Promise<void> => {
  try {
    const expoToken = (await ExpoNotifications.getExpoPushTokenAsync()).data;
    await api.put('/auth/push-token', { pushToken: expoToken });
  } catch {
    // Either the OS doesn't support push, the user denied permission, or
    // the backend rejected the device token — none of these are fatal.
  }
};
