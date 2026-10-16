import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';

export const PetTagScreen = () => {
  const { colors } = useThemeColors();
  const [petName, setPetName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [tag, setTag] = useState<any>(null);

  const handleCreateTag = async () => {
    if (!petName || !contactPhone) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ συμπληρώστε όνομα και τηλέφωνο' });
      return;
    }
    try {
      const res = await api.post('/pet-tags', { petName, contactPhone, medicalNotes });
      setTag(res.data.data);
      toast.success({ title: 'Επιτυχία', body: 'Το Ψηφιακό QR Tag δημιουργήθηκε' });
    } catch (err) {
      // Handled
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Ψηφιακό QR Pet Tag
      </Text>
      <Text style={{ color: colors.charcoalSoft, marginBottom: 16 }}>
        Δημιουργήστε ένα μοναδικό QR tag για το περιλαίμιο του κατοικιδίου σας.
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <TextInput
          placeholder="Όνομα Κατοικιδίου"
          value={petName}
          onChangeText={setPetName}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <TextInput
          placeholder="Τηλέφωνο Επικοινωνίας"
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <TextInput
          placeholder="Ιατρικές Σημειώσεις / Αλλεργίες"
          value={medicalNotes}
          onChangeText={setMedicalNotes}
          multiline
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12, height: 60 }}
        />
        <TouchableOpacity
          onPress={handleCreateTag}
          style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Δημιουργία QR Tag</Text>
        </TouchableOpacity>
      </View>

      {tag && (
        <View style={{ backgroundColor: colors.white, padding: 20, borderRadius: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.terracotta, marginBottom: 8 }}>
            KΩΔΙΚΟΣ: {tag.code}
          </Text>
          <Text style={{ color: colors.charcoalSoft, textAlign: 'center' }}>
            Σκανάροντας αυτό τον κωδικό, όποιος βρει το ζώο θα δει τα στοιχεία επικοινωνίας σας.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
