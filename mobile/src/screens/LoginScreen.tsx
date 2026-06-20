import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { useAuthStore } from '@/services/auth';
import { useT } from '@/services/i18n';
import { haptic } from '@/services/haptics';
import { toast, resolveApiError } from '@/services/toast';

export const LoginScreen = ({ onForgot }: { onForgot?: () => void }) => {
  const t = useT();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const startGoogleSso = useAuthStore((s) => s.startGoogleSso);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || password.length < 8) {
      toast.warning({ title: t('login.errorsInvalidInput') });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name || undefined);
    } catch (err) {
      const resolved = resolveApiError(err, t);
      toast.error({
        title: resolved?.title ?? t('toast.serverError'),
        body: resolved?.body ?? String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const biometricUnlock = async () => {
    await haptic.tap();
    const ok = await unlockWithBiometrics();
    if (!ok) toast.warning({ title: t('errors.UNAUTHORIZED') });
  };

  const ssoLogin = async () => {
    setBusy(true);
    try {
      await startGoogleSso();
    } catch (err) {
      const resolved = resolveApiError(err, t);
      toast.error({
        title: resolved?.title ?? t('toast.serverError'),
        body: resolved?.body ?? String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: Spacing.xl,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <View
              style={[
                {
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: Colors.terracotta,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                Shadows.soft,
              ]}
            >
              <Text style={{ fontSize: 40 }}>🐾</Text>
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: Colors.charcoal,
                letterSpacing: -0.5,
                marginTop: Spacing.lg,
              }}
            >
              {t('common.appName')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.charcoalSoft,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {t('common.appSubtitle')}
            </Text>
          </View>

          <View
            style={[
              {
                backgroundColor: Colors.white,
                borderRadius: Radii.xl,
                padding: Spacing.xl,
                ...Shadows.soft,
              },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: Colors.creamSoft,
                borderRadius: Radii.pill,
                padding: 4,
                marginBottom: Spacing.lg,
              }}
            >
              {(['login', 'register'] as const).map((m) => {
                const active = mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      haptic.select();
                      setMode(m);
                    }}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: Radii.pill,
                      backgroundColor: active ? Colors.terracotta : 'transparent',
                    }}
                  >
                    <Text style={{ color: active ? Colors.white : Colors.charcoal, fontWeight: '700' }}>
                      {m === 'login' ? t('login.tabLogin') : t('login.tabRegister')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'register' ? (
              <Field
                label={t('login.nameLabel')}
                value={name}
                onChangeText={setName}
                placeholder={t('login.namePlaceholder')}
                autoCapitalize="words"
              />
            ) : null}

            <Field
              label={t('login.emailLabel')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t('login.emailPlaceholder')}
            />
            <Field
              label={t('login.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t('login.passwordPlaceholder')}
            />

            <PrimaryButton
              title={mode === 'login' ? t('login.ctaLogin') : t('login.ctaRegister')}
              onPress={submit}
              loading={busy}
            />

            {mode === 'login' ? (
              <>
                <Pressable
                  onPress={() => {
                    haptic.select();
                    if (onForgot) onForgot();
                  }}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  style={{ alignItems: 'center', marginTop: Spacing.md, padding: 8 }}
                >
                  <Text style={{ color: Colors.terracottaDeep, fontWeight: '700' }}>
                    {t('login.forgotPassword')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={biometricUnlock}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  style={{ alignItems: 'center', padding: 8 }}
                >
                  <Text style={{ color: Colors.terracottaDeep, fontWeight: '700' }}>
                    {t('login.biometricUnlock')}
                  </Text>
                </Pressable>
              </>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: Spacing.lg,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.creamDeep }} />
              <Text style={{ marginHorizontal: 8, color: Colors.charcoalSoft, fontWeight: '600', fontSize: 11 }}>
                {t('login.dividerLabel')}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.creamDeep }} />
            </View>

            <Pressable
              onPress={ssoLogin}
              disabled={busy}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: Spacing.md,
                borderRadius: Radii.md,
                borderWidth: 2,
                borderColor: Colors.charcoal,
                backgroundColor: Colors.white,
              }}
            >
              <Text style={{ marginRight: 8 }}>🇬</Text>
              <Text style={{ color: Colors.charcoal, fontWeight: '700' }}>{t('login.ssoGoogle')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
