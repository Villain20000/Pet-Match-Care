/**
 * Server-side i18n helper.
 *
 * Resolution order for an incoming request:
 *   1. `req.user.locale` — what the user saved on their profile (PATCH /me).
 *   2. `Accept-Language` header — what their HTTP client said.
 *   3. `'el'` — Greek is the project's source-of-truth fallback.
 *
 * Greek is the source-of-truth catalog (`el.ts`); the English mirror
 * is typed `ServerPane = typeof el` so a missing key is a compile error.
 */
import type { Request } from 'express';

import { el, type ServerPane } from '@/locales/el';
import { en } from '@/locales/en';

export type Locale = 'el' | 'en';
export type SupportedLocale = Locale;

const CATALOGS: Record<Locale, ServerPane> = { el, en };

/** Pull a preferred locale from a comma-separated Accept-Language header. */
export const negotiateLocale = (headerValue?: string | null): Locale => {
  if (!headerValue) return 'el';
  const primary = headerValue
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase() ?? '')
    .find((tag) => tag.length > 0);
  if (!primary) return 'el';
  if (primary.startsWith('el')) return 'el';
  if (primary.startsWith('en')) return 'en';
  return 'el';
};

/** Walk a dotted key against the catalog with `el` fallback on miss. */
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
  return tryLocale(locale) ?? tryLocale('el') ?? dotted;
};

/**
 * Get the locale for a given request. Authenticated users win over
 * the header, since they persisted their preference on the server.
 */
export const localeForRequest = (req: Request): Locale => {
  const userLocale = (req as any).user?.locale as Locale | undefined;
  if (userLocale === 'el' || userLocale === 'en') return userLocale;
  return negotiateLocale(req.headers['accept-language']);
};

export const tForLocale = (locale: Locale, key: string, vars?: Record<string, string | number>): string => {
  let out = resolveKey(locale, key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(`{{${k}}}`, String(v));
    }
  }
  return out;
};

export const tForRequest = (req: Request, key: string, vars?: Record<string, string | number>): string =>
  tForLocale(localeForRequest(req), key, vars);

/**
 * Build a bilingual `messages` envelope — used by every error response
 * so the client can pick its localized text without a second round-trip.
 */
export const bilingualMessages = (key: string, vars?: Record<string, string | number>): { en: string; el: string } => ({
  en: tForLocale('en', key, vars),
  el: tForLocale('el', key, vars),
});
