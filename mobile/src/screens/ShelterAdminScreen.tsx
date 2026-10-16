import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { PetForAdoptionDto } from '@/types';

const SIZE_OPTIONS = ['Μικρό', 'Μεσαίο', 'Μεγάλο'] as const;

export const ShelterAdminScreen = () => {
  const { colors } = useThemeColors();
  const [pets, setPets] = useState<PetForAdoptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'DOG' | 'CAT' | 'OTHER'>('DOG');
  const [age, setAge] = useState('');
  const [size, setSize] = useState<string>('Μεσαίο');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: PetForAdoptionDto[] }>('/admin/pets');
      setPets(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPets();
  }, [fetchPets]);

  const handleCreatePet = async () => {
    if (!name || !description || !imageUrl) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ συμπληρώστε τα απαραίτητα πεδία' });
      return;
    }
    try {
      await api.post('/admin/pets', {
        name,
        species,
        age: age || '1 έτους',
        size,
        description,
        imageUrl,
      });
      toast.success({ title: 'Επιτυχία', body: 'Το κατοικίδιο καταχωρήθηκε' });
      setName('');
      setDescription('');
      setImageUrl('');
      void fetchPets();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 16 }}>
        Διαχείριση Καταφυγίου
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.charcoal, marginBottom: 12 }}>
          Προσθήκη Νέου Ζώου
        </Text>
        <TextInput
          placeholder="Όνομα"
          value={name}
          onChangeText={setName}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {(['DOG', 'CAT', 'OTHER'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSpecies(s)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: species === s ? colors.terracotta : colors.creamSoft,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: species === s ? colors.white : colors.charcoal }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder="Ηλικία (π.χ. 2 ετών)"
          value={age}
          onChangeText={setAge}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {SIZE_OPTIONS.map((sizeOption) => (
            <TouchableOpacity
              key={sizeOption}
              onPress={() => setSize(sizeOption)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: size === sizeOption ? colors.terracotta : colors.creamSoft,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: size === sizeOption ? colors.white : colors.charcoal }}>{sizeOption}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder="Περιγραφή"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8, height: 80 }}
        />
        <TextInput
          placeholder="URL Φωτογραφίας"
          value={imageUrl}
          onChangeText={setImageUrl}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12 }}
        />
        <TouchableOpacity
          onPress={handleCreatePet}
          style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Καταχώρηση Ζώου</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
        Ζώα Καταφυγίου ({pets.length})
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        pets.map((pet) => (
          <View
            key={pet.id}
            style={{
              backgroundColor: colors.white,
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>{pet.name}</Text>
              <Text style={{ color: colors.charcoalSoft }}>{pet.species} • {pet.age}</Text>
            </View>
            <Text style={{ color: colors.sageDeep, fontWeight: '600' }}>{pet.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};
