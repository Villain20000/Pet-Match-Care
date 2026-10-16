import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { FosterProfileDto } from '@/types';

export const FosterScreen = () => {
  const { colors } = useThemeColors();
  const [activeTab, setActiveTab] = useState<'profile' | 'search'>('profile');
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [maxPets, setMaxPets] = useState('1');
  const [preferredSpecies, setPreferredSpecies] = useState<'DOG' | 'CAT' | 'OTHER'>('DOG');
  const [hasGarden, setHasGarden] = useState(false);
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [notes, setNotes] = useState('');
  const [fosters, setFosters] = useState<FosterProfileDto[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: FosterProfileDto | null }>('/foster/profile');
      if (res.data.data) {
        const p = res.data.data;
        setCity(p.city || '');
        setMaxPets(String(p.maxPets || 1));
        setPreferredSpecies(p.preferredSpecies || 'DOG');
        setHasGarden(p.hasGarden || false);
        setHasOtherPets(p.hasOtherPets || false);
        setNotes(p.notes || '');
      }
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!city) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ εισάγετε πόλη/περιοχή' });
      return;
    }
    try {
      await api.post('/foster/profile', {
        city,
        maxPets: parseInt(maxPets, 10) || 1,
        preferredSpecies,
        hasGarden,
        hasOtherPets,
        notes,
      });
      toast.success({ title: 'Επιτυχία', body: 'Το προφίλ φιλοξενίας ενημερώθηκε' });
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  const handleSearchFosters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: FosterProfileDto[] }>('/foster/search');
      setFosters(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') {
      void fetchProfile();
    } else {
      void handleSearchFosters();
    }
  }, [activeTab, fetchProfile, handleSearchFosters]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 16 }}>
        Προσωρινή Φιλοξενία (Foster)
      </Text>

      <View style={{ flexDirection: 'row', backgroundColor: colors.creamSoft, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            backgroundColor: activeTab === 'profile' ? colors.terracotta : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: activeTab === 'profile' ? colors.white : colors.charcoal, fontWeight: 'bold' }}>
            Το Προφίλ μου
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            backgroundColor: activeTab === 'search' ? colors.terracotta : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: activeTab === 'search' ? colors.white : colors.charcoal, fontWeight: 'bold' }}>
            Αναζήτηση Φιλοξενιών
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' ? (
        <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
            Δήλωση Διαθεσιμότητας για Φιλοξενία
          </Text>
          <TextInput
            placeholder="Πόλη / Περιοχή"
            value={city}
            onChangeText={setCity}
            style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Μέγιστος αριθμός ζώων"
            value={maxPets}
            onChangeText={setMaxPets}
            keyboardType="numeric"
            style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 10 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.charcoal, marginBottom: 6 }}>
            Προτίμηση Είδους
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {(['DOG', 'CAT', 'OTHER'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setPreferredSpecies(s)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: preferredSpecies === s ? colors.terracotta : colors.creamSoft,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: preferredSpecies === s ? colors.white : colors.charcoal }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setHasGarden(!hasGarden)}
            style={{
              padding: 12,
              backgroundColor: hasGarden ? colors.sageSoft : colors.creamSoft,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.charcoal }}>{hasGarden ? '✓ Διαθέτει κήπο/αυλή' : '✕ Χωρίς κήπο/αυλή'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setHasOtherPets(!hasOtherPets)}
            style={{
              padding: 12,
              backgroundColor: hasOtherPets ? colors.sageSoft : colors.creamSoft,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.charcoal }}>
              {hasOtherPets ? '✓ Υπάρχουν άλλα κατοικίδια' : '✕ Χωρίς άλλα κατοικίδια'}
            </Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Σημειώσεις / Ειδικές συνθήκες"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12, height: 70 }}
          />
          <TouchableOpacity
            onPress={handleSaveProfile}
            style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Αποθήκευση Προφίλ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {loading ? (
            <ActivityIndicator size="large" color={colors.terracotta} />
          ) : (
            fosters.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: colors.white,
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>
                  {item.user?.fullName || 'Εθελοντής Φιλοξενίας'}
                </Text>
                <Text style={{ color: colors.charcoalSoft, marginTop: 2 }}>
                  Περιοχή: {item.city} • Είδος: {item.preferredSpecies}
                </Text>
                <Text style={{ color: colors.sageDeep, fontSize: 12, marginTop: 4 }}>
                  {item.hasGarden ? '🏡 Διαθέτει αυλή' : '🏢 Διαμέρισμα'} • Έως {item.maxPets} ζώα
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};
