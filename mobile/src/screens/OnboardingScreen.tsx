/**
 * OnboardingScreen — 5-card tour shown on first run.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Shadows, Spacing } from '@/theme';
import { useThemeColors } from '@/services/theme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { haptic } from '@/services/haptics';
import { useT } from '@/services/i18n';
import type { RootStackScreenProps } from '@/navigation/types';

interface SlideDef {
  icon: string;
  titleKey: string;
  bodyKey: string;
  accent?: string;
}

const SLIDE_DEFS: SlideDef[] = [
  { icon: '🚨', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  {
    icon: '☠️',
    titleKey: 'onboarding.slide2Title',
    bodyKey: 'onboarding.slide2Body',
    accent: Colors.crimson,
  },
  {
    icon: '🐾',
    titleKey: 'onboarding.slide3Title',
    bodyKey: 'onboarding.slide3Body',
    accent: Colors.terracotta,
  },
  {
    icon: '🏅',
    titleKey: 'onboarding.slide4Title',
    bodyKey: 'onboarding.slide4Body',
    accent: Colors.sage,
  },
  {
    icon: '🌍',
    titleKey: 'onboarding.slide5Title',
    bodyKey: 'onboarding.slide5Body',
    accent: Colors.charcoal,
  },
];

const { width } = Dimensions.get('window');

const AsyncStorageKey = '@petmatchcare/onboardingDone';

export const OnboardingScreen = ({ navigation }: RootStackScreenProps<'Onboarding'>) => {
  const t = useT();
  const { colors } = useThemeColors();
  const [step, setStep] = useState(0);
  const translate = useSharedValue(0);
  useEffect(() => {
    translate.value = withTiming(-step * width, { duration: 300 });
    // width is a module-level constant from Dimensions — safe to omit

  }, [step, translate]);

  const next = async (done = false) => {
    haptic.select();
    if (done || step === SLIDE_DEFS.length - 1) {
      await AsyncStorage.setItem(AsyncStorageKey, 'true');
      navigation.replace('MainStack');
      return;
    }
    setStep((s) => s + 1);
  };

  const skip = async () => {
    haptic.select();
    await AsyncStorage.setItem(AsyncStorageKey, 'true');
    navigation.replace('MainStack');
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translate.value }] }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.skipRow}>
        <Pressable onPress={skip} style={styles.skipBtn}>
          <Text style={{ color: colors.charcoalSoft, fontWeight: '700' }}>{t('common.skip')}</Text>
        </Pressable>
      </View>

      <Animated.View style={[styles.track, animatedStyle]}>
        {SLIDE_DEFS.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View
              style={[
                styles.glyph,
                Shadows.soft,
                { backgroundColor: SLIDE_DEFS[i]!.accent ?? colors.terracotta },
              ]}
            >
              <Text style={{ fontSize: 60 }}>{slide.icon}</Text>
            </View>
            <Text style={[styles.title, { color: colors.charcoal }]}>{t(slide.titleKey)}</Text>
            <Text style={[styles.body, { color: colors.charcoalSoft }]}>{t(slide.bodyKey)}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.hero }}>
        <View style={styles.dots}>
          {SLIDE_DEFS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.terracotta : colors.creamDeep,
                  width: i === step ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>
        <PrimaryButton
          title={step === SLIDE_DEFS.length - 1 ? t('onboarding.ctaDone') : t('onboarding.ctaContinue')}
          onPress={() => next()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = {
  track: { flexDirection: 'row' as const },
  slide: { width, padding: Spacing.xl, alignItems: 'center' as const, justifyContent: 'center' as const },
  glyph: {
    width: 140, height: 140, borderRadius: 70, alignItems: 'center' as const, justifyContent: 'center' as const,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, textAlign: 'center' as const,
  },
  body: {
    marginTop: Spacing.sm, fontSize: 15, textAlign: 'center' as const,
    lineHeight: 22, maxWidth: 340,
  },
  dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, marginBottom: Spacing.xl, gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skipRow: { padding: Spacing.lg, flexDirection: 'row' as const, justifyContent: 'flex-end' as const },
  skipBtn: { padding: Spacing.sm },
};
