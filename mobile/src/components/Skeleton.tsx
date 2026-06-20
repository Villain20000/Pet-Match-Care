import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Colors, Radii } from '@/theme';

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLine = ({ width = '100%', height = 14, style }: SkeletonLineProps) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    // Cleanup happens by virtue of withRepeat being tied to the component lifecycle.
    // (No explicit stop needed; reanimated handles it on unmount.)
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: Colors.creamDeep,
          width,
          height,
          borderRadius: Radii.xs,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCircle = ({ size = 48 }: { size?: number }) => (
  <SkeletonLine width={size} height={size} style={{ borderRadius: size / 2 }} />
);

export const SkeletonCard = ({ height = 120 }: { height?: number }) => (
  <Animated.View
    style={{
      height,
      borderRadius: Radii.lg,
      backgroundColor: Colors.creamSoft,
      padding: 16,
      gap: 8,
    }}
  >
    <SkeletonLine width="60%" height={12} />
    <SkeletonLine width="40%" height={12} />
    <SkeletonLine width="100%" height={12} style={{ marginTop: 8 }} />
    <SkeletonLine width="80%" height={12} />
  </Animated.View>
);
