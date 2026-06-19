/**
 * Toast notification system (mobile).
 *
 * Architecture
 *  ─ Zustand-backed FIFO queue with a 3-visible cap (oldest drops off when full).
 *  ─ Each toast belongs to a variant: `info` | `success` | `warning` | `error`.
 *    Variants pick a palette + haptic pattern via the same `haptic.*` helpers
 *    used across the app, so feedback feels consistent with existing CTAs.
 *  ─ Helpers accept already-resolved strings — callers pass `t('some.key')`.
 *    This keeps the host component dumb (rendering only) and avoids threading
 *    the i18n hook into a service module.
 *  ─ Auto-toast for 5xx / network failures happens via
 *    `installAutoToastErrorInterceptor`. 4xx errors stay caller-managed so
 *    login forms etc. can render inline validation, not noisy toasts.
 *  ─ Bilingual envelope: `resolveApiError(err, t, locale)` extracts the active
 *    locale's localised message straight off the backend so users see Greek
 *    on EL devices and English on EN devices — never a fallback key leaked.
 */
import { create } from 'zustand';
import { haptic } from '@/services/haptics';
import { currentLocale, t as i18nT } from '@/services/i18n';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  body?: string;
  cta?: { label: string; onPress: () => void };
  durationMs: number;
  createdAt: number;
}

export interface ToastHostProps {
  /** Override the default 3-toast cap. */
  maxVisible?: number;
  /** Spacing from the screen bottom edge to the snackbar stack (default below the bottom tab bar). */
  bottomOffset?: number;
}

interface ToastState {
  items: Toast[];
  push: (input: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/** Tunable per variant so a destructive error stays longer than a chatty success. */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  info: 3_500,
  success: 2_500,
  warning: 5_000,
  error: 6_000,
};

/** Hard-capped at 3 so we never overwhelm a small phone with stacked banners. */
const DEFAULT_MAX_VISIBLE = 3;

let counter = 0;
const nextId = (): string => `t_${Date.now()}_${++counter}`;

const hapticFor = (variant: ToastVariant): void => {
  if (variant === 'success') haptic.success();
  else if (variant === 'warning') haptic.warning();
  else if (variant === 'error') haptic.error();
  // info → silent (chatty)
};

const cache = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (incoming) => {
    const id = incoming.id ?? nextId();
    const durationMs = incoming.durationMs ?? DEFAULT_DURATION[incoming.variant];
    const item: Toast = {
      id,
      variant: incoming.variant,
      title: incoming.title,
      body: incoming.body,
      cta: incoming.cta,
      durationMs,
      createdAt: Date.now(),
    };
    hapticFor(item.variant);
    set((s) => {
      // Trim queue so we never exceed DEFAULT_MAX_VISIBLE — drop the oldest first.
      const next = [...s.items, item];
      if (next.length > DEFAULT_MAX_VISIBLE) next.splice(0, next.length - DEFAULT_MAX_VISIBLE);
      return { items: next };
    });
    if (durationMs > 0 && Number.isFinite(durationMs)) {
      const handle = setTimeout(() => {
        cache.delete(id);
        // Re-check it hasn't already been dismissed manually.
        if (get().items.some((x) => x.id === id)) {
          get().dismiss(id);
        }
      }, durationMs);
      cache.set(id, handle);
    }
    return id;
  },
  dismiss: (id) => {
    const handle = cache.get(id);
    if (handle) {
      clearTimeout(handle);
      cache.delete(id);
    }
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
  },
  clear: () => {
    cache.forEach(clearTimeout);
    cache.clear();
    set({ items: [] });
  },
}));

/**
 * Namespace-style helpers. Prefer these over reaching into the store directly
 * — they keep the surface stable so screens can be refactored without
 * churning call-sites.
 */
