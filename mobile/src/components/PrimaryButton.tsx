import { Pressable, Text, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
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

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
      style={[
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
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth ? { width: '100%' } : null,
        style,
      ]}
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
