import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCard } from '@/components/BadgeCard';
import { SkeletonCard } from '@/components/Skeleton';
import { useAllBadges, useMyBadges } from '@/services/badges';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconEmoji?: string;
  rarity?: Rarity;
}

interface SeedBadge {
  id: string;
  code: 'FIRST_REPORT' | 'FIVE_REPORTS' | 'POISON_HERO' | 'STREAK_30' | 'ADOPTION_GOD';
  iconEmoji: string;
  rarity: Rarity;
}

const SEED_BADGES: SeedBadge[] = [
  { id: 's1', code: 'FIRST_REPORT', iconEmoji: '🐾', rarity: 'COMMON' },
  { id: 's2', code: 'FIVE_REPORTS', iconEmoji: '🛡️', rarity: 'RARE' },
  { id: 's3', code: 'POISON_HERO', iconEmoji: '🚨', rarity: 'EPIC' },
  { id: 's4', code: 'STREAK_30', iconEmoji: '🔥', rarity: 'EPIC' },
  { id: 's5', code: 'ADOPTION_GOD', iconEmoji: '🏆', rarity: 'LEGENDARY' },
];

const SEED_KEY: Record<SeedBadge['code'], { name: string; desc: string }> = {
  FIRST_REPORT: { name: 'firstReportName', desc: 'firstReportDesc' },
  FIVE_REPORTS: { name: 'fiveReportsName', desc: 'fiveReportsDesc' },
  POISON_HERO: { name: 'poisonHeroName', desc: 'poisonHeroDesc' },
  STREAK_30: { name: 'streak30Name', desc: 'streak30Desc' },
  ADOPTION_GOD: { name: 'adoptionGodName', desc: 'adoptionGodDesc' },
};

function localizeSeed(seed: SeedBadge, t: (k: string) => string): Badge {
  const keys = SEED_KEY[seed.code];
  return {
    id: seed.id,
    name: t(`badges.seeds.${keys.name}`),
    description: t(`badges.seeds.${keys.desc}`),
    iconEmoji: seed.iconEmoji,
    rarity: seed.rarity,
  };
}

export const BadgesScreen = () => {
  const t = useT();
  const all = useAllBadges();
  const mine = useMyDecrypted();

  const earnedIds = new Set((mine.data ?? []).map((b) => b.id));
  const list = mine.data ?? [];
  const remaining = (all.data ?? SEED_BADGES.map((s) => localizeSeed(s, t))).filter(
    (b) => !earnedIds.has(b.id)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: Colors.charcoalSoft }}>
          {t('badges.overline')}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4 }}>
          {t('badges.title')}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.charcoalSoft, marginVertical: 6, marginBottom: Spacing.lg }}>
          {t('badges.body')}
        </Text>

        {mine.isLoading ? (
          <View style={{ gap: Spacing.md }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : list.length === 0 ? (
          <View
            style={[
              { padding: Spacing.lg, borderRadius: Radii.lg, backgroundColor: Colors.creamSoft },
              Shadows.soft,
            ]}
          >
            <Text style={{ fontWeight: '700', color: Colors.charcoal }}>
              {t('badges.empty')}
            </Text>
            <Text style={{ color: Colors.charcoalSoft, fontSize: 13, marginTop: 4 }}>
              {t('badges.emptyHint')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {list.map((b) => (
              <BadgeCard key={b.id} badge={b} earned />
            ))}
          </View>
        )}

        {remaining.length > 0 ? (
          <>
            <Text style={{ marginTop: Spacing.xl, fontSize: 18, fontWeight: '700', color: Colors.charcoal }}>
              {t('badges.locked')}
            </Text>
            <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
              {remaining.map((b) => (
                <BadgeCard key={b.id} badge={b} earned={false} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

// Tiny convenience wrapper that falls back to seed data when the API is offline.
function useMyDecrypted() {
  const mine = useMyBadges();
  if (mine.isError || (mine.data && mine.data.length === 0)) {
    return { ...mine, data: [] as Badge[] };
  }
  return mine;
}
