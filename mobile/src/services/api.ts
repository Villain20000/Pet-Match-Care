/**
 * Network layer (v2): bearer + refresh-token rotation with single-flight
 * refresh. A 401 triggers exactly one `/auth/refresh` round-trip; concurrent
 * 401s queue behind it and replay with the new access token. Refresh-token
 * reuse (which would indicate a replay-attack) immediately signs the user
 * out.
 */
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://10.0.2.2:4000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const ACCESS_KEY = 'auth_access';
const REFRESH_KEY = 'auth_refresh';
const USER_KEY = 'auth_user';

interface AuthBundle {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
}

let bundle: AuthBundle | null = null;
let userJson: string | null = null;
let onChange: ((bundle: AuthBundle | null) => void) | null = null;

export const subscribeAuth = (cb: (b: AuthBundle | null) => void) => {
  onChange = cb;
  return () => {
    onChange = null;
  };
};

export const persistBundle = async (next: AuthBundle | null) => {
  bundle = next;
  if (next) {
    await SecureStore.setItemAsync(ACCESS_KEY, next.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, next.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
  onChange?.(next);
};

export const persistUser = async (json: string | null) => {
  userJson = json;
  if (json) await SecureStore.setItemAsync(USER_KEY, json);
  else await SecureStore.deleteItemAsync(USER_KEY);
};

export const getStoredBundle = async (): Promise<AuthBundle | null> => {
  if (bundle) return bundle;
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  if (access && refresh) {
    bundle = {
      accessToken: access,
      accessExpiresAt: '', // derived from JWT decoding whenever needed
      refreshToken: refresh,
      refreshExpiresAt: '',
    };
  }
  return bundle;
};

export const getStoredUserJson = async (): Promise<string | null> => {
  if (userJson) return userJson;
  userJson = await SecureStore.getItemAsync(USER_KEY);
  return userJson;
};

// ---------------------------------------------------------------------------
// Single-flight refresh
// ---------------------------------------------------------------------------
let inflightRefresh: Promise<AuthBundle | null> | null = null;

const refreshOnce = async (): Promise<AuthBundle | null> => {
  if (inflightRefresh) return inflightRefresh;
  const current = bundle ?? (await getStoredBundle());
  if (!current) return null;

  inflightRefresh = (async () => {
    try {
      const res = await axios.post<AuthBundle>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: current.refreshToken,
      });
      const next: AuthBundle = res.data;
      await persistBundle(next);
      return next;
    } catch {
      await persistBundle(null);
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
};

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const current = bundle ?? (await getStoredBundle());
  if (current?.accessToken) {
    config.headers.set('Authorization', `Bearer ${current.accessToken}`);
  }
  return config;
});

interface RetryMeta {
  _retried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError & RetryMeta) => {
    const status = err.response?.status;
    const original = err.config as (InternalAxiosRequestConfig & RetryMeta) | undefined;
    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/refresh')) {
      const refreshed = await refreshOnce();
      if (!refreshed) {
        return Promise.reject(err);
      }
      original._retried = true;
      original.headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
      return api.request(original);
    }
    if (status === 403 && (err.response?.data as { error?: string } | undefined)?.error === 'STEP_UP_REQUIRED') {
      // The caller can intercept this and trigger a sheet; otherwise we
      // surface the error to the caller as usual.
      return Promise.reject(err);
    }
    return Promise.reject(err);
  },
);

export const ApiError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? 'Άγνωστο σφάλμα δικτύου';
  }
  return err instanceof Error ? err.message : 'Άγνωστο σφάλμα';
};

// Re-export so the auth store can wrap token issuance.
export const issueBundle = persistBundle;
