/**
 * MyApplicationsScreen — adoption applications + status timeline.
 * Drives the user into AdoptionApplicationScreen for new submissions.
 */
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyApplications } from '@/services/applications';
import { SkeletonLine } from '@/components/Skeleton';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

const STATE_COLOR = {
  DRAFT: Colors.charcoalSoft,
  SUBMITTED: Colors.terracotta,
  SCREENING: Colors.terracottaDeep,
  HOME_CHECK_SCHEDULED: Colors.terracottaDeep,
  APPROVED: Colors.sageDeep,
  REJECTED: Colors.crimson,
  ADOPTION_COMPLETED: Colors.sage,
  CLOSED: Colors.charcoalSoft,
};

export const MyApplicationsScreen = ({ navigation }: any) => {
  const t = useT();
  const { data: apps, isLoading } = useMyApplications();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
        <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
          <SkeletonLine width="80%" height={20} />
          <SkeletonLine width="100%" height={60} />
          <SkeletonLine width="100%" height={60} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: Colors.charcoalSoft }}>
          {t('application.overline')}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4, marginBottom: Spacing.lg }}>
          {t('application.title')}
        </Text>

        {(apps ?? []).length === 0 ? (
          <View
            style={[
              {
                padding: Spacing.lg,
                backgroundColor: Colors.creamSoft,
                borderRadius: Radii.lg,
              },
              Shadows.soft,
            ]}
          >
            <Text style={{ color: Colors.charcoalSoft, textAlign: 'center' }}>
              {t('application.empty')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {(apps ?? []).map((app: { id: string; state: keyof typeof STATE_COLOR; updatedAt: string; motivation: string }) => (
              <Pressable
                key={app.id}
                onPress={() => navigation.navigate('TimelineScreen', { id: app.id })}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={[
                  {
                    padding: Spacing.md,
                    backgroundColor: Colors.white,
                    borderRadius: Radii.lg,
                  },
                  Shadows.soft,
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: STATE_COLOR[app.state],
                      marginRight: 10,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontWeight: '700',
                      color: STATE_COLOR[app.state],
                    }}
                  >
                    {t(`application.states.${app.state}` as const)}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>
                    {new Date(app.updatedAt).toLocaleDateString('el-GR')}
                  </Text>
                </View>
                <Text style={{ marginTop: 4, color: Colors.charcoal }} numberOfLines={2}>
                  {app.motivation}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
