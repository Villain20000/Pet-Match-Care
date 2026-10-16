import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/services/theme';
import type { RootStackScreenProps } from '@/navigation/types';

export const PrivacyPolicyScreen = ({ navigation }: RootStackScreenProps<'PrivacyPolicy'>) => {
  const { colors } = useThemeColors();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.charcoal, marginBottom: 12 }}>
        Πολιτική Απορρήτου & Όροι Χρήσης
      </Text>

      <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          1. Προστασία Προσωπικών Δεδομένων (GDPR)
        </Text>
        <Text style={{ color: colors.charcoalSoft, lineHeight: 20, marginBottom: 12 }}>
          Η εφαρμογή Pet-Match & Care συλλέγει αποκλειστικά τα δεδομένα που είναι απαραίτητα για την καταγραφή αδέσποτων,
          την επεξεργασία αιτήσεων υιοθεσίας και την ασφάλεια των χρηστών.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          2. Δικαίωμα Διαγραφής (Account Deletion)
        </Text>
        <Text style={{ color: colors.charcoalSoft, lineHeight: 20, marginBottom: 12 }}>
          Έχετε το δικαίωμα να διαγράψετε οριστικά τον λογαριασμό σας και όλα τα προσωπικά σας δεδομένα ανά πάσα στιγμή
          από την οθόνη "Ρυθμίσεις" της εφαρμογής.
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.charcoal, marginBottom: 8 }}>
          3. Κανόνες Περιεχομένου (UGC Safety)
        </Text>
        <Text style={{ color: colors.charcoalSoft, lineHeight: 20, marginBottom: 12 }}>
          Απαγορεύεται αυστηρά η δημοσίευση προσβλητικού, παραπλανητικού ή ανεπιθύμητου περιεχομένου.
          Οι χρήστες μπορούν να αναφέρουν ακατάλληλο περιεχόμενο ή να αποκλείσουν άλλους χρήστες μέσω του κουμπιού "Αναφορά".
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ backgroundColor: colors.terracotta, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24 }}
      >
        <Text style={{ color: colors.white, fontWeight: 'bold' }}>Επιστροφή</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
