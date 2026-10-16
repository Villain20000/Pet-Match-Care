import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/services/theme';
import { api } from '@/services/api';
import { toast } from '@/services/toast';
import type { DonationCampaignDto } from '@/types';

export const DonationsScreen = () => {
  const { colors } = useThemeColors();
  const [campaigns, setCampaigns] = useState<DonationCampaignDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: DonationCampaignDto[] }>('/donations');
      setCampaigns(res.data.data);
    } catch (_err) {
      // Handled by the global error interceptor / empty-state UI.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDonate = async (campaignId: string) => {
    try {
      await api.post(`/donations/${campaignId}/donate`, { amount: 10 });
      toast.success({ title: 'Σας ευχαριστούμε!', body: 'Η δωρεά των 10€ καταχωρήθηκε' });
      void fetchCampaigns();
    } catch (_err) {
      // Handled by the global error interceptor / toast caller.
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
        Δωρεές & Ενίσχυση Καταφυγίων
      </Text>
      <Text style={{ color: colors.charcoalSoft, marginBottom: 16 }}>
        Στηρίξτε τα αδέσποτα ζώα και τα καταφύγια της περιοχής σας.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.terracotta} />
      ) : (
        campaigns.map((camp) => {
          const progress = Math.min(1, camp.targetAmount ? camp.raisedAmount / camp.targetAmount : 0);
          return (
            <View
              key={camp.id}
              style={{
                backgroundColor: colors.white,
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderLeftWidth: camp.isEmergency ? 4 : 0,
                borderLeftColor: colors.crimson,
              }}
            >
              {camp.isEmergency && (
                <Text style={{ color: colors.crimson, fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                  🚨 ΕΚΤΑΚΤΗ ΑΝΑΓΚΗ
                </Text>
              )}
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.charcoal, marginBottom: 4 }}>
                {camp.title}
              </Text>
              <Text style={{ color: colors.charcoalSoft, marginBottom: 12 }}>{camp.description}</Text>

              <View style={{ height: 8, backgroundColor: colors.creamSoft, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.sageDeep }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: colors.charcoalSoft }}>
                  Συγκεντρώθηκαν: <Text style={{ fontWeight: 'bold', color: colors.charcoal }}>{camp.raisedAmount}€</Text>
                </Text>
                <Text style={{ fontSize: 13, color: colors.charcoalSoft }}>
                  Στόχος: <Text style={{ fontWeight: 'bold', color: colors.charcoal }}>{camp.targetAmount}€</Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDonate(camp.id)}
                style={{ backgroundColor: colors.terracotta, padding: 12, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>Προσφορά 10€</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};
