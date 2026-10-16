import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';

export const MedicalRecordsScreen = ({ route }: any) => {
  const { colors } = useThemeColors();
  const petId = route?.params?.petId || '';
  const petName = route?.params?.petName || 'Κατοικίδιο';

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState('VACCINE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vetName, setVetName] = useState('');

  const fetchRecords = async () => {
    if (!petId) return;
    try {
      setLoading(true);
      const res = await api.get(`/pets/${petId}/medical-records`);
      setRecords(res.data.data);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRecords();
  }, [petId]);

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
    } catch (err) {
      // Handled
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
