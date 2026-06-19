import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stepper } from '@/components/Stepper';
import { Field } from '@/components/Field';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ReAuthSheet } from '@/components/ReAuthSheet';
import { useCreateDraft, isStepUpRequired } from '@/services/applications';
import { useT } from '@/services/i18n';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { haptic } from '@/services/haptics';

type QKind = 'text' | 'boolean' | 'number';
interface QuestionnaireQuestion {
  id: 'previousPets' | 'dailyWalks' | 'travelFrequently' | 'vetBudget';
  key: string;
  kind: QKind;
}

const QUESTIONS: QuestionnaireQuestion[] = [
  { id: 'previousPets', key: 'application.multiStep.q.previousPets', kind: 'text' },
  { id: 'dailyWalks', key: 'application.multiStep.q.dailyWalks', kind: 'number' },
  { id: 'travelFrequently', key: 'application.multiStep.q.travelFrequently', kind: 'boolean' },
  { id: 'vetBudget', key: 'application.multiStep.q.vetBudget', kind: 'boolean' },
];

export const AdoptionApplicationScreen = ({ route, navigation }: any) => {
  const t = useT();
  const pet = route?.params?.pet;
  const create = useCreateDraft();

  const [step, setStep] = useState(1);
  const [motivation, setMotivation] = useState('');
  const [hasYard, setHasYard] = useState(false);
  const [hasKids, setHasKids] = useState(false);
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [hoursAlone, setHoursAlone] = useState('4');
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [showReAuth, setShowReAuth] = useState(false);

  useEffect(() => {
    if (!pet) {
      // Fall back: if we landed here without a pet, push back to AdoptionMarket.
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Υιοθεσίες');
    }
  }, [pet, navigation]);

  const submit = async () => {
    if (!pet) return;

    const payload = {
      petId: pet.id,
      motivation,
      homeEnvironment: { hasYard, hasKids, hasOtherPets, hoursAlone: Number(hoursAlone) || 0 },
      questionnaire: answers,
    };

    setShowReAuth(false);
    try {
      haptic.tap();
      await create.mutateAsync(payload);
      haptic.success();
      navigation.replace('Οι αιτήσεις μου' as never);
    } catch (err) {
      if (isStepUpRequired(err)) {
        setShowReAuth(true);
      } else {
        haptic.error();
      }
    }
  };

  if (!pet) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing.md,
            backgroundColor: Colors.white,
            borderRadius: Radii.lg,
            marginBottom: Spacing.lg,
            ...Shadows.soft,
          }}
        >
          <Image source={{ uri: pet.imageUrl }} style={{ width: 64, height: 64, borderRadius: 12 }} resizeMode="cover" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{pet.name}</Text>
            <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>{pet.shelter?.name ?? t('application.shelter')}</Text>
          </View>
        </View>

        <Stepper
          current={step}
          labels={[
            t('application.multiStep.motivation'),
            t('application.multiStep.home'),
            t('application.multiStep.questionnaire'),
            t('application.multiStep.confirm'),
          ]}
        />

        {step === 1 ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
              {t('application.multiStep.motivation')}
            </Text>
            <Text style={{ color: Colors.charcoalSoft, marginTop: 6, marginBottom: Spacing.md }}>
              {t('application.multiStep.motivationHint')}
            </Text>
            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={motivation}
              onChangeText={setMotivation}
              placeholder={t('application.multiStep.motivationPlaceholder')}
              style={{
                backgroundColor: Colors.white,
                borderRadius: Radii.md,
                padding: Spacing.lg,
                fontSize: 15,
                color: Colors.charcoal,
                minHeight: 140,
                borderWidth: 1,
                borderColor: Colors.creamDeep,
                ...Shadows.hush,
              }}
            />
            <PrimaryButton title={t('application.multiStep.nextArrow')} onPress={() => setStep(2)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
              {t('application.multiStep.home')}
            </Text>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              {[{
                label: t('application.multiStep.hasYard'),
                value: hasYard,
                onChange: setHasYard,
              }, {
                label: t('application.multiStep.hasKids'),
                value: hasKids,
                onChange: setHasKids,
              }, {
                label: t('application.multiStep.hasOtherPets'),
                value: hasOtherPets,
                onChange: setHasOtherPets,
              }].map((row) => (
                <Pressable
                  key={row.label}
                  onPress={() => row.onChange(!row.value)}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  style={{
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: row.value ? Colors.terracotta : Colors.creamSoft,
                  }}
                >
                  <Text
                    style={{
                      color: row.value ? Colors.white : Colors.charcoal,
                      fontWeight: '700',
                    }}
                  >
                    {row.label} {row.value ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Field
              label={t('application.multiStep.hoursAlone')}
              value={hoursAlone}
              onChangeText={setHoursAlone}
              keyboardType="number-pad"
            />
            <PrimaryButton title={t('application.multiStep.nextArrow')} onPress={() => setStep(3)} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
              {t('application.multiStep.questionnaire')}
            </Text>
            <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
              {QUESTIONS.map((q) => (
                <View key={q.id}>
                  <Text style={{ fontWeight: '600', color: Colors.charcoal, marginBottom: 6 }}>
                    {t(q.key)}
                  </Text>
                  {q.kind === 'text' ? (
                    <TextInput
                      value={String(answers[q.id] ?? '')}
                      onChangeText={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                      style={{
                        backgroundColor: Colors.white,
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        borderWidth: 1,
                        borderColor: Colors.creamDeep,
                      }}
                    />
                  ) : q.kind === 'number' ? (
                    <TextInput
                      value={String(answers[q.id] ?? '')}
                      onChangeText={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) || 0 }))}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: Colors.white,
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        borderWidth: 1,
                        borderColor: Colors.creamDeep,
                      }}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[true, false].map((v) => {
                        const active = !!(answers[q.id] === v);
                        return (
                          <Pressable
                            key={String(v)}
                            onPress={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                            style={{
                              flex: 1,
                              paddingVertical: Spacing.md,
                              borderRadius: Radii.pill,
                              backgroundColor: active ? Colors.sage : Colors.creamSoft,
                            }}
                          >
                            <Text
                              style={{
                                textAlign: 'center',
                                fontWeight: '700',
                                color: active ? Colors.white : Colors.charcoal,
                              }}
                            >
                              {v ? t('common.yes') : t('common.no')}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
            <PrimaryButton title={t('application.multiStep.nextArrow')} onPress={() => setStep(4)} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
              {t('application.multiStep.confirm')}
            </Text>
            <View style={[Shadows.soft, { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radii.lg, marginVertical: Spacing.md }]}>
              <Text style={{ fontWeight: '700', color: Colors.charcoal, fontSize: 15 }}>
                {t('application.multiStep.summary')}
              </Text>
              <Text style={{ color: Colors.charcoal, marginVertical: 8 }}>{motivation.slice(0, 200)}</Text>
              <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>
                {t('application.multiStep.summaryRow', {
                  home: hasYard ? t('application.multiStep.summaryYard') : t('application.multiStep.summaryApartment'),
                  kids: t(hasKids ? 'common.yes' : 'common.no'),
                  pets: t(hasOtherPets ? 'common.yes' : 'common.no'),
                  hoursLine: t('application.multiStep.summaryHoursAlone', { hours: hoursAlone }),
                })}
              </Text>
            </View>
            <PrimaryButton
              title={t('application.multiStep.submit')}
              loading={create.isPending}
              onPress={submit}
              variant="danger"
            />
            <Text style={{ fontSize: 12, color: Colors.charcoalSoft, marginTop: 8, textAlign: 'center' }}>
              {t('application.multiStep.reauthHint')}
            </Text>
          </>
        ) : null}
      </ScrollView>

      <ReAuthSheet
        visible={showReAuth}
        capability={t('application.multiStep.reauthCapability')}
        onCancel={() => setShowReAuth(false)}
        onSuccess={() => {
          setShowReAuth(false);
          void submit();
        }}
      />
    </SafeAreaView>
  );
};
