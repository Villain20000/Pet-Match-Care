import { create } from 'zustand';
import { AxiosError } from 'axios';
import { api, ApiError, getStoredBundle, getStoredUserJson, persistBundle, persistUser, subscribeAuth, issueBundle } from './api';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Localization from 'expo-localization';

import type { Role, Locale } from '@/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  karmaPoints: number;
  emailVerifiedAt: string | null;
  totpEnabled: boolean;
  pushToken: string | null;
  locale: Locale;
}

interface MeResponse { user: AuthenticatedUser }
interface LoginResponse {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: AuthenticatedUser;
  requires2fa?: boolean;
}

interface AuthState {
  user: AuthenticatedUser | null;
  pushReady: boolean;
  requiresEmailVerification: boolean;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (
    email: string,
    password: string,
    fullName?: string,
    locale?: Locale,
  ) => Promise<LoginResponse>;
  setLocale: (locale: Locale) => Promise<void>;
  startGoogleSso: () => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;

  begin2fa: () => Promise<{ secret: string; otpauthUri: string }>;
  confirm2fa: (code: string) => Promise<{ recoveryCodes: string[] }>;
  disable2fa: (code: string) => Promise<void>;
  stepUp: (code: string) => Promise<void>;

  unlockWithBiometrics: () => Promise<boolean>;
  sendVerification: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const detectLocale = (): Locale => {
  try {
    const locales = Localization.getLocales?.() ?? [];
    const primary = locales[0]?.languageCode ?? Localization.locale ?? 'en';
    return primary.startsWith('el') ? 'el' : 'en';
  } catch {
    return 'el';
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pushReady: false,
  requiresEmailVerification: false,

  hydrate: async () => {
    const bundle = await getStoredBundle();
    if (!bundle) return;
    try {
      const res = await api.get<MeResponse>('/auth/me');
      set({
        user: res.data.user,
        requiresEmailVerification: !res.data.user.emailVerifiedAt,
      });
    } catch (err) {
      if ((err as AxiosError).response?.status === 401) {
        await get().logout();
      }
    }
  },

  login: async (email, password) => {
    const res = await api.post<LoginResponse>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    await persistBundle({
      accessToken: res.data.accessToken,
      accessExpiresAt: res.data.accessExpiresAt,
      refreshToken: res.data.refreshToken,
      refreshExpiresAt: res.data.refreshExpiresAt,
    });
    await persistUser(JSON.stringify(res.data.user));
    set({ user: res.data.user, requiresEmailVerification: !res.data.user.emailVerifiedAt });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return res.data;
  },

  register: async (email, password, fullName, locale) => {
    const res = await api.post<LoginResponse>('/auth/register', {
      email: email.trim().toLowerCase(),
      password,
      fullName,
      locale: locale ?? detectLocale(),
    });
    await persistBundle({
      accessToken: res.data.accessToken,
      accessExpiresAt: res.data.accessExpiresAt,
      refreshToken: res.data.refreshToken,
      refreshExpiresAt: res.data.refreshExpiresAt,
    });
    await persistUser(JSON.stringify(res.data.user));
    set({ user: res.data.user, requiresEmailVerification: true });
    return res.data;
  },

  setLocale: async (locale) => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, locale } });
    try {
      await api.patch('/auth/me', { locale });
    } catch { /* offline is fine */ }
  },

  startGoogleSso: async () => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'petmatchcare' });
    const { data: start } = await api.get<{ authUrl: string; state: string }>(
      `/auth/oauth/google/start`,
      { params: { redirectUri } },
    );
    const result = await WebBrowser.openAuthSessionAsync(start.authUrl, redirectUri);
    if (result.type !== 'success' || !result.url) throw new Error('Η σύνδεση Google ακυρώθηκε');
    const url = new URL(result.url);
    const fragment = url.hash.startsWith('#') ? url.hash.substring(1) : url.search.substring(1);
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access');
    const refreshToken = params.get('refresh');
    const userJson = params.get('user');
    if (!accessToken || !refreshToken || !userJson) {
      throw new Error('Λάθος απάντηση από Google SSO');
    }
    await persistBundle({ accessToken, accessExpiresAt: '', refreshToken, refreshExpiresAt: '' });
    const user = JSON.parse(decodeURIComponent(userJson)) as AuthenticatedUser;
    await persistUser(JSON.stringify(user));
    set({ user, requiresEmailVerification: false });
  },

  logout: async () => {
    const bundle = await getStoredBundle();
    try {
      if (bundle) await api.post('/auth/logout', { refreshToken: bundle.refreshToken });
    } catch { /* ignore */ }
    await persistBundle(null);
    await persistUser(null);
    set({ user: null, requiresEmailVerification: false });
  },

  logoutEverywhere: async () => {
    try { await api.post('/auth/logout-everywhere'); }
    finally {
      await persistBundle(null);
      await persistUser(null);
      set({ user: null, requiresEmailVerification: false });
    }
  },

  begin2fa: async () => {
    const res = await api.post<{ secret: string; otpauthUri: string }>('/auth/2fa/begin');
    void Haptics.selectionAsync();
    return res.data;
  },

  confirm2fa: async (code) => {
    const res = await api.post<{ recoveryCodes: string[] }>('/auth/2fa/confirm', { code });
    const u = get().user;
    if (u) set({ user: { ...u, totpEnabled: true } });
    return res.data;
  },

  disable2fa: async (code) => {
    await api.post('/auth/2fa/disable', { code });
    const u = get().user;
    if (u) set({ user: { ...u, totpEnabled: false } });
  },

  stepUp: async (code) => {
    const res = await api.post<{ accessToken: string; accessExpiresAt: string }>(
      '/auth/step-up',
      { code },
    );
    const current = await getStoredBundle();
    if (current) {
      await persistBundle({
        ...current,
        accessToken: res.data.accessToken,
        accessExpiresAt: res.data.accessExpiresAt,
      });
    }
  },

  unlockWithBiometrics: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ξεκλείδωμα του Pet-Match & Care',
      cancelLabel: 'Άκυρο',
      fallbackLabel: 'Χρήση κωδικού',
    });
    return result.success;
  },

  sendVerification: async () => {
    await api.post('/auth/resend-verification');
  },

  verifyEmail: async (token) => {
    await api.post('/auth/verify-email', { token });
    const u = get().user;
    if (u) set({ user: { ...u, emailVerifiedAt: new Date().toISOString() } });
  },

  forgotPassword: async (email) => {
    await api.post('/auth/forgot', { email: email.trim().toLowerCase() });
  },

  resetPassword: async (token, newPassword) => {
    await api.post('/auth/reset', { token, newPassword });
  },
}));

subscribeAuth(() => {});

export const deviceId = async (): Promise<string> => {
  const existing = await getStoredUserJson();
  void Application;
  return Crypto.randomUUID();
};

export { issueBundle };
