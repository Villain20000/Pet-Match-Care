import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Radii, Shadows, Spacing } from '@/theme';
import { adoptionApi } from '@/services/reports';
import { useAuthStore } from '@/services/auth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useT } from '@/services/i18n';
import type { PetForAdoptionDto } from '@/types';

const MOCK_PETS: PetForAdoptionDto[] = [
  {
    id: 'a1',
    shelterId: 's1',
    name: 'Λουλούδι',
    species: 'DOG',
    age: '2 ετών',
    size: 'Μεσαίο',
    description:
      'Γλυκότατο κουταβάκι που βρέθηκε στον δρόμο. Λατρεύει τις βόλτες και τα παιδιά.',
    imageUrl: 'https://images.unsplash.com/photo-1583511655826-2fff2d2afd4d?w=900',
    isUrgent: true,
    status: 'AVAILABLE',
    isMicrochipped: true,
    microchipNumber: 'GR-900-2231-9009',
    isVaccinated: true,
    isSterilized: false,
    healthNotes: 'Ήπια δερματίτιδα υπό αγωγή.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's1', name: 'Φιλοζωική "Αγάπη"', city: 'Αθήνα', phone: '+30 210 555 1199' },
  },
  {
    id: 'a2',
    shelterId: 's2',
    name: 'Μάγια',
    species: 'CAT',
    age: '8 μηνών',
    size: 'Μικρό',
    description: 'Παιχνιδιάρα γατούλα με εκπληκτικά μάτια. Ζει σε εσωτερικό χώρο.',
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=900',
    isUrgent: false,
    status: 'AVAILABLE',
    isMicrochipped: true,
    microchipNumber: 'GR-900-3311-7773',
    isVaccinated: true,
    isSterilized: true,
    healthNotes: 'Υγιέστατη.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's2', name: 'Save a Stray GR', city: 'Θεσσαλονίκη', phone: null },
  },
  {
    id: 'a3',
    shelterId: 's1',
    name: 'Άρης',
    species: 'DOG',
    age: '5 ετών',
    size: 'Μεγάλο',
    description: 'Ήρεμος σκύλος που αναζητά οικογένεια με κήπο.',
    imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900',
    isUrgent: false,
    status: 'AVAILABLE',
    isMicrochipped: false,
    microchipNumber: null,
    isVaccinated: true,
    isSterilized: true,
    healthNotes: 'Μικρή αρθρίτιδα στο δεξί πίσω πόδι.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's1', name: 'Φιλοζωική "Αγάπη"', city: 'Αθήνα', phone: '+30 210 555 1199' },
  },
  {
    id: 'a4',
    shelterId: 's3',
    name: 'Σταμάτης',
    species: 'DOG',
    age: '10 ετών',
    size: 'Μεσαίο',
    description: 'Senior σκυλάκος που αξίζει μια δεύτερη ευκαιρία στη ζωή.',
    imageUrl: 'https://images.unsplash.com/photo-1530041686259-53c00faea5d2?w=900',
    isUrgent: true,
    status: 'AVAILABLE',
    isMicrochipped: true,
    microchipNumber: 'GR-900-7771-0011',
    isVaccinated: true,
    isSterilized: true,
    healthNotes: 'Χρειάζεται ειδική διατροφή λόγω ηλικίας.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's3', name: 'Φιλόξενα Σκυλιά', city: 'Ηράκλειο', phone: '+30 2810 555 909' },
  },
  {
    id: 'a5',
    shelterId: 's2',
    name: 'Μαρίνα',
    species: 'CAT',
    age: '3 ετών',
    size: 'Μικρό',
    description: 'Κοινωνική και στοργική. Ιδανική για διαμέρισμα.',
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=900',
    isUrgent: false,
    status: 'AVAILABLE',
    isMicrochipped: true,
    microchipNumber: 'GR-900-4442-7755',
    isVaccinated: true,
    isSterilized: true,
    healthNotes: 'Καμία ιδιαίτερη ανάγκη.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's2', name: 'Save a Stray GR', city: 'Θεσσαλονίκη', phone: null },
  },
  {
    id: 'a6',
    shelterId: 's1',
    name: 'Ζήσης',
    species: 'DOG',
    age: '1 έτους',
    size: 'Μεσαίο',
    description: 'Πυρήναια ενέργειας! Ψάχνει δραστήρια οικογένεια.',
    imageUrl: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=900',
    isUrgent: false,
    status: 'AVAILABLE',
    isMicrochipped: true,
    microchipNumber: 'GR-900-5519-8871',
    isVaccinated: true,
    isSterilized: false,
    healthNotes: 'Πολύ υγιές. Χρειάζεται εκπαίδευση.',
    createdAt: new Date().toISOString(),
    shelter: { id: 's1', name: 'Φιλοζωική "Αγάπη"', city: 'Αθήνα', phone: '+30 210 555 1199' },
  },
];

