/**
 * Re-auth sheet — bottom sheet that prompts the user for a TOTP code OR
 * one of their recovery codes when the server requires step-up.
 *
 * Surfaces the STEP_UP_REQUIRED error code from the backend.
 */
import { useState } from 'react';
import { View, Text, Modal, TextInput, Pressable } from 'react-native';
import { useAuthStore } from '@/services/auth';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { haptic } from '@/services/haptics';

interface ReAuthSheetProps {
  visible: boolean;
  capability?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ReAuthSheet = ({ visible, capability, onCancel, onSuccess }: ReAuthSheetProps) => {
  const stepUp = useAuthStore((s) => s.stepUp);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (code.length < 6) {
      setError('Εισάγετε 6-ψήφιο κωδικό 2FA ή recovery code');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await stepUp(code);
      haptic.success();
      setCode('');
      onSuccess();
    } catch (err) {
      haptic.error();
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: Colors.cream, padding: Spacing.xl }}>
        <View
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.creamDeep,
            alignSelf: 'center',
            marginBottom: Spacing.lg,
          }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: Colors.charcoalSoft,
            letterSpacing: 0.5,
          }}
        >
          ΑΣΦΑΛΕΙΑ
        </Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: Colors.charcoal,
            letterSpacing: -0.4,
            marginVertical: Spacing.sm,
          }}
        >
          Επιβεβαίωση 2FA
        </Text>
        <Text style={{ color: Colors.charcoalSoft, marginBottom: Spacing.lg, fontSize: 14, lineHeight: 20 }}>
          Για {capability ?? 'αυτή την ενέργεια'} χρειαζόμαστε πρόσφατη επαλήθευση 2FA.
          Εισάγετε τον 6-ψήφιο κωδικό από την εφαρμογή authenticator ή ένα recovery code.
        </Text>

        <TextInput
          placeholder="123456 ή XXXXX-XXXXX"
          placeholderTextColor={Colors.charcoalSoft + '99'}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoFocus
          style={{
            backgroundColor: Colors.white,
            borderRadius: Radii.md,
            padding: Spacing.lg,
            fontSize: 18,
            color: Colors.charcoal,
            letterSpacing: 4,
            textAlign: 'center',
            borderWidth: 1,
            borderColor: Colors.creamDeep,
            ...Shadows.hush,
          }}
        />

        {error ? (
          <Text style={{ color: Colors.crimson, marginTop: Spacing.sm, fontWeight: '600', fontSize: 13 }}>
            {error}
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={submit}
          disabled={busy}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={{
            backgroundColor: Colors.terracotta,
            paddingVertical: 14,
            borderRadius: Radii.md,
            alignItems: 'center',
            marginTop: Spacing.lg,
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Text style={{ color: Colors.white, fontWeight: '700', letterSpacing: 0.4 }}>
            {busy ? 'Γίνεται επαλήθευση…' : 'ΕΠΙΒΕΒΑΙΩΣΗ'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          style={{
            padding: Spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.charcoalSoft, fontWeight: '700' }}>Ακύρωση</Text>
        </Pressable>
      </View>
    </Modal>
  );
};
