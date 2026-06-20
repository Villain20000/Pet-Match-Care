import {
  View,
  Text,
  ViewProps,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

// Re-export so screens can treat `ui.tsx` as the canonical component bucket
// without having to remember per-component file paths.
export { PrimaryButton } from '@/components/PrimaryButton';

interface PillProps extends PressableProps {
  variant?: 'sage' | 'terracotta' | 'crimson' | 'cream' | 'charcoal';
  active?: boolean;
  label: string;
  leadingIcon?: string;
  trailingIcon?: string;
  style?: StyleProp<ViewStyle>;
}

const variantMap = {
  sage: { bg: Colors.sage, fg: Colors.white },
  terracotta: { bg: Colors.terracotta, fg: Colors.white },
  crimson: { bg: Colors.crimson, fg: Colors.white },
  cream: { bg: Colors.creamSoft, fg: Colors.charcoal },
  charcoal: { bg: Colors.charcoal, fg: Colors.white },
} as const;

export const Pill = ({
  variant = 'sage',
  active = true,
  label,
  leadingIcon,
  trailingIcon,
  style,
  onPress,
  ...rest
}: PillProps): React.ReactElement => {
  const palette = variantMap[variant];
  const handlePress = (e: any) => {
    void Haptics.selectionAsync();
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
      style={[
        {
          backgroundColor: active ? palette.bg : Colors.creamSoft,
          borderRadius: Radii.pill,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm + 2,
          alignSelf: 'flex-start',
          opacity: active ? 1 : 0.65,
        },
        style,
      ]}
      {...rest}
    >
      <Text
        style={{
          color: active ? palette.fg : Colors.charcoal,
          fontWeight: '600',
          fontSize: 13,
          letterSpacing: 0.1,
        }}
      >
        {leadingIcon ? `${leadingIcon}  ` : ''}
        {label}
        {trailingIcon ? `  ${trailingIcon}` : ''}
      </Text>
    </Pressable>
  );
};

interface KarmaPillProps extends ViewProps {
  points: number;
}

export const KarmaPill = ({ points, style, ...rest }: KarmaPillProps) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm - 2,
        borderRadius: Radii.pill,
        backgroundColor: Colors.creamSoft,
        ...Shadows.hush,
      },
      style,
    ]}
    {...rest}
  >
    <Text style={{ fontSize: 16, marginRight: 6 }}>🐾</Text>
    <Text
      style={{
        fontWeight: '700',
        fontSize: 14,
        color: Colors.terracottaDeep,
        letterSpacing: 0.2,
      }}
    >
      {points.toLocaleString('el-GR')}
    </Text>
    <Text
      style={{
        marginLeft: 4,
        fontSize: 11,
        fontWeight: '600',
        color: Colors.charcoalSoft,
      }}
    >
      ΠΟΝΤΟΙ ΚΑΡΜΑ
    </Text>
  </View>
);

interface ScreenContainerProps extends ViewProps {
  padded?: boolean;
}

export const ScreenContainer = ({ padded = true, style, children, ...rest }: ScreenContainerProps) => (
  <View
    style={[
      { flex: 1, backgroundColor: Colors.cream },
      padded && { paddingHorizontal: Spacing.xl },
      style,
    ]}
    {...rest}
  >
    {children}
  </View>
);

interface SectionLabelProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionLabel = ({ title, subtitle, right, style }: SectionLabelProps) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginVertical: Spacing.md,
      },
      style,
    ]}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: Colors.charcoal,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: 13,
            color: Colors.charcoalSoft,
            letterSpacing: 0.1,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
    {right}
  </View>
);

/**
 * Animated chip used for the map's floating category filters.
 * Wrapped in a Pressable for tap-target delight + haptic selection.
 */
export interface FloatingChipProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const FloatingChip = ({ icon, label, active, onPress, style }: FloatingChipProps) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
  }));

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 18, stiffness: 220 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 18, stiffness: 220 });
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
      style={[
        animatedStyle,
        {
          backgroundColor: active ? Colors.charcoal : Colors.white,
          borderRadius: Radii.pill,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: 8,
          ...Shadows.soft,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: 14, marginRight: 6, color: active ? Colors.white : Colors.charcoal }}>
        {icon}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.2,
          color: active ? Colors.white : Colors.charcoal,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

interface PrimaryCardProps extends ViewProps {
  tinted?: boolean;
}

export const PrimaryCard = ({ tinted, style, children, ...rest }: PrimaryCardProps) => (
  <View
    style={[
      {
        backgroundColor: tinted ? Colors.creamSoft : Colors.white,
        borderRadius: Radii.xl,
        padding: Spacing.xl,
        ...Shadows.soft,
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </View>
);

interface HeatBadgeProps {
  label: string;
  gradient?: readonly [string, string];
}

export const HeatBadge = ({ label, gradient = ['#E07A5F', '#F2A287'] as const }: HeatBadgeProps) => (
  <LinearGradient
    colors={gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radii.pill,
      alignSelf: 'flex-start',
    }}
  >
    <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 11, letterSpacing: 0.4 }}>
      {label}
    </Text>
  </LinearGradient>
);
