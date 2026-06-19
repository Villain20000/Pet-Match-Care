import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Field, ChipSelect } from '@/components/Field';
import { Stepper } from '@/components/Stepper';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SkeletonLine } from '@/components/Skeleton';
import { useCreateLostPet, useLostPetList } from '@/services/lost-pets';
import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { Species } from '@/types';
import { haptic } from '@/services/haptics';
import { getCurrentLocation, type ResolvedLocation } from '@/services/location';
import { useT, useI18nStore, formatters } from '@/services/i18n';

const MOCK_PETS = [
  {
    id: 'm1',
    name: 'Λουκάς',
    species: 'DOG' as const,
    description: 'Καφέ Labrador, χαμένος στην πλατεία Αγίας Παρασκευής.',
    imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=900',
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    addressHint: 'Αγία Παρασκευή, Αθήνα',
    reward: '€50',
    isFound: false,
    lastSeenLat: 38.0,
    lastSeenLng: 23.83,
    breed: 'Labrador',
    microchipId: null,
  },
];

export const LostPetScreen = () => {
  const list = useLostPetList();
  const create = useCreateLostPet();
  const t = useT();
  const locale = useI18nStore((s) => s.locale);

  const [stage, setStage] = useState<'list' | 'create'>('list');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Partial<{
    name: string;
    species: Species;
    description: string;
    imageUri: string;
    location: ResolvedLocation;
    breed: string;
    microchipId: string;
    reward: string;
  }>>({ species: 'DOG' });

  const onPickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!r.canceled && r.assets[0]) setDraft((d) => ({ ...d, imageUri: r.assets[0]!.uri }));
  };

  const onUseLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setDraft((d) => ({ ...d, location: loc }));
      haptic.success();
    } catch {
      haptic.error();
    }
  };

  const submit = async () => {
    if (!draft.name || !draft.species || !draft.description || !draft.imageUri || !draft.location) return;
    await create.mutateAsync({
      name: draft.name,
      species: draft.species,
      breed: draft.breed,
      microchipId: draft.microchipId,
      description: draft.description,
      imageUrl: draft.imageUri,
      lastSeenAt: new Date().toISOString(),
      lastSeenLat: draft.location.latitude,
      lastSeenLng: draft.location.longitude,
      addressHint: draft.location.addressHint,
      reward: draft.reward,
    });
    haptic.success();
    setStage('list');
    setStep(1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      {stage === 'list' ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: Colors.charcoalSoft }}>
            {t('lostPets.overline')}
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.4 }}>
            {t('lostPets.title')}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.charcoalSoft, marginTop: 6, marginBottom: Spacing.lg }}>
            {t('lostPets.body')}
          </Text>

          <PrimaryButton
            title={t('lostPets.ctaCreate')}
            onPress={() => setStage('create')}
          />

          <Text style={{ marginTop: Spacing.xl, fontSize: 18, fontWeight: '700', color: Colors.charcoal }}>
            {t('lostPets.recent')}
          </Text>

          {list.isLoading ? (
            <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
              <SkeletonLine width="100%" height={120} />
              <SkeletonLine width="100%" height={120} />
            </View>
          ) : (
            <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
              {(list.data ?? MOCK_PETS).map((pet) => (
                <View
                  key={pet.id}
                  style={[
                    {
                      backgroundColor: Colors.white,
                      borderRadius: Radii.lg,
                      overflow: 'hidden',
                      flexDirection: 'row',
                    },
                    Shadows.soft,
                  ]}
                >
                  <Image source={{ uri: pet.imageUrl }} style={{ width: 110, height: '100%' }} resizeMode="cover" />
                  <View style={{ flex: 1, padding: Spacing.md }}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.charcoal }}>
                      {pet.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.charcoalSoft, marginTop: 2 }}>
                      🕒 {formatters.dateTime(pet.lastSeenAt, locale)}
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.charcoal, marginTop: 6 }} numberOfLines={2}>
                      📍 {pet.addressHint ?? t('lostPets.locationHint')}
                    </Text>
                    {pet.reward ? (
                      <Text style={{ fontSize: 12, color: Colors.terracottaDeep, fontWeight: '700', marginTop: 4 }}>
                        💰 {t('lostPets.labelReward')}: {pet.reward}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: Spacing.hero }} keyboardShouldPersistTaps="handled">
          <Stepper
            current={step}
            labels={[t('lostPets.stepBasics'), t('lostPets.stepPhoto'), t('lostPets.stepConfirm')]}
          />

          {step === 1 ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
                {t('lostPets.title')}
              </Text>
              <Field label={t('lostPets.labelName')} value={draft.name ?? ''} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} />
              <ChipSelect
                label={t('lostPets.labelSpecies')}
                value={draft.species ?? null}
                options={[
                  { label: t('lostPets.speciesDog'), value: 'DOG' },
                  { label: t('lostPets.speciesCat'), value: 'CAT' },
                  { label: t('lostPets.speciesOther'), value: 'OTHER' },
                ]}
                onChange={(v) => setDraft((d) => ({ ...d, species: v as Species }))}
              />
              <Field label={t('lostPets.labelBreed')} value={draft.breed ?? ''} onChangeText={(v) => setDraft((d) => ({ ...d, breed: v }))} />
              <Field
                label={t('lostPets.labelDescription')}
                value={draft.description ?? ''}
                onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
                placeholder={t('lostPets.descriptionPlaceholder')}
                multiline
              />
              <Field label={t('lostPets.labelMicrochip')} value={draft.microchipId ?? ''} onChangeText={(v) => setDraft((d) => ({ ...d, microchipId: v }))} />
              <PrimaryButton title={t('common.continue')} onPress={() => setStep(2)} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
                {t('lostPets.stepPhoto')}
              </Text>
              <Pressable
                onPress={onPickImage}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                style={{
                  height: 180,
                  borderRadius: Radii.lg,
                  backgroundColor: draft.imageUri ? Colors.charcoal : Colors.creamSoft,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                {draft.imageUri ? (
                  <Image source={{ uri: draft.imageUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ color: Colors.charcoal, fontWeight: '700' }}>{t('lostPets.pickup')}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={onUseLocation}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                style={[
                  {
                    backgroundColor: Colors.creamSoft,
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                  Shadows.hush,
                ]}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700' }}>{t('lostPets.locationTitle')}</Text>
                  <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>
                    {draft.location
                      ? `${draft.location.addressHint ?? `${draft.location.latitude.toFixed(4)}, ${draft.location.longitude.toFixed(4)}`}`
                      : t('lostPets.locationHint')}
                  </Text>
                </View>
              </Pressable>

              <Field
                label={t('lostPets.labelReward')}
                value={draft.reward ?? ''}
                onChangeText={(v) => setDraft((d) => ({ ...d, reward: v }))}
                placeholder={t('lostPets.rewardPlaceholder')}
              />

              <PrimaryButton title={t('common.continue')} onPress={() => setStep(3)} variant="primary" />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.charcoal, marginTop: Spacing.lg }}>
                {t('lostPets.stepConfirm')}
              </Text>
              <View style={[Shadows.soft, { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radii.lg, marginVertical: Spacing.md }]}>
                <Text style={{ fontWeight: '700', color: Colors.charcoal }}>{draft.name}</Text>
                <Text style={{ color: Colors.charcoalSoft, marginTop: 2 }}>
                  {draft.species === 'DOG' ? t('lostPets.speciesDog') : draft.species === 'CAT' ? t('lostPets.speciesCat') : t('lostPets.speciesOther')}
                  {draft.breed ? ` · ${draft.breed}` : ''}
                </Text>
                <Text style={{ marginTop: Spacing.sm, color: Colors.charcoal }}>{draft.description}</Text>
                <Text style={{ marginTop: Spacing.sm, color: Colors.charcoalSoft }}>
                  📍 {draft.location?.addressHint ?? t('report.locationError')}
                </Text>
              </View>
              <PrimaryButton title={t('lostPets.submit')} onPress={submit} variant="danger" loading={create.isPending} />
              <Pressable onPress={() => setStage('list')} style={{ alignItems: 'center', padding: Spacing.md }}>
                <Text style={{ color: Colors.charcoalSoft, fontWeight: '700' }}>{t('common.cancel')}</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
