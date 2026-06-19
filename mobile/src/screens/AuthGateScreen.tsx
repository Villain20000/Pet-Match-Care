import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/services/auth';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { haptic } from '@/services/haptics';
import { installLinkingListeners, parseDeepLink } from '@/services/deeplink';
import { useT } from '@/services/i18n';

interface Props {
  initialToken?: string | null;
}

export const VerifyEmailScreen = ({ initialToken }: Props) => {
  const user = useAuthStore((s) => s.user);
  const sendVerification = useAuthStore((s) => s.sendVerification);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const logout = useAuthStore((s) => s.logout);
  const t = useT();

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialToken) return;
    void consume(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  useEffect(() => {
    const cleanup = installLinkingListeners();
    return cleanup;
  }, []);

  const consume = async (token: string) => {
    setVerifying(true);
    setError(null);
    try {
      await verifyEmail(token);
      haptic.success();
      setVerified(true);
    } catch (err) {
      haptic.error();
      setError(String(err));
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (verifying || verified || error) return;
    void parseDeepLink;
  }, [verifying, verified, error]);

  if (verified) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, padding: Spacing.xl }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={[
              {
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.sage,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.lg,
              },
              Shadows.soft,
            ]}
          >
            <Text style={{ fontSize: 32 }}>🎉</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4, textAlign: 'center' }}>
            {t('verifyEmail.successTitle')}
          </Text>
          <Text style={{ color: Colors.charcoalSoft, fontSize: 14, marginTop: 6, textAlign: 'center' }}>
            {t('verifyEmail.successBody')}
          </Text>
          <Pressable
            onPress={() => {
              haptic.tap();
              void logout().then(() => {
                /* AppNavigator re-routes to MainStack */
              });
            }}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={{
              marginTop: Spacing.xl,
              backgroundColor: Colors.terracotta,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: Radii.pill,
            }}
          >
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('verifyEmail.successCta')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, padding: Spacing.xl }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={[
            {
              backgroundColor: Colors.terracotta,
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.lg,
            },
            Shadows.soft,
          ]}
        >
          <Text style={{ fontSize: 32 }}>📬</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4, textAlign: 'center' }}>
          {t('verifyEmail.title')}
        </Text>
        <Text style={{ color: Colors.charcoalSoft, marginTop: 6, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>
          {t('verifyEmail.body', { email: user?.email ?? '' })}
        </Text>

        {verifying ? (
          <ActivityIndicator color={Colors.terracotta} style={{ marginTop: Spacing.lg }} />
        ) : (
          <Pressable
            onPress={async () => {
              haptic.tap();
              setSending(true);
              try {
                await sendVerification();
              } finally {
                setSending(false);
              }
            }}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={{
              marginTop: Spacing.xl,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderRadius: Radii.pill,
              backgroundColor: Colors.white,
              borderWidth: 2,
              borderColor: Colors.terracotta,
            }}
          >
            <Text style={{ color: Colors.terracottaDeep, fontWeight: '700' }}>{t('verifyEmail.ctaResend')}</Text>
          </Pressable>
        )}

        {error ? (
          <Text style={{ marginTop: Spacing.md, color: Colors.crimson, fontSize: 13, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={() => {
            haptic.select();
            void logout();
          }}
          style={{ marginTop: Spacing.hero }}
        >
          <Text style={{ color: Colors.charcoalSoft, fontWeight: '600' }}>{t('verifyEmail.logoutLink')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
