import { View, Text, Pressable } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import type { Badge } from '@/services/badges';
import { haptic } from '@/services/haptics';

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  onPress?: () => void;
}

const rarityAccent = (r: Badge['rarity']) => {
  switch (r) {
    case 'COMMON':
      return { bg: Colors.creamSoft, text: Colors.charcoal, stripe: Colors.charcoalSoft };
    case 'RARE':
      return { bg: '#E0F1FF', text: Colors.charcoalDeep ?? '#1A4F75', stripe: '#1A4F75' };
    case 'EPIC':
      return { bg: '#F0E1FF', text: '#523080', stripe: '#523080' };
    case 'LEGENDARY':
      return { bg: '#FFE1B7', text: '#884300', stripe: '#884300' };
  }
};

export const BadgeCard = ({ badge, earned = true, onPress }: BadgeCardProps) => {
  const c = rarityAccent(badge.rarity);
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={[
        {
          borderRadius: Radii.lg,
          backgroundColor: earned ? c.bg : Colors.creamSoft,
          padding: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: earned ? 1 : 0.55,
          borderLeftWidth: 4,
          borderLeftColor: earned ? c.stripe : Colors.charcoalSoft,
          ...Shadows.soft,
          minHeight: 80,
        },
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: earned ? Colors.white : Colors.creamDeep,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.md,
        }}
      >
        <Text style={{ fontSize: 28, opacity: earned ? 1 : 0.45 }}>{badge.iconEmoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.6,
            color: earned ? c.text : Colors.charcoalSoft,
          }}
        >
          {badge.rarity.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.2 }}>
          {earned ? badge.name : 'Κλειδωμένο'}
        </Text>
        <Text
          style={{ fontSize: 12, color: Colors.charcoalSoft, marginTop: 2 }}
          numberOfLines={2}
        >
          {badge.description}
        </Text>
      </View>
    </Pressable>
  );
};
