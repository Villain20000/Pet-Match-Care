import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { toast, resolveApiError } from '@/services/toast';
import { Colors, Spacing } from '@/theme';
import type { RootStackScreenProps } from '@/navigation/types';

export const ResetPasswordScreen = ({ route, navigation }: RootStackScreenProps<'ResetPassword'>) => {
  const t = useT();
  const reset = useAuthStore((s) => s.resetPassword);
  const token: string = route?.params?.token ?? '';
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pwd.length < 8) {
      toast.warning({ title: t('errors.passwordTooShort') });
      return;
    }
    if (pwd !== confirm) {
      toast.warning({ title: t('reset.mismatch') });
      return;
    }
    setBusy(true);
    try {
      await reset(token, pwd);
      toast.success({ title: t('common.save') });
      navigation.replace('Login');
    } catch (err) {
      const resolved = resolveApiError(err, t);
      if (resolved) {
        toast.error({ title: resolved.title, body: resolved.body });
      } else {
        toast.error({ title: t('toast.serverError') });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, padding: Spacing.xl }}>
      <Field label={t('reset.passwordLabel')} value={pwd} onChangeText={setPwd} secureTextEntry />
      <Field label={t('reset.confirmLabel')} value={confirm} onChangeText={setConfirm} secureTextEntry />
      <PrimaryButton title={t('reset.cta')} onPress={submit} loading={busy} />
    </SafeAreaView>
  );
};
