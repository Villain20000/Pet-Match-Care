import { View, Text, Pressable } from 'react-native';
import { useT, useI18nStore } from '@/services/i18n';
import { Colors, Radii } from '@/theme';
import { haptic } from '@/services/haptics';
import type { Locale } from '@/services/i18n';

export const LanguageSwitcher = () => {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);

  const opts: { value: Locale; label: string }[] = [
    { value: 'el', label: '🇬🇷 Ελληνικά' },
    { value: 'en', label: '🇬🇧 English' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.creamSoft,
        borderRadius: Radii.pill,
        padding: 4,
      }}
    >
      {opts.map((o) => {
        const active = locale === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              haptic.tap();
              void setLocale(o.value);
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: Radii.pill,
              alignItems: 'center',
              backgroundColor: active ? Colors.terracotta : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? Colors.white : Colors.charcoal,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
