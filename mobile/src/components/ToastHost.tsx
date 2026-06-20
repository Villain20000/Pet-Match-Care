import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastHostProps, useToastStore } from '@/services/toast';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/theme';
import { VARIANT_ICON, VARIANT_PALETTE } from '@/components/toast-tokens';

/**
 * Bottom-snackbar overlay. Mount once at app level inside the
 * NavigationContainer so toasts overlay on top of every screen. Reads from
 * the Zustand store so multiple emitters can push in parallel without
 * needing to thread props through the component tree.
 */
export const ToastHost = (props: ToastHostProps = {}) => {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  const visible = items.slice(-3);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          // Stack above the bottom tab bar; bottom inset from SafeAreaProvider.
          paddingBottom: insets.bottom + (props.bottomOffset ?? Spacing.lg),
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      {visible.map((item) => {
        const palette = VARIANT_PALETTE[item.variant];
        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.springify().damping(18).stiffness(180)}
            exiting={FadeOutDown.duration(220)}
            layout={LinearTransition.springify().damping(22)}
            style={[
              styles.card,
              {
                backgroundColor: palette.bg,
                borderLeftColor: palette.accent,
              },
              Shadows.heavy,
            ]}
          >
            <Text style={styles.icon}>{VARIANT_ICON[item.variant]}</Text>
            <Pressable
              onPress={() => dismiss(item.id)}
              style={styles.bodyPressable}
              accessibilityRole="button"
              accessibilityLabel={`Dismiss ${item.variant} toast`}
            >
              <Text style={[Typography.title, { color: palette.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.body ? (
                <Text
                  style={[Typography.caption, { color: palette.text, marginTop: 2, opacity: 0.85 }]}
                  numberOfLines={3}
                >
                  {item.body}
                </Text>
              ) : null}
            </Pressable>
            {item.cta ? (
              <Pressable
                onPress={() => {
                  item.cta!.onPress();
                  dismiss(item.id);
                }}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                style={[
                  styles.ctaPill,
                  { backgroundColor: palette.accent },
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.cta.label}
              >
                <Text style={styles.ctaLabel}>{item.cta.label}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70 + Spacing.md, // sits above the bottom tab bar height
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  icon: {
    fontSize: 22,
    marginRight: Spacing.md,
  },
  bodyPressable: {
    flex: 1,
  },
  ctaPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    marginLeft: Spacing.sm,
  },
  ctaLabel: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
