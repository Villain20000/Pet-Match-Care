import { Pressable, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import * as Haptics from 'expo-haptics';

export type ActionVariant = 'red' | 'orange' | 'green';

interface ActionTileProps {
  icon: string;
  title: string;
  caption: string;
  variant: ActionVariant;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const palette = (v: ActionVariant) => {
  switch (v) {
    case 'red':
      return { bg: Colors.crimson, accent: '#FFD4D8' };
    case 'orange':
      return { bg: Colors.terracotta, accent: '#FFE2D5' };
    case 'green':
      return { bg: Colors.sage, accent: '#D7EEE0' };
  }
};

export const ActionTile = ({ icon, title, caption, variant, onPress, style }: ActionTileProps) => {
  const c = palette(variant);

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={[
        {
          backgroundColor: c.bg,
          borderRadius: Radii.xl,
          padding: Spacing.lg,
          minHeight: 132,
          justifyContent: 'space-between',
          ...Shadows.soft,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <View>
        <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 17, letterSpacing: -0.2 }}>
          {title}
        </Text>
        <Text style={{ color: Colors.white, opacity: 0.85, fontSize: 12, marginTop: 2 }}>
          {caption}
        </Text>
      </View>
    </Pressable>
  );
};
