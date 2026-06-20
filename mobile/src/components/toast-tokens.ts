import { Colors } from '@/theme';
import type { ToastVariant } from '@/services/toast';

/**
 * Single source of truth for the toast visual surface.
 *
 * Why this lives in its own module:
 *  ─ ToastHost consumes these maps at render time and the visual-regression
 *    test (`mobile/scripts/test-toast-variants.tsx`) consumes them as the
 *    ground truth. Decoupling the maps from `<ToastHost />` means any
 *    palette drift in the host is caught by the test independently of
 *    whatever else gets refactored in the host.
 *  ─ NativeWind / Tailwind dark-mode candidates can swap palettes by
 *    importing a different `VARIANT_PALETTE` from here — no host edit.
 *
 * Keep the four-variant contract intact. The host, the test, and the
 * Storybook-style visual reference all enumerate the same `ToastVariant`
 * keys.
 */
export const VARIANT_ICON: Record<ToastVariant, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '🚫',
};

export const VARIANT_PALETTE: Record<
  ToastVariant,
  { bg: string; text: string; accent: string }
> = {
  info:    { bg: Colors.creamSoft,     text: Colors.charcoal, accent: Colors.terracotta },
  success: { bg: Colors.sageSoft,      text: Colors.charcoal, accent: Colors.sageDeep },
  warning: { bg: Colors.terracottaSoft, text: Colors.charcoal, accent: Colors.terracottaDeep },
  error:   { bg: Colors.crimsonDeep,   text: Colors.white,    accent: Colors.crimson },
};

/**
 * Stable ordering — used by the test enumerator and by future horizontal
 * list-like surfaces. Don't reorder without updating downstream consumers.
 */
export const TOAST_VARIANT_ORDER: readonly ToastVariant[] = [
  'info',
  'success',
  'warning',
  'error',
] as const;
