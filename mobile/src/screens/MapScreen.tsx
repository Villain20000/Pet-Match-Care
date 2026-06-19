/**
 * 🗺️ MapScreen — full-screen map of pet-friendly spaces with flashing poison
 * alert markers. Producers of the data: GET /api/spots and
 * GET /api/alerts/poison/active.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { Svg, Circle as SvgCircle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Colors, POISON_RADIUS_KM, Radii, Shadows, Spacing } from '@/theme';
import { FloatingChip, PrimaryButton } from '@/components/ui';
import {
  alertsApi,
  MOCK_SPOTS,
  spotsApi,
  SPOT_PIN_COLORS,
} from '@/services/reports';
import { haversineKm } from '@/services/location';
import { useT, useI18nStore, formatters } from '@/services/i18n';
import type {
  PetFriendlySpotDto,
  PoisonAlertDto,
  SpotCategory,
} from '@/types';

interface ActiveFilter {
  key: 'CAFE' | 'PARK' | 'VET' | 'APARTMENT' | 'POISON';
  icon: string;
}

const FALLBACK_REGION: Region = {
  latitude: 37.9842,
  longitude: 23.7351,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const SpotPin = ({ color, verified }: { color: string; verified: boolean }) => (
  <Svg width={42} height={42} viewBox="0 0 42 42">
    <Defs>
      <RadialGradient id="pinShadow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#000" stopOpacity={0.12} />
        <Stop offset="100%" stopColor="#000" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <SvgCircle cx="21" cy="36" r="6" fill="url(#pinShadow)" />
    <Path
      d="M21 4 C13 4 8 10 8 17 C8 26 21 38 21 38 C21 38 34 26 34 17 C34 10 29 4 21 4 Z"
      fill={color}
      stroke={Colors.charcoal}
      strokeWidth={2}
    />
    {verified ? (
      <Path
        d="M16 18 L20 22 L27 14"
        stroke={Colors.white}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null}
  </Svg>
);

const PoisonPin = ({ flash }: { flash: SharedValue<number> }) => {
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + flash.value * 0.6 }],
    opacity: 0.15 + (1 - flash.value) * 0.5,
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + flash.value * 0.18 }],
  }));

  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Colors.crimson,
          },
          haloStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: Colors.crimson,
            borderWidth: 3,
            borderColor: Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          },
          coreStyle,
        ]}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M12 3 L20 18 H4 Z"
            fill={Colors.white}
            stroke={Colors.charcoal}
            strokeWidth={1.5}
          />
          <Path d="M11 9 H13 V14 H11 Z" fill={Colors.charcoal} />
          <Path d="M11 16 H13 V17.5 H11 Z" fill={Colors.charcoal} />
        </Svg>
      </Animated.View>
    </View>
  );
};

interface SheetState {
  kind: 'spot' | 'poison';
  payload: PetFriendlySpotDto | PoisonAlertDto;
}

const BottomSheet = ({
  sheet,
  onClose,
  onVote,
  userPosition,
}: {
  sheet: SheetState;
  onClose: () => void;
  onVote: (value: 1 | -1) => void;
  userPosition: { latitude: number; longitude: number } | null;
}) => {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const isSpot = sheet.kind === 'spot';
  const spot = isSpot ? (sheet.payload as PetFriendlySpotDto) : null;
  const alert = !isSpot ? (sheet.payload as PoisonAlertDto) : null;

  const distanceKm = useMemo(() => {
    if (!userPosition) return null;
    const target = spot ?? alert;
    if (!target) return null;
    return haversineKm(
      userPosition.latitude,
      userPosition.longitude,
      target.latitude,
      target.longitude,
    );
  }, [alert, spot, userPosition]);

  return (
    <View
      style={[
        styles.sheet,
        Shadows.heavy,
        { borderTopColor: isSpot ? Colors.sage : Colors.crimson, borderTopWidth: 4 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.sheetHandle} />

      {isSpot && spot ? (
        <>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetCategoryBadge}>
                {categoryLabel(spot.category as SpotCategory, t)}
              </Text>
              <Text style={styles.sheetTitle}>{spot.name}</Text>
              {spot.address ? (
                <Text style={styles.sheetSubtitle}>📍 {spot.address}</Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.sheetClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.sheetMetaRow}>
            <View style={styles.sheetMetaItem}>
              <Text style={styles.sheetMetaLabel}>{t('map.verification')}</Text>
              <Text style={[styles.sheetMetaValue, { color: spot.isVerified ? Colors.sageDeep : Colors.charcoalSoft }]}>
                {spot.isVerified ? t('map.spotVerified') : t('map.spotPending')}
              </Text>
            </View>
            <View style={styles.sheetMetaItem}>
              <Text style={styles.sheetMetaLabel}>{t('map.upvotes')}</Text>
              <Text style={styles.sheetMetaValue}>
                👍 {spot.upvotes}  ·  👎 {spot.downvotes}
              </Text>
            </View>
            {distanceKm !== null ? (
              <View style={styles.sheetMetaItem}>
                <Text style={styles.sheetMetaLabel}>{t('map.distance')}</Text>
                <Text style={styles.sheetMetaValue}>
                  {distanceKm.toFixed(2)} {t('map.distanceKm')}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.md }}>
            <PrimaryButton
              title={t('map.btnUpvote')}
              onPress={() => onVote(1)}
              variant="primary"
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <Pressable
              onPress={() => onVote(-1)}
              style={[
                styles.outlinedBtn,
                { borderColor: Colors.charcoal },
              ]}
            >
              <Text style={{ fontWeight: '700', color: Colors.charcoal }}>{t('map.btnDownvote')}</Text>
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sheetBody}>
              {spot.isVerified ? t('map.attribution') : t('map.attributionPending')}
            </Text>
          </ScrollView>
        </>
      ) : null}

      {!isSpot && alert ? (
        <>
          <View style={[styles.sheetHeader, { borderBottomColor: Colors.crimson }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetCategoryBadge, { color: Colors.crimson }]}>
                {t('map.bottomSheetPoison')}
              </Text>
              <Text style={styles.sheetTitle}>{alert.addressHint ?? '—'}</Text>
              <Text style={styles.sheetSubtitle}>
                {formatters.dateTime(alert.createdAt, locale)} ·{' '}
                {alert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.sheetClose}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.sheetBody}>
            {alert.description ?? 'Reported poison nearby. Avoid walks until expiry.'}
          </Text>
          <View style={styles.alertMetaRow}>
            <Text style={styles.sheetMetaLabel}>{t('map.poisonExpires')}</Text>
            <Text style={styles.sheetMetaValue}>
              {formatters.dateTime(alert.expiresAt, locale)}
            </Text>
          </View>
          {distanceKm !== null ? (
            <Text style={styles.alertDistance}>
              {t('map.distance')}: {distanceKm.toFixed(2)} {t('map.distanceKm')}
            </Text>
          ) : null}
          <PrimaryButton
            title={t('map.poisonReportCta')}
            onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            variant="danger"
            style={{ marginTop: Spacing.md }}
          />
        </>
      ) : null}
    </View>
  );
};

const categoryLabel = (c: SpotCategory, t: ReturnType<typeof useT>): string => {
  switch (c) {
    case 'CAFE':
      return t('map.cafe');
    case 'PARK':
      return t('map.park');
    case 'VET':
      return t('map.vet');
    case 'APARTMENT':
      return t('map.apartment');
    default:
      return c;
  }
};

export const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const t = useT();

  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [spots, setSpots] = useState<PetFriendlySpotDto[]>([]);
  const [poisons, setPoisons] = useState<PoisonAlertDto[]>([]);
  const [activeKeys, setActiveKeys] = useState<ActiveFilter['key'][]>([
    'CAFE',
    'PARK',
    'VET',
    'POISON',
  ]);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [loading, setLoading] = useState(true);

  const FILTERS: { key: ActiveFilter['key']; icon: string; label: string }[] = useMemo(
    () => [
      { key: 'CAFE', icon: '☕', label: t('map.cafe') },
      { key: 'PARK', icon: '🌳', label: t('map.park') },
      { key: 'VET', icon: '🏥', label: t('map.vet') },
      { key: 'POISON', icon: '🚨', label: t('map.poison') },
    ],
    [t],
  );

  const flash = useSharedValue(0);
  useEffect(() => {
    flash.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
  }, [flash]);

  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserPosition({
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
        });
        setRegion((prev) => ({
          ...prev,
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
        }));
        watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
          (p) => setUserPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        );
      } catch {
        /* user denied — show fallback map */
      }
    })();
    return () => {
      watcher?.remove();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [s, p] = await Promise.all([
          spotsApi.list().catch(() => MOCK_SPOTS),
          alertsApi.activeNearby(
            region.latitude,
            region.longitude,
            POISON_RADIUS_KM + 2,
          ).catch(() => [] as PoisonAlertDto[]),
        ]);
        if (!alive) return;
        setSpots(s);
        setPoisons(p);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.latitude.toFixed(2), region.longitude.toFixed(2)]);

  const toggleFilter = (key: ActiveFilter['key']) => {
    setActiveKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
    void Haptics.selectionAsync();
  };

  const visibleSpots = useMemo(
    () => spots.filter((s) => activeKeys.includes(s.category as ActiveFilter['key'])),
    [spots, activeKeys],
  );

  const visiblePoisons = useMemo(
    () => (activeKeys.includes('POISON') ? poisons : []),
    [activeKeys, poisons],
  );

  const recenter = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!userPosition || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { ...region, latitude: userPosition.latitude, longitude: userPosition.longitude },
      450,
    );
  };

  const handleVote = async (value: 1 | -1) => {
    if (!sheet || sheet.kind !== 'spot') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await spotsApi.vote(sheet.payload.id, value);
      setSpots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSheet({ kind: 'spot', payload: updated });
    } catch {
      setSpots((prev) =>
        prev.map((s) =>
          s.id === sheet.payload.id
            ? {
                ...s,
                upvotes: s.upvotes + (value === 1 ? 1 : 0),
                downvotes: s.downvotes + (value === -1 ? 1 : 0),
                isVerified: s.upvotes + (value === 1 ? 1 : 0) >= 3,
              }
            : s,
        ),
      );
    }
  };

  const userMarker = useMemo(
    () => (
      <Marker
        coordinate={
          userPosition ?? { latitude: region.latitude, longitude: region.longitude }
        }
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <View style={styles.userDotOuter}>
          <View style={styles.userDot} />
        </View>
      </Marker>
    ),
    [region.latitude, region.longitude, userPosition],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={FALLBACK_REGION}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled={false}
        toolbarEnabled={false}
        mapType="standard"
        provider={undefined}
      >
        {visiblePoisons.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges
            onPress={() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              setSheet({ kind: 'poison', payload: p });
            }}
          >
            <PoisonPin flash={flash} />
          </Marker>
        ))}

        {visiblePoisons.map((p) => (
          <Circle
            key={`halo-${p.id}`}
            center={{ latitude: p.latitude, longitude: p.longitude }}
            radius={POISON_RADIUS_KM * 1000}
            fillColor="rgba(230, 57, 70, 0.10)"
            strokeColor="rgba(230, 57, 70, 0.45)"
            strokeWidth={2}
          />
        ))}

        {visibleSpots.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => {
              void Haptics.selectionAsync();
              setSheet({ kind: 'spot', payload: s });
            }}
          >
            <SpotPin
              color={SPOT_PIN_COLORS[s.category] ?? Colors.terracotta}
              verified={s.isVerified}
            />
          </Marker>
        ))}

        {userMarker}
      </MapView>

      {/* Top floating chips */}
      <View style={styles.chipRow} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2 }}
        >
          {FILTERS.map((f) => (
            <FloatingChip
              key={f.key}
              icon={f.icon}
              label={f.label}
              active={activeKeys.includes(f.key)}
              onPress={() => toggleFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Live counts pill */}
      <View
        style={[
          styles.statusPill,
          Shadows.soft,
          {
            backgroundColor:
              visiblePoisons.length > 0 ? Colors.crimson : Colors.creamSoft,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.charcoal} size="small" />
        ) : (
          <Text
            style={{
              color: visiblePoisons.length > 0 ? Colors.white : Colors.charcoal,
              fontWeight: '700',
            }}
          >
            {visiblePoisons.length > 0
              ? t('map.statusPoison', { count: visiblePoisons.length })
              : t('map.statusSpots', { count: visibleSpots.length })}
          </Text>
        )}
      </View>

      {/* Recenter FAB */}
      <Pressable onPress={recenter} style={[styles.fab, Shadows.heavy]}>
        <Text style={{ fontSize: 22 }}>📍</Text>
      </Pressable>

      {/* Bottom sheet */}
      {sheet ? (
        <BottomSheet
          sheet={sheet}
          onClose={() => setSheet(null)}
          onVote={handleVote}
          userPosition={userPosition}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  chipRow: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
  },
  statusPill: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 110,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.creamDeep,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sheetCategoryBadge: {
    fontSize: 11,
    color: Colors.sageDeep,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.charcoal,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.charcoalSoft,
  },
  sheetClose: {
    fontSize: 20,
    color: Colors.charcoalSoft,
    padding: 6,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sheetMetaItem: { minWidth: 120 },
  sheetMetaLabel: {
    fontSize: 10,
    color: Colors.charcoalSoft,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sheetMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
    marginTop: 2,
  },
  sheetBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.charcoal,
  },
  outlinedBtn: {
    width: 52,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
  },
  alertMetaRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.creamDeep,
  },
  alertDistance: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.crimsonDeep,
  },
  userDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(129, 178, 154, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sageDeep,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});
