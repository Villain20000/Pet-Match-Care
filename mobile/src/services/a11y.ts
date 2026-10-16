/**
 * Accessibility helpers. Holds the dynamic-type scale, a high-contrast
 * colour override, and a color-blind mode toggle (crimson → amber).
 */
import { AccessibilityInfo, PixelRatio, useColorScheme as useRNColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

export {
  highContrast,
  colorBlindShifts,
  type ContrastMode,
  type ColorBlindPreset,
} from '@/theme';

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
