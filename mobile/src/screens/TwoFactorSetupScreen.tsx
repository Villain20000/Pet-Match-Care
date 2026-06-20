import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Field } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { haptic } from '@/services/haptics';
import { toast, resolveApiError } from '@/services/toast';

export const TwoFactorSetupScreen = () => {
  const t = useT();
  const begin2fa = useAuthStore((s) => s.begin2fa);
  const confirm2fa = useAuthStore((s) => s.confirm2fa);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void begin2fa().then((r) => {
      setSecret(r.secret);
      setUri(r.otpauthUri);
    });
  }, [begin2fa]);

  const onConfirm = async () => {
    setBusy(true);
    try {
      const out = await confirm2fa(code);
      setRecovery(out.recoveryCodes);
      haptic.success();
    } catch (err) {
      const resolved = resolveApiError(err, t);
      toast.error({
        title: resolved?.title ?? t('toast.serverError'),
        body: resolved?.body ?? String(err),
      });
      haptic.error();
    } finally {
      setBusy(false);
    }
  };

  const onShareRecovery = async () => {
    if (!recovery) return;
    await Share.share({
      title: t('twoFactor.shareTitle'),
      message: t('twoFactor.shareBody') + recovery.join('\n'),
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4 }}>
          {t('twoFactor.title')}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.charcoalSoft, marginTop: 6, marginBottom: Spacing.xl, lineHeight: 20 }}>
          {t('twoFactor.body')}
        </Text>

        {!recovery ? (
          <>
            <View
              style={[
                {
                  alignSelf: 'center',
                  backgroundColor: Colors.white,
                  padding: Spacing.lg,
                  borderRadius: Radii.lg,
                  ...Shadows.soft,
                },
              ]}
            >
              {uri ? <QRCode value={uri} size={200} /> : null}
            </View>

            {secret ? (
              <View style={{ marginTop: Spacing.lg }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    color: Colors.charcoalSoft,
                  }}
                >
                  {t('twoFactor.orManual')}
                </Text>
                <Text
                  selectable
                  style={{
                    fontFamily: 'monospace',
                    backgroundColor: Colors.creamSoft,
                    padding: Spacing.md,
                    borderRadius: 8,
                    marginTop: 6,
                    color: Colors.charcoal,
                  }}
                >
                  {secret}
                </Text>
              </View>
            ) : null}

            <Field
              label={t('twoFactor.codeLabel')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              style={{ marginTop: Spacing.xl, letterSpacing: 4 }}
            />

            <PrimaryButton title={t('twoFactor.ctaConfirm')} onPress={onConfirm} loading={busy} />
          </>
        ) : (
          <>
            <View
              style={[
                {
                  backgroundColor: Colors.sage,
                  padding: Spacing.lg,
                  borderRadius: Radii.lg,
                  marginBottom: Spacing.lg,
                },
                Shadows.soft,
              ]}
            >
              <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 18 }}>
                {t('twoFactor.successTitle')}
              </Text>
              <Text style={{ color: Colors.white, opacity: 0.9, marginTop: 4 }}>
                {t('twoFactor.successBody')}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: Colors.white,
                borderRadius: Radii.lg,
                padding: Spacing.lg,
                ...Shadows.hush,
              }}
            >
              {recovery.map((c, i) => (
                <Text
                  key={i}
                  selectable
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 16,
                    color: Colors.charcoal,
                    paddingVertical: 4,
                  }}
                >
                  {c}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={onShareRecovery}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              style={{
                alignSelf: 'center',
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
                marginTop: Spacing.lg,
                borderRadius: Radii.pill,
                backgroundColor: Colors.creamSoft,
              }}
            >
              <Text style={{ color: Colors.terracottaDeep, fontWeight: '700' }}>{t('twoFactor.exportCta')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
