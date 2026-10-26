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

/**
 * Builds PostGIS SQL fragment for ST_DWithin spatial queries.
 * Converts radius in km to meters for geography(Point, 4326).
 */
export const buildPostGISSpatialQuery = (
  lat: number,
  lng: number,
  radiusKm: number,
): { querySql: string; radiusMeters: number } => {
  const radiusMeters = radiusKm * 1000;
  return {
    querySql: `ST_DWithin(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )`,
    radiusMeters,
  };
};

/**
 * Fuzz GPS coordinates by a deterministic/pseudo-random offset (~150m to ~250m)
 * to protect citizen and animal location privacy for public feeds.
 */
export const fuzzCoordinates = (
  lat: number,
  lng: number,
  seedId: string = 'default',
): { latitude: number; longitude: number } => {
  // Simple hash from seedId to keep fuzzing deterministic for the same record
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash << 5) - hash + seedId.charCodeAt(i);
    hash |= 0;
  }
  const normalizedHash = Math.abs(hash) / 2147483647;

  // Offset radius between 150m (0.15km) and 250m (0.25km)
  const offsetKm = 0.15 + normalizedHash * 0.10;
  const angle = normalizedHash * 2 * Math.PI;

  const latOffset = (offsetKm / 111) * Math.cos(angle);
  const lngOffset =
    (offsetKm / (111 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)))) *
    Math.sin(angle);

  return {
    latitude: Number((lat + latOffset).toFixed(6)),
    longitude: Number((lng + lngOffset).toFixed(6)),
  };
};
