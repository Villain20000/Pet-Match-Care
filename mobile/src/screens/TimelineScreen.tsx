/**
 * TimelineScreen — vertical timeline of updates for a stray report.
 * Municipal workers / shelter admins can post new updates that are
 * persisted and surfaced to the original reporter.
 */
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonLine } from '@/components/Skeleton';
import { useTimeline } from '@/services/timeline';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

const STATUS_COLOR: Record<string, string> = {
  OPEN: Colors.terracotta,
  ASSIGNED: Colors.charcoal,
  IN_PROGRESS: Colors.terracottaDeep,
  RESOLVED: Colors.sageDeep,
  EXPIRED: Colors.charcoalSoft,
};

const STATUS_TRANSLATION_KEY: Record<string, string> = {
  OPEN: 'timeline.statusOpen',
  ASSIGNED: 'timeline.statusAssigned',
  IN_PROGRESS: 'timeline.statusInProgress',
  RESOLVED: 'timeline.statusResolved',
  EXPIRED: 'timeline.statusExpired',
};

export const TimelineScreen = ({ route }: any) => {
  const t = useT();
  const id: string = route?.params?.id ?? route?.params?.reportId ?? '';
  const { data, isLoading } = useTimeline(id);

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
        <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
          <SkeletonLine width="80%" height={20} />
          <SkeletonLine width="100%" height={64} />
          <SkeletonLine width="100%" height={64} />
        </View>
      </SafeAreaView>
    );
  }

  const { report, updates } = data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: Colors.charcoalSoft }}>
          {t('timeline.overline', { id: report.id.slice(0, 6).toUpperCase() })}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4 }}>
          {t(STATUS_TRANSLATION_KEY[report.status] ?? 'timeline.fallbackStatus')}
        </Text>
        <Text style={{ color: Colors.charcoalSoft, fontSize: 13, marginVertical: 6, marginBottom: Spacing.lg }}>
          {report.addressHint ?? '—'} · {report.assignedMunicipality}
        </Text>

        <Image
          source={{ uri: report.imageUrl }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: Radii.lg,
            backgroundColor: Colors.creamSoft,
            marginBottom: Spacing.lg,
          }}
          resizeMode="cover"
        />

        {updates.map((u, idx) => (
          <View
            key={u.id}
            style={[
              {
                flexDirection: 'row',
                marginBottom: Spacing.lg,
              },
            ]}
          >
            <View style={{ alignItems: 'center', marginRight: Spacing.md }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: STATUS_COLOR[u.status] ?? Colors.terracotta,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 11 }}>
                  {idx + 1}
                </Text>
              </View>
              {idx < updates.length - 1 ? (
                <View style={{ width: 2, flex: 1, backgroundColor: Colors.creamDeep, marginTop: 4 }} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={[
                  {
                    backgroundColor: Colors.white,
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                  },
                  Shadows.hush,
                ]}
              >
                <Text style={{ fontWeight: '700', color: STATUS_COLOR[u.status] }}>
                  {t(STATUS_TRANSLATION_KEY[u.status] ?? 'timeline.fallbackStatus')}
                </Text>
                <Text style={{ marginTop: 4, color: Colors.charcoal }}>{u.body}</Text>
                {u.photoUrl ? (
                  <Image
                    source={{ uri: u.photoUrl }}
                    style={{
                      width: '100%',
                      height: 160,
                      borderRadius: Radii.md,
                      marginTop: 8,
                      backgroundColor: Colors.creamSoft,
                    }}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={{ marginTop: 6, fontSize: 11, color: Colors.charcoalSoft }}>
                  {new Date(u.createdAt).toLocaleString('el-GR')}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
