/**
 * i18n runtime for Pet-Match & Care.
 *
 * Why custom: the app is bilingual today, only Greek → English. A 30kb
 * library would dwarf the catalog. We keep it lean: a Zustand store with
 * the active locale, a `useT()` hook that deep-resolves a dotted key
 * (with EL fallback if EN missing), and a handful of locale-aware
 * formatters built on top of `Intl`.
 *
 * Detection on first launch:
 *   - Read `expo-localization` to learn the device locale.
 *   - If the device locale starts with `el`, default to EL. Otherwise EN.
 *   - The user's choice is persisted in AsyncStorage and overrides this.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import { el } from '@/locales/el';
import { en } from '@/locales/en';
import { api } from '@/services/api';

export type Locale = 'el' | 'en';
export type Catalog = typeof el;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
interface I18nState {
  locale: Locale;
  ready: boolean;
  setLocale: (l: Locale, opts?: { persist?: boolean }) => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = '@pmc/locale';

const useI18nStore = create<I18nState>((set) => ({
  locale: 'el', // Greek defaults — app is Greek-first.
  ready: false,
  setLocale: async (locale, opts = { persist: true }) => {
    set({ locale });
    if (opts.persist) await AsyncStorage.setItem(STORAGE_KEY, locale);
    try {
      // Best-effort: persist on the server so future emails go out in this language.
      await api.patch('/auth/me', { locale });
    } catch {
      /* ignore — user might be logged out */
    }
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'el' || stored === 'en') {
        set({ locale: stored, ready: true });
        return;
      }
      const deviceLocales = Localization.getLocales?.() ?? [];
      const primary = deviceLocales[0]?.languageCode ?? 'en';
      set({ locale: primary.startsWith('el') ? 'el' : 'en', ready: true });
    } catch {
      set({ locale: 'el', ready: true });
    }
  },
}));

export { useI18nStore };

// ---------------------------------------------------------------------------
// Catalog resolution
// ---------------------------------------------------------------------------
const CATALOGS: Record<Locale, Catalog> = { el, en };

/**
 * Walk a dotted path against the active catalog. Falls back to EL on any
 * miss so the UI is at worst Greek.
 */
export const resolveKey = (locale: Locale, dotted: string): string => {
  const segments = dotted.split('.');
  const tryLocale = (l: Locale): string | undefined => {
    let obj: unknown = CATALOGS[l];
    for (const segment of segments) {
      if (obj && typeof obj === 'object' && segment in (obj as Record<string, unknown>)) {
        obj = (obj as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
    return typeof obj === 'string' ? obj : undefined;
  };
  return tryLocale(locale) ?? tryLocale('el') ?? dotted; // last-ditch: return the key
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export interface T {
  (key: string): string;
  (key: string, vars: Record<string, string | number>): string;
}

export const useT = (): T => {
  const locale = useI18nStore((s) => s.locale);
  return ((key: string, vars?: Record<string, string | number>): string => {
    let out = resolveKey(locale, key);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.replace(`{{${k}}}`, String(v));
      }
    }
    return out;
  }) as T;
};

// ---------------------------------------------------------------------------
// Formatters built on Intl
// ---------------------------------------------------------------------------
const tagFor = (locale: Locale) => (locale === 'el' ? 'el-GR' : 'en-US');

export const formatters = {
  date: (input: Date | number | string, locale: Locale): string =>
    new Intl.DateTimeFormat(tagFor(locale), { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(input)),
  time: (input: Date | number | string, locale: Locale): string =>
    new Intl.DateTimeFormat(tagFor(locale), { hour: '2-digit', minute: '2-digit' }).format(new Date(input)),
  dateTime: (input: Date | number | string, locale: Locale): string =>
    new Intl.DateTimeFormat(tagFor(locale), {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(input)),
  number: (input: number, locale: Locale, opts?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(tagFor(locale), opts).format(input),
  /** "5 minutes ago" / "5 λεπτά πριν". Falls back to English.
   *  `t` is part of the public signature for full i18n-key future-proofing
   *  but is currently unused since the strings are inlined per locale. */
  relative: (input: Date | number | string, locale: Locale, _t: T): string => {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(input).getTime()) / 60_000));
    if (minutes < 60) {
      return locale === 'el'
        ? `${minutes} λεπτά πριν`
        : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return locale === 'el'
        ? `${hours} ώρες πριν`
        : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.round(hours / 24);
    return locale === 'el'
      ? `${days} μέρες πριν`
      : `${days} ${days === 1 ? 'day' : 'days'} ago`;
  },
};

// ---------------------------------------------------------------------------
// Convenience: read-only accessors (used outside React render trees).
// ---------------------------------------------------------------------------
export const currentLocale = (): Locale => useI18nStore.getState().locale;
export const t = (key: string): string => resolveKey(currentLocale(), key);

// ---------------------------------------------------------------------------
// Axios interceptor — attach `Accept-Language` to every request.
// ---------------------------------------------------------------------------
let interceptorInstalled = false;
export const installLanguageInterceptor = () => {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  api.interceptors.request.use((config) => {
    config.headers.set('Accept-Language', currentLocale());
    return config;
  });
};
