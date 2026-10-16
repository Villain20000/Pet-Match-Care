import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import type { MatchmakerResultDto } from '@/types';

const HOURS_ALONE_OPTIONS = [0, 2, 4, 6, 8] as const;

export const SmartMatchmakerScreen = () => {
  const { colors } = useThemeColors();
  const [lifestyle, setLifestyle] = useState<'ACTIVE' | 'CALM'>('ACTIVE');
  const [hoursAlone, setHoursAlone] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchmakerResultDto | null>(null);

  const handleQuizSubmit = async () => {
    try {
      setLoading(true);
      const res = await api.post<{ data: MatchmakerResultDto }>('/matchmaker/quiz', {
        lifestyle,
        hoursAlone,
        space: 'APARTMENT',
        hasKids: true,
      });
      setResult(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Smart Pet Matchmaker (AI)
      </Text>
      <Text style={{ color: colors.charcoalSoft, marginBottom: 16 }}>
        Απάντησε σε λίγες ερωτήσεις και βρες το ιδανικό ζώο για τον τρόπο ζωής σου.
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          Τρόπος Ζωής
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setLifestyle('ACTIVE')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: lifestyle === 'ACTIVE' ? colors.terracotta : colors.creamSoft,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: lifestyle === 'ACTIVE' ? colors.white : colors.charcoal }}>🏃 Δραστήριος</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLifestyle('CALM')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              backgroundColor: lifestyle === 'CALM' ? colors.terracotta : colors.creamSoft,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: lifestyle === 'CALM' ? colors.white : colors.charcoal }}>🛋️ Ήρεμος</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          Ώρες μόνος/η στο σπίτι
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {HOURS_ALONE_OPTIONS.map((hoursOption) => (
            <TouchableOpacity
              key={hoursOption}
              onPress={() => setHoursAlone(hoursOption)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: hoursAlone === hoursOption ? colors.terracotta : colors.creamSoft,
              }}
            >
              <Text style={{ color: hoursAlone === hoursOption ? colors.white : colors.charcoal, fontWeight: '600' }}>
                {hoursOption}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleQuizSubmit}
          style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Υπολογισμός Συμβατότητας</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.terracotta} />}

      {result && (
        <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.sageDeep, marginBottom: 4 }}>
            Δείκτης Συμβατότητας: {result.matchScore}%
          </Text>
          <Text style={{ color: colors.charcoalSoft, marginBottom: 12 }}>
            Προτεινόμενο είδος: <Text style={{ fontWeight: 'bold', color: colors.charcoal }}>{result.suggestedSpecies}</Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
