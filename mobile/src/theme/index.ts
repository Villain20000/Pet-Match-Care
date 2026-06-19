/**
 * Pet-Match & Care — design tokens (v2).
 * Exports both the classic palette AND a `themeFor()` helper that
 * switches to a colour-blind / high-contrast palette based on user
 * preference.
 */

export const Colors = {
  terracotta: '#E07A5F',
  terracottaSoft: '#F2A287',
  terracottaDeep: '#C25B3F',
  sage: '#81B29A',
  sageSoft: '#A8C9B7',
  sageDeep: '#5A8F77',
  crimson: '#E63946',
  crimsonSoft: '#F26B76',
  crimsonDeep: '#B82A35',
  cream: '#F4F1DE',
  creamSoft: '#FBF8E8',
  creamDeep: '#E8E4C9',
  charcoal: '#2F3E46',
  charcoalSoft: '#4A5C66',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;

export const Gradients = {
  warmHorizon: ['#E07A5F', '#F2A287'] as const,
  calmGrove: ['#81B29A', '#A8C9B7'] as const,
  emergency: ['#E63946', '#F26B76'] as const,
  midnight: ['#2F3E46', '#4A5C66'] as const,
};

export const Shadows = {
  soft: {
    shadowColor: '#2F3E46',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heavy: {
    shadowColor: '#2F3E46',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  hush: {
    shadowColor: '#2F3E46',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  hero: 40,
} as const;

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 9999,
} as const;

export const Typography = {
  display: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  title: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2 },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export const POISON_RADIUS_KM = 2;

// ---------------------------------------------------------------------------
// Theme resolver (color-blind mode + high-contrast)
// ---------------------------------------------------------------------------
import type { ColorBlindPreset, ContrastMode } from '@/services/a11y';
import { colorBlindShifts } from '@/services/a11y';

export interface Theme {
  colors: typeof Colors;
  contrast: ContrastMode;
  cb: ColorBlindPreset;
}

export const themeFor = (cb: ColorBlindPreset, contrast: ContrastMode): Theme => {
  const shifts = colorBlindShifts[cb];
  return {
    colors: { ...Colors, crimson: shifts.crimson, sage: shifts.sage },
    contrast,
    cb,
  };
};
