/**
 * Haptics helper centralizing the various patterns we use. Every
 * critical UI interaction should call through this so haptic UX is
 * consistent across screens.
 */
import * as Haptics from 'expo-haptics';

export const haptic = {
  /** 10ms tap — chip selections, toggle switches, button presses. */
  select: () => Haptics.selectionAsync(),
  /** 15ms medium thump — primary CTA presses. */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** Heavier — destructive or irreversible actions. */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
