import { haversineKm } from './geo.service';
import { env } from '@/config/env';

export interface Municipality {
  name: string;
  latitude: number;
  longitude: number;
}

interface RawMunicipality {
  name: string;
  latitude: number;
  longitude: number;
}

// Format: "Δήμος Χ|34.5|33.0;Δήμος Υ|41.0|28.5"
const parseMunicipalities = (raw: string): RawMunicipality[] =>
  raw
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, latStr, lngStr] = entry.split('|');
      if (!name || !latStr || !lngStr) {
        throw new Error(`Μη έγκυρη καταχώρηση δήμου: "${entry}"`);
      }
      return {
        name,
        latitude: Number(latStr),
        longitude: Number(lngStr),
      };
    });

const municipalities: RawMunicipality[] = parseMunicipalities(env.GREEK_MUNICIPALITIES);

/**
 * Returns the closest Greek municipality to the given coordinates.
 * Throws if the seed list is empty (misconfiguration safety net).
 */
export const findClosestMunicipality = (lat: number, lng: number): Municipality => {
  if (municipalities.length === 0) {
    throw new Error('Δεν έχουν οριστεί δήμοι στο GREEK_MUNICIPALITIES');
  }

  let best = municipalities[0]!;
  let bestDistance = haversineKm(lat, lng, best.latitude, best.longitude);

  for (let i = 1; i < municipalities.length; i++) {
    const candidate = municipalities[i]!;
    const distance = haversineKm(lat, lng, candidate.latitude, candidate.longitude);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return { name: best.name, latitude: best.latitude, longitude: best.longitude };
};

export const listMunicipalities = (): Municipality[] =>
  municipalities.map(({ name, latitude, longitude }) => ({ name, latitude, longitude }));
