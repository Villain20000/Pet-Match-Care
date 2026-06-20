/**
 * SettingsHub — central settings screen with sections for security,
 * accessibility, language, and account.
 *
 * Every Greek-facing string now flows through `useT()` for live locale
 * switching. The high-contrast + color-blind pickers stay client-only.
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigation } from '@/navigation/types';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { Radii, Shadows, Spacing } from '@/theme';
import { useThemeColors, useThemeStore, type ThemeMode } from '@/services/theme';
import { SectionLabel } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { haptic } from '@/services/haptics';

const cbOptions = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
type CB = typeof cbOptions[number];

const themeModes: ThemeMode[] = ['system', 'light', 'dark'];

interface SettingsScreenProps {
  contrast: 'normal' | 'high';
  setContrast: (v: 'normal' | 'high') => void;
  colorBlind: CB;
  setColorBlind: (v: CB) => void;
}

export const SettingsScreen = ({ contrast, setContrast, colorBlind, setColorBlind }: SettingsScreenProps) => {
  const t = useT();
  const { colors } = useThemeColors();
  const navigation = useNavigation<AppNavigation>();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutEverywhere = useAuthStore((s) => s.logoutEverywhere);

  const [sessions, setSessions] = useState<{ id: string; lastActiveAt: string; userAgent?: string | null }[] | null>(null);

  const refreshSessions = async () => {
    try {
      const res = await fetchSessions();
      setSessions(res);
    } catch {
      /* keep prior list */
    }
  };

  const onLogoutEverywhere = () => {
    haptic.warning();
    Alert.alert(
      t('settings.logoutEverywhereConfirm'),
      t('settings.logoutEverywhereConfirmBody'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        { text: t('settings.signOutConfirm'), style: 'destructive', onPress: () => void logoutEverywhere() },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.4 }}>
          {t('settings.title')}
        </Text>

        {/* Profile shortcut */}
        <SectionLabel title={t('settings.profileTitle')} />
        <SettingsCard>
          <SettingsRow
            title={user?.fullName ?? t('dashboard.greetingFallbackName')}
            subtitle={user?.email ?? ''}
            actionLabel={t('settings.profileAction')}
            onPress={() => navigation.navigate('Profile')}
          />
        </SettingsCard>

        {/* Language */}
        <SectionLabel title={t('settings.languageTitle')} subtitle={t('settings.languageHint')} />
        <View
          style={[{
            backgroundColor: colors.white,
            borderRadius: Radii.lg,
            padding: Spacing.md,
            ...Shadows.soft,
          }]}
        >
          <LanguageSwitcher />
        </View>

        {/* Appearance */}
        <SectionLabel title={t('settings.sectionAppearance')} subtitle={t('settings.darkModeHint')} />
        <SettingsCard>
          <SettingsPicker
            label={t('settings.darkMode')}
            value={themeMode}
            options={themeModes as unknown as string[]}
            optionLabel={(m) => (m === 'system' ? t('settings.themeSystem') : m === 'light' ? t('settings.themeLight') : t('settings.themeDark'))}
            onChange={(v) => { haptic.select(); void setThemeMode(v as ThemeMode); }}
          />
        </SettingsCard>

        {/* Security */}
        <SectionLabel title={t('settings.sectionSecurity')} />
        <SettingsCard>
          <SettingsRow
            title={t('settings.twoFATitle')}
            subtitle={user?.totpEnabled ? t('settings.twoFASubtitleActive') : t('settings.twoFASubtitleInactive')}
            actionLabel={user?.totpEnabled ? t('settings.twoFAAction') : t('settings.twoFAActionEnable')}
            onPress={() => {
              /* navigation request */
            }}
          />
          <SettingsRow
            title={t('settings.sessionsTitle')}
            subtitle={t('settings.sessionsSubtitle')}
            actionLabel={t('settings.sessionsAction')}
            onPress={refreshSessions}
          />
        </SettingsCard>
        {sessions ? (
          <View style={{ marginTop: Spacing.sm }}>
            {sessions.map((s) => (
              <View key={s.id} style={{
                padding: Spacing.md,
                borderRadius: Radii.md,
                backgroundColor: colors.creamSoft,
                marginBottom: 6,
              }}>
                <Text style={{ fontWeight: '600', color: colors.charcoal }}>{s.userAgent ?? 'Device'}</Text>
                <Text style={{ fontSize: 12, color: colors.charcoalSoft }}>
                  {`Last active: ${new Date(s.lastActiveAt).toLocaleString()}`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <SectionLabel title={t('settings.sectionAccessibility')} />
        <SettingsCard>
          <SettingsToggle
            label={t('settings.highContrast')}
            value={contrast === 'high'}
            onChange={(v) => { haptic.select(); setContrast(v ? 'high' : 'normal'); }}
          />
          <SettingsPicker
            label={t('settings.colorBlind')}
            value={colorBlind}
            options={cbOptions as unknown as string[]}
            onChange={(v) => setColorBlind(v as CB)}
          />
        </SettingsCard>

        <SectionLabel title={t('settings.sectionAccount')} />
        <SettingsCard>
          <SettingsRow
            title={t('settings.logoutEverywhereTitle')}
            subtitle={t('settings.logoutEverywhereSubtitle')}
            actionLabel={t('settings.logoutEverywhereAction')}
            destructive
            onPress={onLogoutEverywhere}
          />
          <SettingsRow
            title={t('settings.deleteTitle')}
            subtitle={t('settings.deleteSubtitle')}
            actionLabel={t('settings.deleteAction')}
            destructive
            onPress={() => {
              haptic.warning();
              Alert.alert(t('settings.deleteTitle'), t('settings.deleteConfirmBody'), [
                { text: t('settings.cancel'), style: 'cancel' },
                { text: t('settings.deleteAction'), style: 'destructive', onPress: () => void logout() },
              ]);
            }}
          />
        </SettingsCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingsCard = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useThemeColors();
  return (
  <View
    style={[{
      backgroundColor: colors.white,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      ...Shadows.soft,
    }]}
  >
    {children}
  </View>
  );
};

const SettingsRow = ({ title, subtitle, actionLabel, destructive, onPress }: {
  title: string; subtitle?: string; actionLabel: string;
  destructive?: boolean; onPress: () => void;
}) => {
  const { colors } = useThemeColors();
  return (
  <Pressable
    onPress={onPress}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.creamDeep,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: '600', color: colors.charcoal }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 12, color: colors.charcoalSoft, marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
    <Text style={{ color: destructive ? colors.crimson : colors.terracotta, fontWeight: '700' }}>
      {actionLabel}
    </Text>
  </Pressable>
  );
};

const SettingsToggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => {
  const { colors } = useThemeColors();
  return (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.creamDeep,
  }}>
    <Text style={{ flex: 1, fontWeight: '600', color: colors.charcoal }}>{label}</Text>
    <Switch value={value} onValueChange={onChange} thumbColor={value ? colors.terracotta : colors.creamDeep} />
  </View>
  );
};

const SettingsPicker = ({ label, value, options, optionLabel, onChange }: {
  label: string; value: string; options: string[];
  optionLabel?: (o: string) => string;
  onChange: (v: string) => void;
}) => {
  const { colors } = useThemeColors();
  return (
  <View style={{ paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.creamDeep }}>
    <Text style={{ fontWeight: '600', color: colors.charcoal, marginBottom: 8 }}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const active = value === o;
        const display = optionLabel ? optionLabel(o) : o;
        return (
          <Pressable
            key={o}
            onPress={() => { haptic.select(); onChange(o); }}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={{
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
              backgroundColor: active ? colors.terracotta : colors.creamSoft,
            }}
          >
            <Text style={{ color: active ? colors.white : colors.charcoal, fontWeight: '700', fontSize: 12 }}>
              {display}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
  );
};

async function fetchSessions() {
  const { api } = await import('@/services/api');
  const res = await api.get('/auth/sessions');
  return res.data.sessions as { id: string; lastActiveAt: string; userAgent: string | null }[];
}
