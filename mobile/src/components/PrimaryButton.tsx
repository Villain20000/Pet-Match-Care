import { Pressable, Text, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, Radii, Spacing } from '@/theme';
import * as Haptics from 'expo-haptics';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'invert';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: PrimaryButtonProps) => {
  const palette = (() => {
    switch (variant) {
      case 'primary':
        return { bg: Colors.terracotta, fg: Colors.white, border: Colors.terracottaDeep };
      case 'ghost':
        return { bg: 'transparent', fg: Colors.terracottaDeep, border: Colors.terracottaDeep };
      case 'danger':
        return { bg: Colors.crimson, fg: Colors.white, border: Colors.crimsonDeep };
      case 'invert':
        return { bg: Colors.charcoal, fg: Colors.cream, border: Colors.charcoal };
    }
  })();

  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => {
        if (disabled || loading) return;
        pressed.value = withSpring(1, { damping: 18, stiffness: 220 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 18, stiffness: 220 });
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
      style={[
        animatedStyle,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md + 2,
          borderRadius: Radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          borderWidth: variant === 'ghost' ? 2 : 0,
          borderColor: palette.border,
        },
        fullWidth ? { width: '100%' } : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={{ color: palette.fg, fontWeight: '700', fontSize: 15, letterSpacing: 0.4 }}>
          {title.toUpperCase()}
        </Text>
      )}
    </Pressable>
  );
};
