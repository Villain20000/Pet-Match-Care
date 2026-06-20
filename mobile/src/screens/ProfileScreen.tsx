/**
 * ProfileScreen — the user's own profile: avatar, name, role, karma, member
 * since, quick stats (reports / favorites / badges), recent badges, and
 * shortcuts to Settings + Favorites. Inline edit for the display name and
 * avatar (avatar uses the image picker → uploaded via /auth/me PATCH).
 *
 * Theme-aware via useThemeColors(); strings flow through useT().
 */
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigation } from '@/navigation/types';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { Radii, Shadows, Spacing } from '@/theme';
import { useThemeColors } from '@/services/theme';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { useMyBadges } from '@/services/badges';
import { useFavoritePets } from '@/services/favorites';
import { reportsApi } from '@/services/reports';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import { haptic } from '@/services/haptics';
import type { Role } from '@/types';

const roleLabel = (role: Role, t: (k: string) => string): string => {
  switch (role) {
    case 'CITIZEN':
      return t('profile.roleCitizen');
    case 'VOLUNTEER':
      return t('profile.roleVolunteer');
    case 'MUNICIPAL_WORKER':
      return t('profile.roleMunicipalWorker');
    case 'SHELTER_ADMIN':
      return t('profile.roleShelterAdmin');
    case 'PLATFORM_ADMIN':
      return t('profile.rolePlatformAdmin');
    default:
      return role;
  }
};

export const ProfileScreen = () => {
  const navigation = useNavigation<AppNavigation>();
  const { colors } = useThemeColors();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);

  const myBadges = useMyBadges();
  const favorites = useFavoritePets();
  const myReports = useQuery({
    queryKey: ['profile', 'my-reports'],
    queryFn: async () => {
      // Reuse the nearby endpoint with a wide radius as a stand-in for
      // "my reports" until a dedicated /reports/mine endpoint exists.
      const list = await reportsApi.nearby(0, 0, 9999).catch(() => []);
      return list;
    },
    staleTime: 60_000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([myBadges.refetch(), favorites.refetch(), myReports.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    // Best-effort: persist avatar URL. A real upload pipeline would push
    // the blob to storage first; here we store the local URI as a placeholder.
    try {
      await api.patch('/auth/me', { avatarUrl: uri });
      useAuthStore.setState((s) => (s.user ? { user: { ...s.user, avatarUrl: uri } } : s));
      haptic.success();
      toast.success({ title: t('profile.saved') });
    } catch {
      haptic.error();
    }
  };

  const saveName = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', { fullName: name.trim() });
      useAuthStore.setState((s) => (s.user ? { user: { ...s.user, fullName: name.trim() } } : s));
      haptic.success();
      toast.success({ title: t('profile.saved') });
      setEditing(false);
    } catch {
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  const initials = (user.fullName ?? user.email).slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.hero }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.terracotta} />}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.charcoalSoft }}>
          {t('profile.overline')}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.4, marginTop: 2 }}>
          {t('profile.title')}
        </Text>

        {/* Header card */}
        <View
          style={[
            {
              marginTop: Spacing.lg,
              backgroundColor: colors.creamSoft,
              borderRadius: Radii.xl,
              padding: Spacing.xl,
              alignItems: 'center',
            },
            Shadows.soft,
          ]}
        >
          <Pressable onPress={pickAvatar} android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 96, height: 96, borderRadius: 48, ...Shadows.soft }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.terracotta,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Shadows.soft,
                }}
              >
                <Text style={{ fontSize: 32, fontWeight: '700', color: colors.white }}>{initials}</Text>
              </View>
            )}
            <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: colors.charcoalSoft }}>
              {t('profile.editAvatar')}
            </Text>
          </Pressable>

          {editing ? (
            <View style={{ marginTop: Spacing.md, width: '100%' }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('profile.editName')}
                placeholderTextColor={colors.charcoalSoft}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: Radii.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm + 2,
                  fontSize: 16,
                  color: colors.charcoal,
                  textAlign: 'center',
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.sm }}>
                <Pressable
                  onPress={() => { setEditing(false); setName(user.fullName ?? ''); }}
                  style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                >
                  <Text style={{ color: colors.charcoalSoft, fontWeight: '700' }}>{t('settings.cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={saveName}
                  disabled={saving}
                  style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.terracotta, borderRadius: Radii.pill }}
                >
                  <Text style={{ color: colors.white, fontWeight: '700' }}>
                    {saving ? t('common.loading') : t('common.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => { setName(user.fullName ?? ''); setEditing(true); void Haptics.selectionAsync(); }}
              style={{ marginTop: Spacing.sm, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.3 }}>
                {user.fullName ?? t('dashboard.greetingFallbackName')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.charcoalSoft, marginTop: 2 }}>{user.email}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm }}>
                <View style={{ backgroundColor: colors.terracottaSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radii.pill }}>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 12 }}>{roleLabel(user.role, t)}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.charcoalSoft }}>🐾 {user.karmaPoints.toLocaleString()} {t('profile.karma')}</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.charcoal, marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
          {t('profile.stats')}
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          {[
            { label: t('profile.statReports'), value: myReports.data?.length ?? 0, icon: '📍' },
            { label: t('profile.statFavorites'), value: favorites.data?.length ?? 0, icon: '⭐' },
            { label: t('profile.statBadges'), value: myBadges.data?.length ?? 0, icon: '🏅' },
          ].map((s) => (
            <View
              key={s.label}
              style={[{ flex: 1, backgroundColor: colors.white, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center' }, Shadows.hush]}
            >
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.charcoal, marginTop: 4 }}>{s.value}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.charcoalSoft, letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges preview */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.charcoal, marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
          {t('profile.sectionBadges')}
        </Text>
        {myBadges.isLoading ? (
          <ActivityIndicator color={colors.terracotta} />
        ) : (myBadges.data?.length ?? 0) === 0 ? (
          <Text style={{ color: colors.charcoalSoft, fontSize: 13 }}>{t('badges.empty')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(myBadges.data ?? []).slice(0, 10).map((b) => (
              <View
                key={b.id}
                style={[{ marginRight: Spacing.md, backgroundColor: colors.white, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', minWidth: 84 }, Shadows.hush]}
              >
                <Text style={{ fontSize: 28 }}>{b.iconEmoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.charcoal, marginTop: 4, textAlign: 'center' }}>{b.name}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Shortcuts */}
        <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
          <Pressable
            onPress={() => navigation.navigate('Favorites')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: Radii.lg, padding: Spacing.md }, Shadows.hush]}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>⭐</Text>
            <Text style={{ flex: 1, fontWeight: '700', color: colors.charcoal }}>{t('profile.openFavorites')}</Text>
            <Text style={{ color: colors.charcoalSoft }}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Ρυθμίσεις')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: Radii.lg, padding: Spacing.md }, Shadows.hush]}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>⚙️</Text>
            <Text style={{ flex: 1, fontWeight: '700', color: colors.charcoal }}>{t('profile.openSettings')}</Text>
            <Text style={{ color: colors.charcoalSoft }}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