type Filter = 'ALL' | 'DOG' | 'CAT' | 'URGENT';

export const AdoptionScreen = () => {
  const me = useAuthStore((s) => s.user);
  const t = useT();

  const [pets, setPets] = useState<PetForAdoptionDto[]>(MOCK_PETS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<PetForAdoptionDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [expressedInterest, setExpressedInterest] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await adoptionApi.list();
        if (list.length > 0) setPets(list);
      } catch {
        /* keep mocks for demo */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pets.filter((p) => {
      if (filter === 'DOG' && p.species !== 'DOG') return false;
      if (filter === 'CAT' && p.species !== 'CAT') return false;
      if (filter === 'URGENT' && !p.isUrgent) return false;
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pets, filter, query]);

  const expressInterest = async (petId: string) => {
    if (!me) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExpressedInterest((s) => new Set(s).add(petId));
    try {
      await adoptionApi.expressInterest(petId);
    } catch {
      /* offline ok */
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            color: Colors.charcoalSoft,
          }}
        >
          {t('adoption.overline')}
        </Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: Colors.charcoal,
            letterSpacing: -0.4,
            marginTop: 2,
          }}
        >
          {t('adoption.title')}
        </Text>

        {/* Search */}
        <View
          style={[
            {
              backgroundColor: Colors.white,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderRadius: Radii.lg,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: Spacing.md,
            },
            Shadows.hush,
          ]}
        >
          <Text style={{ marginRight: 8, fontSize: 16 }}>🔎</Text>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: Colors.charcoal }}
            placeholder={t('adoption.search')}
            placeholderTextColor={Colors.charcoalSoft + '99'}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: Spacing.md }}
        >
          {(
            [
              { key: 'ALL' as Filter, label: t('adoption.chipAll') },
              { key: 'DOG' as Filter, label: t('adoption.chipDog') },
              { key: 'CAT' as Filter, label: t('adoption.chipCat') },
              { key: 'URGENT' as Filter, label: t('adoption.chipUrgent') },
            ]
          ).map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setFilter(f.key);
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm + 2,
                  borderRadius: Radii.pill,
                  backgroundColor: active ? Colors.terracotta : Colors.creamSoft,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: '700',
                    fontSize: 13,
                    color: active ? Colors.white : Colors.charcoal,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.terracotta} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.hero }}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.sm }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setSelected(item);
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              style={[
                {
                  flex: 1,
                  backgroundColor: Colors.white,
                  borderRadius: Radii.lg,
                  overflow: 'hidden',
                  ...Shadows.soft,
                },
              ]}
            >
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', height: 150 }}
                  resizeMode="cover"
                />
                {item.isUrgent ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: Radii.pill,
                      backgroundColor: Colors.crimson,
                    }}
                  >
                    <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 10 }}>
                      {t('adoption.urgentBadge')}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: Radii.pill,
                    backgroundColor: Colors.charcoal + 'E6',
                  }}
                >
                  <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 11 }}>
                    {item.species === 'DOG' ? t('adoption.speciesDog') : t('adoption.speciesCat')}
                  </Text>
                </View>
              </View>
              <View style={{ padding: 12 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '700', color: Colors.charcoal, letterSpacing: -0.2 }}
                >
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.charcoalSoft, marginTop: 2 }}>
                  {item.age} · {item.size}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, color: Colors.sageDeep, marginTop: 4, fontWeight: '600' }}
                >
                  {item.shelter?.name}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: Colors.charcoalSoft, marginTop: 32 }}>
              {t('adoption.empty')}
            </Text>
          }
        />
      )}

      {/* Detail modal */}
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      >
        {selected ? (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={['top']}>
            <ScrollView contentContainerStyle={{ paddingBottom: Spacing.hero + 24 }}>
              <Image
                source={{ uri: selected.imageUrl }}
                style={{ width: '100%', height: 280 }}
                resizeMode="cover"
              />
              <View style={{ padding: Spacing.xl, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: Colors.charcoal,
                    letterSpacing: -0.5,
                  }}
                >
                  {selected.name}
                </Text>
                <Text style={{ color: Colors.charcoalSoft, fontSize: 15 }}>
                  {selected.age} · {selected.size} ·{' '}
                  {selected.species === 'DOG' ? t('adoption.chipDog').replace('🐕 ', '') : t('adoption.chipCat').replace('🐈 ', '')}
                </Text>
                <Text style={{ color: Colors.terracottaDeep, marginTop: 6, fontWeight: '700' }}>
                  {selected.shelter?.name} · {selected.shelter?.city}
                </Text>

                <Text style={{ fontSize: 15, color: Colors.charcoal, lineHeight: 22, marginTop: Spacing.md }}>
                  {selected.description}
                </Text>

                <View
                  style={[
                    {
                      marginTop: Spacing.lg,
                      backgroundColor: Colors.white,
                      borderRadius: Radii.lg,
                      padding: Spacing.lg,
                    },
                    Shadows.hush,
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 0.6,
                      color: Colors.charcoalSoft,
                      marginBottom: 6,
                    }}
                  >
                    {t('adoption.modalHealth')}
                  </Text>
                  {[
                    { label: t('adoption.fieldMicrochip'), ok: selected.isMicrochipped, value: selected.microchipNumber },
                    { label: t('adoption.fieldVaccinated'), ok: selected.isVaccinated },
                    { label: t('adoption.fieldSterilized'), ok: selected.isSterilized },
                  ].map((row) => (
                    <View
                      key={row.label}
                      style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}
                    >
                      <Text style={{ fontSize: 18, marginRight: 8 }}>
                        {row.ok ? '✅' : '⛔'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: Colors.charcoal }}>
                          {row.label}
                        </Text>
                        {row.value ? (
                          <Text style={{ fontSize: 12, color: Colors.charcoalSoft }}>
                            {row.value}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                  {selected.healthNotes ? (
                    <Text
                      style={{
                        marginTop: Spacing.sm,
                        fontStyle: 'italic',
                        color: Colors.charcoalSoft,
                        fontSize: 13,
                      }}
                    >
                      📝 {selected.healthNotes}
                    </Text>
                  ) : null}
                </View>

                <PrimaryButton
                  title={
                    expressedInterest.has(selected.id)
                      ? t('adoption.btnInterestedSent')
                      : t('adoption.btnInterested')
                  }
                  onPress={() => expressInterest(selected.id)}
                  variant={expressedInterest.has(selected.id) ? 'invert' : 'primary'}
                  style={{ marginTop: Spacing.lg }}
                />
                <Pressable
                  onPress={() => setSelected(null)}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  style={{
                    paddingVertical: Spacing.md,
                    borderRadius: Radii.md,
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: Colors.charcoalSoft, fontWeight: '700' }}>
                    {t('common.close')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
};
