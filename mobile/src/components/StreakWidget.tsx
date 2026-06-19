/**
 * Streak widget — animated flame that grows with the streak and triggers
 * a check-in when tapped (submits /streaks/check-in once per day).
 */
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/services/haptics';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { useCheckIn, useCurrentStreak } from '@/services/streaks';

export const StreakWidget = () => {
  const { data: streak = 0 } = useCurrentStreak();
  const { mutate: checkIn, isPending } = useCheckIn();

  const flameScale = useSharedValue(1);
  useEffect(() => {
    flameScale.value = withSpring(1 + Math.min(0.6, streak / 30), { damping: 12 });
  }, [streak, flameScale]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const onPress = () => {
    haptic.tap();
    checkIn();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: streak >= 7 ? Colors.terracotta : Colors.creamSoft,
        borderRadius: Radii.pill,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        ...Shadows.soft,
      }}
    >
      <Animated.Text
        style={[{ fontSize: 22, marginRight: 6 }, flameStyle]}
        accessibilityLabel={`${streak} μέρες σερί`}
      >
        🔥
      </Animated.Text>
      <View>
        <Text
          style={{
            fontWeight: '700',
            color: streak >= 7 ? Colors.white : Colors.charcoal,
            fontSize: 15,
            lineHeight: 18,
          }}
        >
          {streak}
        </Text>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 0.5,
            color: streak >= 7 ? Colors.white : Colors.charcoalSoft,
            opacity: 0.85,
          }}
        >
          ΣΕΡΙ ΗΜΕΡΩΝ
        </Text>
      </View>
    </Pressable>
  );
};
