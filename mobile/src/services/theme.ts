/**
 * Theme store — owns the dark-mode preference and resolves the active color
 * palette. The preference is one of `system` (follow the OS), `light`, or
 * `dark`; it is persisted in AsyncStorage and hydrated on boot.
 *
 * `useThemeColors()` returns the resolved `ColorPalette` (light or dark) and
 * re-renders any subscribed component when the effective scheme changes —
 * whether because the user flipped the toggle or the OS scheme flipped.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { Colors, DarkColors, type ColorPalette } from '@/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type EffectiveScheme = 'light' | 'dark';

const STORAGE_KEY = '@pmc/themeMode';

interface ThemeState {
  mode: ThemeMode;
  ready: boolean;
  setMode: (m: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  ready: false,
  setMode: async (mode) => {
    set({ mode });
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        set({ mode: stored, ready: true });
        return;
      }
      set({ ready: true });
    } catch {
      set({ ready: true });
    }
  },
}));

/** Resolve the effective scheme from the user preference + OS hint. */
export const resolveScheme = (mode: ThemeMode, system: EffectiveScheme | null | undefined): EffectiveScheme => {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
};

/**
 * Hook: returns the active color palette. Subscribes to both the user's
 * theme-mode preference and the OS color scheme, so a `system` preference
 * flips live when the user changes their phone's dark-mode setting.
 */
export const useThemeColors = (): { colors: ColorPalette; scheme: EffectiveScheme } => {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme() as EffectiveScheme | null | undefined;
  const scheme = resolveScheme(mode, system);
  return { colors: scheme === 'dark' ? DarkColors : Colors, scheme };
};

/**
 * Subscribe to OS scheme changes even when the component does not otherwise
 * need to render off the palette. Mounted once at the app root so the store
 * is always in sync with the OS.
 */
export const useObserveSystemScheme = () => {
  const system = useColorScheme() as EffectiveScheme | null | undefined;
  const mode = useThemeStore((s) => s.mode);
  useEffect(() => {
    /* no-op: reading `system` is enough to make this component re-render
       on OS scheme change, which in turn re-renders children that read the
       palette via useThemeColors. */
    void system;
    void mode;
  }, [system, mode]);
};
