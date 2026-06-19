import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useLeaderboard } from '@/services/badges';
import { SkeletonCard } from '@/components/Skeleton';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { municipalitiesApi } from '@/services/reports';

const FALLBACK_MUNIS = ['Δήμος Αθηναίων', 'Δήμος Θεσσαλονίκης', 'Δήμος Ηρακλείου'];

export const LeaderboardScreen = () => {
  const t = useT();
  const [municipality, setMunicipality] = useState(FALLBACK_MUNIS[0]!);
  const { data: rows = [], isLoading } = useLeaderboard(municipality);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: Colors.charcoalSoft }}>
          {t('leaderboard.overline')}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4 }}>
          {t('leaderboard.title')}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.charcoalSoft, marginTop: 6 }}>
          {t('leaderboard.body')}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
          {FALLBACK_MUNIS.map((m) => {
            const active = m === municipality;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  void municipalitiesApi.closest(37.98, 23.73).catch(() => undefined);
                  setMunicipality(m);
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm + 2,
                  borderRadius: 999,
                  backgroundColor: active ? Colors.terracotta : Colors.creamSoft,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: active ? Colors.white : Colors.charcoal,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.xl, gap: Spacing.md }}>
          <SkeletonCard height={64} />
          <SkeletonCard height={64} />
          <SkeletonCard height={64} />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ padding: Spacing.xl }}>
          <Text style={{ color: Colors.charcoalSoft, textAlign: 'center', padding: Spacing.xl }}>
            {t('leaderboard.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.md }}>
          {rows.map((row, idx) => {
            const medal = ['🥇', '🥈', '🥉'][idx] ?? `#${idx + 1}`;
            return (
              <View
                key={row.user.id}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: Spacing.md,
                    marginBottom: Spacing.sm,
                    backgroundColor: Colors.white,
                    borderRadius: Radii.md,
                  },
                  Shadows.soft,
                ]}
              >
                <Text style={{ fontSize: 22, width: 36 }}>{medal}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: Colors.charcoal }}>
                    {row.user.fullName ?? t('leaderboard.anonymous')}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>
                    {t('leaderboard.stats', { reports: row.reports, karma: row.user.karmaPoints })}
                  </Text>
                </View>
              </View>
            );
          })}
          <ActivityIndicator color={Colors.terracotta} style={{ marginTop: 16 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
