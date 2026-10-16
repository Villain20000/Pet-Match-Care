import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { RootStackScreenProps } from '@/navigation/types';
import type { MedicalRecordDto } from '@/types';

const RECORD_TYPES = [
  { value: 'VACCINE', label: 'Εμβόλιο' },
  { value: 'DEWORMING', label: 'Αποπαρασίτωση' },
  { value: 'EXAMINATION', label: 'Εξέταση' },
  { value: 'SURGERY', label: 'Εγχείρηση' },
  { value: 'TREATMENT', label: 'Θεραπεία' },
] as const;

type RecordTypeValue = (typeof RECORD_TYPES)[number]['value'];

export const MedicalRecordsScreen = ({ route }: RootStackScreenProps<'MedicalRecords'>) => {
  const { colors } = useThemeColors();
  const petId = route?.params?.petId || '';
  const petName = route?.params?.petName || 'Κατοικίδιο';

  const [records, setRecords] = useState<MedicalRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState<RecordTypeValue>('VACCINE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vetName, setVetName] = useState('');

  const fetchRecords = useCallback(async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const res = await api.get<{ data: MedicalRecordDto[] }>(`/pets/${petId}/medical-records`);
      setRecords(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const handleAddRecord = async () => {
    if (!title) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ συμπληρώστε τίτλο εγγραφής' });
      return;
    }
    try {
      await api.post(`/pets/${petId}/medical-records`, {
        recordType,
        title,
        description,
        performedAt: new Date(),
        vetName,
      });
      toast.success({ title: 'Επιτυχία', body: 'Η ιατρική εγγραφή προστέθηκε' });
      setTitle('');
      setDescription('');
      setVetName('');
      void fetchRecords();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Βιβλιάριο Υγείας
      </Text>
      <Text style={{ fontSize: 16, color: colors.terracotta, marginBottom: 16, fontWeight: '600' }}>
        {petName}
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
          Προσθήκη Ιατρικής Πράξης
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {RECORD_TYPES.map((typeOption) => (
            <TouchableOpacity
              key={typeOption.value}
              onPress={() => setRecordType(typeOption.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: recordType === typeOption.value ? colors.terracotta : colors.creamSoft,
              }}
            >
              <Text style={{ color: recordType === typeOption.value ? colors.white : colors.charcoal, fontWeight: '600' }}>
                {typeOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder="Τίτλος (π.χ. Εμβόλιο Λύσσας, Αποπαρασίτωση)"
          value={title}
          onChangeText={setTitle}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <TextInput
          placeholder="Όνομα Κτηνιάτρου / Κλινικής"
          value={vetName}
          onChangeText={setVetName}
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 8 }}
        />
        <TextInput
          placeholder="Λεπτομέρειες / Σημειώσεις"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12, height: 60 }}
        />
        <TouchableOpacity
          onPress={handleAddRecord}
          style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>Προσθήκη στο Βιβλιάριο</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
        Ιστορικό Πράξεων ({records.length})
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        records.map((rec) => (
          <View
            key={rec.id}
            style={{
              backgroundColor: colors.white,
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>{rec.title}</Text>
              <Text style={{ color: colors.sageDeep, fontSize: 12 }}>{new Date(rec.performedAt).toLocaleDateString('el-GR')}</Text>
            </View>
            {rec.vetName && <Text style={{ color: colors.charcoalSoft, fontSize: 13, marginTop: 2 }}>👨‍⚕️ {rec.vetName}</Text>}
            {rec.description && <Text style={{ color: colors.charcoalSoft, marginTop: 4 }}>{rec.description}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
};
