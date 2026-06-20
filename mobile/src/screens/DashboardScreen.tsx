import { useEffect, useState } from 'react';
import { ScrollView, Text, View, RefreshControl, Pressable, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigation } from '@/navigation/types';
import { useAuthStore } from '@/services/auth';
import { reportsApi, municipalitiesApi } from '@/services/reports';
import { KarmaPill, SectionLabel } from '@/components/ui';
import { ActionTile } from '@/components/ActionTile';
import { StreakWidget } from '@/components/StreakWidget';
import { Radii, Shadows, Spacing } from '@/theme';
import type { MunicipalityDto, StrayReportDto } from '@/types';
import { getCurrentLocation } from '@/services/location';
import { useMyApplications } from '@/services/applications';
import { useInbox } from '@/services/notifications';
import { useT, useI18nStore, formatters } from '@/services/i18n';
import { useThemeColors } from '@/services/theme';

const FALLBACK_MUNIS: MunicipalityDto[] = [
  { name: 'Δήμος Αθηναίων', latitude: 37.9842, longitude: 23.7351 },
  { name: 'Δήμος Θεσσαλονίκης', latitude: 40.6401, longitude: 22.9444 },
];

const MOCK_EMERGENCY_NEARBY: StrayReportDto[] = [
  {
    id: 'e1',
    reporterId: 'demo',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
    condition: 'INJURED',
    description: 'Σκυλάκι τραυματισμένο στο πόδι, αιμορραγία. Παρακαλώ βοηθήστε.',
    latitude: 37.984,
    longitude: 23.735,
    addressHint: 'Οδός Ερμού 22, Αθήνα',
    status: 'OPEN',
    assignedMunicipality: 'Δήμος Αθηναίων',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'e2',
    reporterId: 'demo',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800',
    condition: 'INJURED',
    description: 'Γατάκι χωρίς συνείδηση δίπλα σε κάδο.',
    latitude: 37.99,
    longitude: 23.74,
    addressHint: 'Πλατεία Συντάγματος',
    status: 'IN_PROGRESS',
    assignedMunicipality: 'Δήμος Αθηναίων',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'e3',
    reporterId: 'demo',
    imageUrl: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
    condition: 'INJURED',
    description: 'Μικρό σκυλάκι χρειάζεται άμεση κτηνιατρική φροντίδα.',
    latitude: 37.98,
    longitude: 23.73,
    addressHint: 'Εξάρχεια',
    status: 'OPEN',
    assignedMunicipality: 'Δήμος Αθηναίων',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export const DashboardScreen = () => {
  const navigation = useNavigation<AppNavigation>();
  const user = useAuthStore((s) => s.user);
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const { colors } = useThemeColors();

  const [municipality, setMunicipality] = useState<MunicipalityDto>(FALLBACK_MUNIS[0]!);
  const [munis, setMunis] = useState<MunicipalityDto[]>(FALLBACK_MUNIS);
  const [emergencies, setEmergencies] = useState<StrayReportDto[]>(MOCK_EMERGENCY_NEARBY);
  const [refreshing, setRefreshing] = useState(false);
  const [showMuniPicker, setShowMuniPicker] = useState(false);

  // Animated karma count
  const karmaAnim = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    karmaAnim.setValue(0);
    Animated.timing(karmaAnim, {
      toValue: user?.karmaPoints ?? 0,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [user?.karmaPoints, karmaAnim]);

  const apps = useMyApplications();
  const inbox = useInbox();

  useEffect(() => {
    (async () => {
      try {
        const list = await municipalitiesApi.list();
        if (list.length > 0) setMunis(list);
      } catch {
        /* keep fallback */
      }
    })();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const loc = await getCurrentLocation().catch(() => null);
      if (loc) {
        const reports = await reportsApi.nearby(loc.latitude, loc.longitude, 5).catch(() => []);
        setEmergencies(reports.length > 0 ? reports : MOCK_EMERGENCY_NEARBY);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm }}>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('profile.title')}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: colors.terracotta,
            alignItems: 'center', justifyContent: 'center',
            ...Shadows.hush,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.white }}>
            {(user?.fullName ?? user?.email ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: colors.charcoalSoft }}>
            {t('dashboard.greeting')}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.3 }} numberOfLines={1}>
            {user?.fullName ?? t('dashboard.greetingFallbackName')}
          </Text>
        </View>
        <StreakWidget />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: Spacing.hero }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.terracotta} />}
      >
        {/* Municipality + Karma hud */}
        <View style={{ marginTop: Spacing.sm, flexDirection: 'row', gap: Spacing.sm }}>
          <Pressable
            onPress={() => setShowMuniPicker((p) => !p)}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={[
              {
                flex: 1,
                backgroundColor: colors.creamSoft,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderRadius: Radii.lg,
                flexDirection: 'row',
                alignItems: 'center',
              },
              Shadows.hush,
            ]}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🏛️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, letterSpacing: 0.5, fontWeight: '700', color: colors.charcoalSoft }}>
                {t('dashboard.municipalityLabel')}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.charcoal }}>
                {municipality.name}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.charcoalSoft }}>{showMuniPicker ? '▲' : '▼'}</Text>
          </Pressable>

          <KarmaPill points={user?.karmaPoints ?? 0} />
        </View>

        {/* Municipality picker */}
        {showMuniPicker ? (
          <View style={{ marginTop: Spacing.sm, backgroundColor: colors.white, borderRadius: Radii.lg, padding: Spacing.sm }}>
            {munis.map((m: MunicipalityDto) => (
              <Pressable
                key={m.name}
                onPress={() => { setMunicipality(m); setShowMuniPicker(false); }}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                style={{ paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radii.md }}
              >
                <Text style={{ color: colors.charcoal, fontWeight: m.name === municipality.name ? '700' : '500' }}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Quick actions */}
        <SectionLabel title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsSubtitle')} />
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <ActionTile
            icon="🚨"
            title={t('dashboard.actionReportTitle')}
            caption={t('dashboard.actionReportCaption')}
            variant="red"
            onPress={() => navigation.navigate('Καταγραφή')}
            style={{ flex: 1 }}
          />
          <ActionTile
            icon="🐶"
            title={t('dashboard.actionAdoptionTitle')}
            caption={t('dashboard.actionAdoptionCaption')}
            variant="orange"
            onPress={() => navigation.navigate('Υιοθεσίες')}
            style={{ flex: 1 }}
          />
        </View>
        <ActionTile
          icon="🗺️"
          title={t('dashboard.actionMapTitle')}
          caption={t('dashboard.actionMapCaption')}
          variant="green"
          onPress={() => navigation.navigate('Χάρτης')}
          style={{ marginTop: Spacing.md }}
        />

        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
          <ActionTile
            icon="🔍"
            title={t('dashboard.actionLostPetsTitle')}
            caption={t('dashboard.actionLostPetsCaption')}
            variant="orange"
            onPress={() => navigation.navigate('Χαμένα_ζωάκια')}
            style={{ flex: 1 }}
          />
          <ActionTile
            icon="🏅"
            title={t('dashboard.actionBadgesTitle')}
            caption={t('dashboard.actionBadgesCaption')}
            variant="green"
            onPress={() => navigation.navigate('Παράσημα')}
            style={{ flex: 1 }}
          />
        </View>

        <SectionLabel title={t('dashboard.emergencyTitle')} subtitle={t('dashboard.emergencySubtitle')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {emergencies.map((item: StrayReportDto) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate('TimelineScreen', { id: item.id })}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              style={[
                {
                  width: 260,
                  marginRight: Spacing.md,
                  backgroundColor: colors.white,
                  borderRadius: Radii.lg,
                  padding: Spacing.md,
                },
                Shadows.soft,
              ]}
            >
              <View style={{ backgroundColor: colors.crimson, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{t('dashboard.meatballBadge')}</Text>
              </View>
              <Text numberOfLines={2} style={{ marginTop: 6, fontWeight: '700', color: colors.charcoal, fontSize: 14 }}>
                {item.description ?? '—'}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.charcoalSoft }}>📍 {item.addressHint ?? '—'}</Text>
              <Text style={{ marginTop: 4, fontSize: 11, color: colors.charcoalSoft }}>
                {formatters.relative(item.createdAt, locale, t)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionLabel title={t('dashboard.notificationsTitle')} right={
          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ color: colors.terracottaDeep, fontWeight: '700' }}>{t('dashboard.notificationsAll')}</Text>
          </Pressable>
        } />
        <View style={{ gap: 6 }}>
          {(inbox.data?.items ?? []).slice(0, 2).map((n: { id: string; title: string; body: string; readAt: string | null }) => (
            <View
              key={n.id}
              style={[
                {
                  padding: Spacing.md,
                  borderRadius: Radii.md,
                  backgroundColor: n.readAt ? colors.creamSoft : colors.white,
                  borderLeftWidth: 4,
                  borderLeftColor: n.readAt ? 'transparent' : colors.terracotta,
                },
                Shadows.hush,
              ]}
            >
              <Text style={{ fontWeight: '700', color: colors.charcoal }}>{n.title}</Text>
              <Text style={{ fontSize: 13, color: colors.charcoalSoft, marginTop: 4 }}>{n.body}</Text>
            </View>
          ))}
          {!inbox.isLoading && (inbox.data?.items?.length ?? 0) === 0 ? (
            <Text style={{ color: colors.charcoalSoft, fontSize: 13 }}>
              {t('dashboard.notificationsEmpty')}
            </Text>
          ) : null}
          {inbox.isLoading ? (
            <ActivityIndicator color={colors.terracotta} style={{ alignSelf: 'flex-start', marginTop: Spacing.sm }} />
          ) : null}
        </View>

        <SectionLabel title={t('dashboard.applicationsTitle')} right={
          <Pressable onPress={() => navigation.navigate('Οι_αιτήσεις_μου')}>
            <Text style={{ color: colors.terracottaDeep, fontWeight: '700' }}>{t('dashboard.applicationsAll')}</Text>
          </Pressable>
        } />
        <View style={{ gap: 6 }}>
          {(apps.data ?? []).slice(0, 2).map((a: { id: string; state: string; motivation: string }) => (
            <Pressable
              key={a.id}
              onPress={() => navigation.navigate('TimelineScreen', { id: a.id })}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              style={[
                {
                  padding: Spacing.md,
                  backgroundColor: colors.white,
                  borderRadius: Radii.md,
                },
                Shadows.hush,
              ]}
            >
              <Text style={{ fontWeight: '700', color: colors.charcoal }}>{a.state}</Text>
              <Text numberOfLines={1} style={{ fontSize: 13, color: colors.charcoalSoft, marginTop: 4 }}>
                {a.motivation}
              </Text>
            </Pressable>
          ))}
          {!apps.isLoading && (apps.data?.length ?? 0) === 0 ? (
            <Text style={{ color: colors.charcoalSoft, fontSize: 13 }}>{t('dashboard.applicationsEmpty')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
