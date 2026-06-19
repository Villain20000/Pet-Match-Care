import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface ResolvedLocation extends Coords {
  addressHint?: string;
  accuracyMeters?: number;
}

const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<string | undefined> => {
  try {
    const [first] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!first) return undefined;
    const parts = [
      first.streetNumber,
      first.street,
      first.city ?? first.region ?? first.subregion,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : first.name ?? undefined;
  } catch {
    return undefined;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async (): Promise<ResolvedLocation> => {
  const ok = await requestLocationPermission();
  if (!ok) throw new Error('Η πρόσβαση στην τοποθεσία δεν επιτράπηκε');

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = position.coords;
  const addressHint = await reverseGeocode(latitude, longitude);

  return {
    latitude,
    longitude,
    addressHint,
    accuracyMeters: position.coords.accuracy ?? undefined,
  };
};

/** After poisoning your last-shown coords, lets the live arrow update. */
export const watchLocation = (
  onUpdate: (loc: ResolvedLocation) => void,
): (() => void) => {
  let cancelled = false;
  let sub: Location.LocationSubscription | null = null;

  (async () => {
    const ok = await requestLocationPermission();
    if (!ok || cancelled) return;
    sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
      async (p) => {
        const addressHint = await reverseGeocode(p.coords.latitude, p.coords.longitude);
        onUpdate({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          addressHint,
          accuracyMeters: p.coords.accuracy ?? undefined,
        });
      },
    );
  })();

  return () => {
    cancelled = true;
    sub?.remove();
  };
};

/** Used by the Map / Report screen for instant client-side filtering. */
export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
