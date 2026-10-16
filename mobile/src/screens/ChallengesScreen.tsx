import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';

export const ChallengesScreen = () => {
  const { colors } = useThemeColors();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/challenges');
      setChallenges(res.data.data);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChallenges();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Challenges & Στόχοι
      </Text>
      <Text style={{ color: colors.charcoalSoft, marginBottom: 16 }}>
        Ολοκλήρωσε αποστολές, κέρδισε Karma points και ξεκλείδωσε παράσημα!
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        challenges.map((c) => (
          <View key={c.id} style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal }}>{c.title}</Text>
            <Text style={{ color: colors.charcoalSoft, marginTop: 2 }}>{c.description}</Text>
            <Text style={{ color: colors.terracotta, fontWeight: 'bold', marginTop: 8 }}>
              🎁 Αμοιβή: +{c.karmaReward} Karma
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};
