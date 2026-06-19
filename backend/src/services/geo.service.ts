/**
 * Haversine great-circle distance in kilometers between two WGS84 points.
 * Adequate for the radii we care about (<= 50 km).
 */
export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth radius (km)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Cheap bounding-box pre-filter so we don't haversine the whole table.
 * latitudeDelta / longitudeDelta are degrees; 1° lat ≈ 111 km.
 */
export const boundingBox = (
  lat: number,
  lng: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
};
