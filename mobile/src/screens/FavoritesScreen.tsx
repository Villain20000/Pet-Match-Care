/**
 * FavoritesScreen — the user's saved adoption pets. Reuses the same card
 * layout as AdoptionScreen, with pull-to-refresh, loading / empty / error
 * states, and a heart toggle that removes a pet from favorites.
 *
 * Theme-aware via useThemeColors(); strings flow through useT().
 */
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { AppNavigation } from '@/navigation/types';
import * as Haptics from 'expo-haptics';

import { Radii, Shadows, Spacing } from '@/theme';
import { useThemeColors } from '@/services/theme';
import { useT } from '@/services/i18n';
import { useFavoritePets, useFavorites } from '@/services/favorites';
import { toast } from '@/services/toast';
import { haptic } from '@/services/haptics';
import type { PetForAdoptionDto } from '@/types';

export const FavoritesScreen = () => {
  const navigation = useNavigation<AppNavigation>();
  const { colors } = useThemeColors();
  const t = useT();
  const query = useFavoritePets();
  const { toggle, isFavorite } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const pets = query.data ?? [];

  const refresh = async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const sharePet = async (pet: PetForAdoptionDto) => {
    void Haptics.selectionAsync();
    try {
      await Share.share({ message: t('adoption.shareMessage', { name: pet.name }) });
    } catch {
      /* user cancelled */
    }
  };

  const renderCard = ({ item }: { item: PetForAdoptionDto }) => (
    <Pressable
      onPress={() => navigation.navigate('Υιοθεσίες')}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      style={[{ flex: 1, backgroundColor: colors.white, borderRadius: Radii.lg, overflow: 'hidden' }, Shadows.soft]}
    >
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 150 }} resizeMode="cover" />
        <Pressable
          onPress={() => {
            haptic.select();
            toggle(item.id);
            toast.info({ title: isFavorite(item.id) ? t('adoption.favoriteRemoved') : t('adoption.favoriteAdded') });
          }}
          android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: true }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={isFavorite(item.id) ? t('adoption.btnUnfavorite') : t('adoption.btnFavorite')}
        >
          <Text style={{ fontSize: 18 }}>{isFavorite(item.id) ? '❤️' : '🤍'}</Text>
        </Pressable>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.2 }}>{item.name}</Text>
        <Text style={{ fontSize: 12, color: colors.charcoalSoft, marginTop: 2 }}>{item.age} · {item.size}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: colors.sageDeep, fontWeight: '600' }}>
            {item.shelter?.name ?? '—'}
          </Text>
          <Pressable onPress={() => sharePet(item)} hitSlop={8}>
            <Text style={{ fontSize: 16 }}>📤</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.charcoalSoft }}>
          {t('favorites.overline')}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.charcoal, letterSpacing: -0.4, marginTop: 2 }}>
          {t('favorites.title')}
        </Text>
      </View>

      {query.isLoading && !refreshing ? (
        <ActivityIndicator color={colors.terracotta} style={{ marginTop: Spacing.xl }} />
      ) : query.isError && pets.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: Spacing.hero, paddingHorizontal: Spacing.xl }}>
          <Text style={{ fontSize: 40 }}>😿</Text>
          <Text style={{ fontWeight: '700', color: colors.charcoal, marginTop: Spacing.md }}>{t('common.errorOccurred')}</Text>
          <Text style={{ color: colors.charcoalSoft, marginTop: 4, textAlign: 'center' }}>{t('common.errorBody')}</Text>
          <Pressable
            onPress={refresh}
            style={{ marginTop: Spacing.md, backgroundColor: colors.terracotta, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radii.pill }}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : pets.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: Spacing.hero, paddingHorizontal: Spacing.xl }}>
          <Text style={{ fontSize: 44 }}>🐾</Text>
          <Text style={{ fontWeight: '700', color: colors.charcoal, marginTop: Spacing.md, textAlign: 'center' }}>
            {t('favorites.empty')}
          </Text>
          <Text style={{ color: colors.charcoalSoft, marginTop: 6, textAlign: 'center' }}>{t('favorites.emptyHint')}</Text>
          <Pressable
            onPress={() => navigation.navigate('Υιοθεσίες')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            style={{ marginTop: Spacing.lg, backgroundColor: colors.terracotta, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radii.pill }}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>{t('favorites.browse')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.hero }}
          columnWrapperStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.sm }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.terracotta} />}
          renderItem={renderCard}
        />
      )}
    </SafeAreaView>
  );
};
