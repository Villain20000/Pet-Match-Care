import { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { Colors, Spacing } from '@/theme';
import type { RootStackScreenProps } from '@/navigation/types';

export const ForgotPasswordScreen = ({ navigation }: RootStackScreenProps<'ForgotPassword'>) => {
  const t = useT();
  const forgot = useAuthStore((s) => s.forgotPassword);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email) return;
    setBusy(true);
    try {
      await forgot(email);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, padding: Spacing.xl }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: Colors.charcoalSoft,
        }}
      >
        {t('forgot.overline')}
      </Text>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: Colors.charcoal,
          marginVertical: 6,
          letterSpacing: -0.4,
        }}
      >
        {t('forgot.title')}
      </Text>
      <Text style={{ fontSize: 14, color: Colors.charcoalSoft, marginBottom: Spacing.xl }}>
        {t('forgot.body')}
      </Text>

      {done ? (
        <View
          style={{
            backgroundColor: Colors.creamSoft,
            padding: Spacing.lg,
            borderRadius: 16,
            marginBottom: Spacing.md,
          }}
        >
          <Text style={{ color: Colors.sageDeep, fontWeight: '700' }}>
            {t('forgot.success')}
          </Text>
          <Text style={{ color: Colors.charcoalSoft, fontSize: 13, marginTop: 4 }}>
            {t('forgot.successHint')}
          </Text>
        </View>
      ) : (
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      )}

      <PrimaryButton
        title={done ? t('forgot.ctaBack') : t('forgot.ctaSend')}
        onPress={done ? () => navigation.goBack() : submit}
        loading={busy}
      />
    </SafeAreaView>
  );
};
