import { View, Animated, StyleProp, ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Radii } from '@/theme';

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLine = ({ width = '100%', height = 14, style }: SkeletonLineProps) => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: Colors.creamDeep,
          width,
          height,
          borderRadius: Radii.xs,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCircle = ({ size = 48 }: { size?: number }) => (
  <SkeletonLine width={size} height={size} style={{ borderRadius: size / 2 }} />
);

export const SkeletonCard = ({ height = 120 }: { height?: number }) => (
  <View
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
  </View>
);
