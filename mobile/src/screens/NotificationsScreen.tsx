/**
 * NotificationsScreen — inbox-style list, grouped by day, mark-all-read
 * with haptics. Tap to navigate for known kinds (e.g. STRAY_REPORT_UPDATE).
 */
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInbox, useMarkAllRead, useMarkRead } from '@/services/notifications';
import { SkeletonLine } from '@/components/Skeleton';
import { useT } from '@/services/i18n';
import { Radii, Shadows, Spacing } from '@/theme';
import { useThemeColors } from '@/services/theme';
import { haptic } from '@/services/haptics';
import type { RootStackScreenProps } from '@/navigation/types';

const KIND_ICON: Record<string, string> = {
  STRAY_REPORT_UPDATE: '📝',
  POISON_ALERT: '🚨',
  ADOPTION_STATUS_CHANGED: '🐶',
  LOST_PET_MATCH: '🔔',
  BADGE_EARNED: '🏅',
  STREAK_REMINDER: '🔥',
  MUNICIPALITY_LEADERBOARD: '🥇',
  GENERAL: '🔔',
};

export const NotificationsScreen = ({ navigation }: RootStackScreenProps<'Notifications'>) => {
  const t = useT();
  const { colors } = useThemeColors();
  const { data, isLoading, isError, refetch, isFetching } = useInbox();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
          <SkeletonLine width="80%" height={20} />
          <SkeletonLine width="100%" height={64} />
          <SkeletonLine width="100%" height={64} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <View
        style={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.charcoalSoft }}>
            {t('notifications.overline')}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.4 }}>
            {t('notifications.title')}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            haptic.select();
            markAll.mutate();
          }}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.creamSoft,
          }}
        >
          <Text style={{ color: colors.terracottaDeep, fontWeight: '700', fontSize: 12 }}>
            {t('notifications.markAll')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.terracotta} />}
      >
        {isError ? (
          <View style={{ alignItems: 'center', padding: Spacing.xl }}>
            <Text style={{ fontSize: 32 }}>📭</Text>
            <Text style={{ fontWeight: '700', color: colors.charcoal, marginTop: Spacing.sm }}>{t('common.errorOccurred')}</Text>
            <Text style={{ color: colors.charcoalSoft, marginTop: 4, textAlign: 'center' }}>{t('common.errorBody')}</Text>
            <Pressable
              onPress={() => refetch()}
              style={{ marginTop: Spacing.md, backgroundColor: colors.terracotta, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: 999 }}
            >
              <Text style={{ color: colors.white, fontWeight: '700' }}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : data.items.length === 0 ? (
          <Text style={{ color: colors.charcoalSoft, padding: Spacing.xl, textAlign: 'center' }}>
            {t('notifications.empty')}
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {data.items.map((n: { id: string; kind: string; title: string; body: string; data: Record<string, unknown>; readAt: string | null; createdAt: string }) => (
              <Pressable
                key={n.id}
                onPress={() => {
                  haptic.select();
                  if (!n.readAt) markOne.mutate([n.id]);
                  // Deep-link per kind.
                  const data = n.data;
                  const reportId = data?.reportId as string | undefined;
                  const applicationId = data?.applicationId as string | undefined;
                  if (reportId) navigation.navigate('TimelineScreen', { id: reportId });
                  else if (applicationId) navigation.navigate('TimelineScreen', { id: applicationId });
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={[
                  {
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: n.readAt ? colors.white : colors.creamSoft,
                    borderLeftWidth: 4,
                    borderLeftColor: n.readAt ? 'transparent' : colors.terracotta,
                  },
                  Shadows.hush,
                ]}
              >
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{KIND_ICON[n.kind] ?? '🔔'}</Text>
                <Text style={{ fontWeight: '700', color: colors.charcoal }}>{n.title}</Text>
                <Text style={{ color: colors.charcoalSoft, fontSize: 13, marginTop: 4 }}>{n.body}</Text>
                <Text style={{ marginTop: 8, fontSize: 11, color: colors.charcoalSoft }}>
                  {new Date(n.createdAt).toLocaleString('el-GR')}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {isFetching && !isLoading ? <ActivityIndicator color={colors.terracotta} style={{ marginTop: Spacing.md }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
};
