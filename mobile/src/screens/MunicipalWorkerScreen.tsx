import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { StrayReportDto } from '@/types';

export const MunicipalWorkerScreen = () => {
  const { colors } = useThemeColors();
  const [reports, setReports] = useState<StrayReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [updateBody, setUpdateBody] = useState('');
  const [status, setStatus] = useState<'IN_PROGRESS' | 'RESOLVED'>('IN_PROGRESS');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: StrayReportDto[] }>('/admin/reports?municipality=Αθήνα');
      setReports(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const handleUpdateReport = async () => {
    if (!selectedReportId || !updateBody) {
      toast.error({ title: 'Σφάλμα', body: 'Παρακαλώ εισάγετε περιγραφή ενημέρωσης' });
      return;
    }
    try {
      await api.patch(`/admin/reports/${selectedReportId}`, {
        status,
        body: updateBody,
      });
      toast.success({ title: 'Επιτυχία', body: 'Η αναφορά ενημερώθηκε' });
      setSelectedReportId(null);
      setUpdateBody('');
      void fetchReports();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 16 }}>
        Δημοτική Υπηρεσία Αδέσποτων
      </Text>

      {selectedReportId && (
        <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.charcoal, marginBottom: 12 }}>
            Ενημέρωση Αναφοράς
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setStatus('IN_PROGRESS')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: status === 'IN_PROGRESS' ? colors.terracotta : colors.creamSoft,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: status === 'IN_PROGRESS' ? colors.white : colors.charcoal }}>Σε εξέλιξη</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatus('RESOLVED')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor: status === 'RESOLVED' ? colors.sageDeep : colors.creamSoft,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: status === 'RESOLVED' ? colors.white : colors.charcoal }}>Επιλύθηκε</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Σημείωση / Ενέργειες Δημοτικής Υπηρεσίας"
            value={updateBody}
            onChangeText={setUpdateBody}
            multiline
            style={{ backgroundColor: colors.creamSoft, padding: 12, borderRadius: 8, marginBottom: 12, height: 80 }}
          />
          <TouchableOpacity
            onPress={handleUpdateReport}
            style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: colors.white, fontWeight: 'bold' }}>Υποβολή Ενημέρωσης</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
        Ανατεθειμένες Αναφορές ({reports.length})
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            onPress={() => setSelectedReportId(report.id)}
            style={{
              backgroundColor: colors.white,
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
              borderWidth: selectedReportId === report.id ? 2 : 0,
              borderColor: colors.terracotta,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal }}>
                Κατάσταση: {report.condition}
              </Text>
              <Text style={{ color: colors.terracotta, fontWeight: '600' }}>{report.status}</Text>
            </View>
            <Text style={{ color: colors.charcoalSoft, marginBottom: 4 }}>{report.description || 'Χωρίς περιγραφή'}</Text>
            <Text style={{ fontSize: 12, color: colors.charcoalSoft }}>
              Δήμος: {report.assignedMunicipality}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};
