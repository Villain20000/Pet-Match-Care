import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { FeedingStationDto } from '@/types';

export const FeedingStationsScreen = () => {
  const { colors } = useThemeColors();
  const [stations, setStations] = useState<FeedingStationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: FeedingStationDto[] }>('/feeding-stations');
      setStations(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  const handleRefill = async (id: string) => {
    try {
      await api.post(`/feeding-stations/${id}/refill`, { notes: 'Ανεφοδιασμός από εθελοντή' });
      toast.success({ title: 'Ευχαριστούμε!', body: 'Ο ανεφοδιασμός καταχωρήθηκε' });
      void fetchStations();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Σημεία Σίτισης Αδέσποτων
      </Text>
      <Text style={{ color: colors.charcoalSoft, marginBottom: 16 }}>
        Χάρτης & κατάλογος ταΐστρων/ποτιστρών της περιοχής.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        stations.map((st) => (
          <View key={st.id} style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>{st.name}</Text>
            <Text style={{ color: colors.charcoalSoft, fontSize: 13, marginTop: 2 }}>{st.address || 'Περιοχή'}</Text>
            <TouchableOpacity
              onPress={() => handleRefill(st.id)}
              style={{ backgroundColor: colors.sageDeep, padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>🥣 Καταγραφή Ανεφοδιασμού</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};
