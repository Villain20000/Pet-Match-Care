/**
 * OnboardingScreen — 3-card tour shown on first run.
 */
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { PrimaryButton } from '@/components/PrimaryButton';
import { haptic } from '@/services/haptics';
import { useT } from '@/services/i18n';

interface SlideDef {
  icon: string;
  titleKey: string;
  bodyKey: string;
  accent?: string;
}

const SLIDE_DEFS: SlideDef[] = [
  { icon: '🚨', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  {
    icon: '🚨',
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
];

const { width } = Dimensions.get('window');

const AsyncStorageKey = '@petmatchcare/onboardingDone';

export const OnboardingScreen = ({ navigation }: any) => {
  const t = useT();
  const [step, setStep] = useState(0);
  const translate = useSharedValue(0);
  useEffect(() => {
    translate.value = withTiming(-step * width, { duration: 300 });
  }, [step, translate, width]);

  const next = async (done = false) => {
    haptic.select();
    if (done || step === SLIDE_DEFS.length - 1) {
      await AsyncStorage.setItem(AsyncStorageKey, 'true');
      navigation.replace('Main' as never);
      return;
    }
    setStep((s) => s + 1);
  };

  const skip = async () => {
    haptic.select();
    await AsyncStorage.setItem(AsyncStorageKey, 'true');
    navigation.replace('Main' as never);
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translate.value }] }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
      <View style={styles.skipRow}>
        <Pressable onPress={skip} style={styles.skipBtn}>
          <Text style={{ color: Colors.charcoalSoft, fontWeight: '700' }}>{t('common.skip')}</Text>
        </Pressable>
      </View>

      <Animated.View style={[styles.track, animatedStyle]}>
        {SLIDE_DEFS.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View
              style={[
                styles.glyph,
                Shadows.soft,
                { backgroundColor: SLIDE_DEFS[i]!.accent ?? Colors.terracotta },
              ]}
            >
              <Text style={{ fontSize: 60 }}>{slide.icon}</Text>
            </View>
            <Text style={styles.title}>{t(slide.titleKey)}</Text>
            <Text style={styles.body}>{t(slide.bodyKey)}</Text>
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
                  backgroundColor: i === step ? Colors.terracotta : Colors.creamDeep,
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
    fontSize: 28, fontWeight: '700' as const, color: Colors.charcoal, letterSpacing: -0.5, textAlign: 'center' as const,
  },
  body: {
    marginTop: Spacing.sm, fontSize: 15, color: Colors.charcoalSoft, textAlign: 'center' as const,
    lineHeight: 22, maxWidth: 340,
  },
  dots: { flexDirection: 'row' as const, justifyContent: 'center' as const, marginBottom: Spacing.xl, gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skipRow: { padding: Spacing.lg, flexDirection: 'row' as const, justifyContent: 'flex-end' as const },
  skipBtn: { padding: Spacing.sm },
};
