/**
 * Accessibility helpers. Holds the dynamic-type scale, a high-contrast
 * colour override, and a color-blind mode toggle (crimson → amber).
 */
import { AccessibilityInfo, PixelRatio, useColorScheme as useRNColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

export type ContrastMode = 'normal' | 'high';
export type ColorBlindPreset = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const highContrast = {
  background: '#000000',
  card: '#0E0E0E',
  text: '#FFFFFF',
  muted: '#C8C8C8',
  primary: '#FFB199', // was terracotta
  success: '#A4F4C0', // was sage
  danger: '#FF6A78', // was crimson
};

export const colorBlindShifts: Record<ColorBlindPreset, { crimson: string; sage: string }> = {
  normal:       { crimson: '#E63946', sage: '#81B29A' },
  protanopia:   { crimson: '#D67B00', sage: '#A88CC8' },
  deuteranopia: { crimson: '#E07A00', sage: '#A88C66' },
  tritanopia:   { crimson: '#D05A7A', sage: '#7FB29A' },
} as const;

export const useDynamicType = () => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const raw = PixelRatio.getFontScale();
      setScale(Math.max(0.9, Math.min(1.6, raw)));
    };
    update();
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', update);
    return () => sub.remove();
  }, []);
  return scale;
};

/** Lightweight pass-through to react-native's `useColorScheme` under our own
 *  name so callers can later add a high-contrast override without churning
 *  every screen. */
export const useColorScheme = (): 'light' | 'dark' | null | undefined => useRNColorScheme();

/** Returns an `accessibilityLabel`-ready phrase for any text view. */
export const tts = {
  pet: (name: string, urgent: boolean) =>
    `${name}${urgent ? ', επείγουσα υιοθεσία' : ''}`,
  spot: (category: string, name: string, verified: boolean) =>
    `${category}, ${name}${verified ? ', επαληθευμένο' : ''}`,
  poison: (distanceKm?: number) =>
    distanceKm !== undefined ? `Προειδοποίηση φόλας, ${distanceKm.toFixed(1)} χιλιόμετρα μακριά` : 'Προειδοποίηση φόλας',
};