export const toast = {
  info: (args: Omit<Toast, 'id' | 'createdAt' | 'variant'> & { durationMs?: number }) =>
    useToastStore.getState().push({ ...args, variant: 'info' }),
  success: (args: Omit<Toast, 'id' | 'createdAt' | 'variant'> & { durationMs?: number }) =>
    useToastStore.getState().push({ ...args, variant: 'success' }),
  warning: (args: Omit<Toast, 'id' | 'createdAt' | 'variant'> & { durationMs?: number }) =>
    useToastStore.getState().push({ ...args, variant: 'warning' }),
  error: (args: Omit<Toast, 'id' | 'createdAt' | 'variant'> & { durationMs?: number }) =>
    useToastStore.getState().push({ ...args, variant: 'error' }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};

/**
 * Build a localised toast payload from a thrown AxiosError that carries our
 * bilingual envelope. Returns `null` if the caller should handle it inline
 * (e.g. login form validation prefers an inline message over a toast).
 */
export interface ResolvedApiError {
  variant: ToastVariant;
  title: string;
  body?: string;
  /** Should the caller auto-fire a toast? `false` for `4xx` unless wrapped. */
  autoFire: boolean;
}

interface ThrowableError {
  response?: {
    status?: number;
    data?: {
      error?: {
        code?: string;
        messages?: Partial<Record<'el' | 'en', string>>;
        serverMessage?: string;
      };
      message?: string;
    };
  };
  message?: string;
}

/**
 * `t` is the *resolved* string lookup, supplied by the caller, so this service
 * stays React-free and doesn't need to import the i18n hook.
 */
export const resolveApiError = (
  err: unknown,
  t: (key: string) => string,
  locale: 'el' | 'en' = currentLocale(),
): ResolvedApiError | null => {
  const ax = err as ThrowableError;
  const status = ax?.response?.status;
  const data = ax?.response?.data;

  if (data?.error?.code === 'STEP_UP_REQUIRED') {
    // Caller will mount the ReAuth sheet; we don't toast.
    return null;
  }

  if (data?.error?.messages) {
    const localised = data.error.messages[locale];
    const variant: ToastVariant = classifyByStatus(status);
    return {
      variant,
      title: localised ?? data.error.code ?? t('toast.requestError'),
      body:
        data.error.serverMessage && data.error.serverMessage !== localised
          ? data.error.serverMessage
          : undefined,
      autoFire: variant === 'error',
    };
  }

  if (!status) {
    return { variant: 'error', title: t('toast.networkError'), autoFire: true };
  }
  if (status >= 500) {
    return { variant: 'error', title: t('toast.serverError'), autoFire: true };
  }
  return null;
};

const classifyByStatus = (status: number | undefined): ToastVariant => {
  if (status === undefined) return 'error';
  if (status >= 500) return 'error';
  if (status === 401 || status === 403 || status === 409) return 'warning';
  return 'info';
};

/**
 * Wire `api`'s response interceptor to auto-toast on 5xx + network failures.
 * Call once at app boot after the i18n store has been hydrated so locale-aware
 * lookups work. Callers can opt out per-request via
 * `api.get('/foo', { skipAutoToast: true })`.
 */
export const installAutoToastErrorInterceptor = (api: {
  interceptors: {
    response: {
      use: (
        onFulfilled: (r: unknown) => unknown,
        onRejected: (err: unknown) => unknown,
      ) => void;
    };
  };
}): void => {
  api.interceptors.response.use(
    (_res) => _res,
    (err: unknown) => {
      const ax = err as ThrowableError & {
        config?: { skipAutoToast?: boolean; _retried?: boolean };
      };
      // Never toast:
      //  – refreshed requests (we already handled the original 401)
      //  – explicit opt-out per-call (`skipAutoToast: true`)
      //  – step-up pass-through (caller mounts ReAuthSheet)
      //  – sub-500 or absent response (caller / inline validation handles it)
      if (
        ax?.config?.skipAutoToast ||
        ax?.config?._retried ||
        ax?.response?.data?.error?.code === 'STEP_UP_REQUIRED' ||
        !ax?.response ||
        ax.response.status < 500
      ) {
        return Promise.reject(err);
      }
      // 5xx — surface immediately so the user isn't left wondering.
      toast.error({ title: i18nT('toast.serverError'), durationMs: 7_000 });
      return Promise.reject(err);
    },
  );
};
