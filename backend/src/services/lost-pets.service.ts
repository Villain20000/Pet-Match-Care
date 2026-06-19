import { prisma } from '@/config/prisma';
import { haversineKm } from './geo.service';
import { env } from '@/config/env';
import { sendPoisonAlertPush } from './fcm.service';
import { createNotification } from './notifications.service';

/**
 * Search for open LostPet rows within `radiusKm` of the given coordinates
 * and species. Returns ranked matches (closest first).
 */
export const findMatches = async (
  lat: number,
  lng: number,
  species: 'DOG' | 'CAT' | 'OTHER',
  description: string,
  radiusKm = env.LOST_PET_MATCH_RADIUS_KM,
) => {
  const candidates = await prisma.lostPet.findMany({
    where: { species, isFound: false },
    take: 200,
  });

  return candidates
    .map((p) => {
      const distanceKm = haversineKm(lat, lng, p.lastSeenLat, p.lastSeenLng);
      const score =
        (distanceKm <= 3 ? 1 : 0) +
        (description.toLowerCase().includes(p.name.toLowerCase()) ? 2 : 0) +
        (description.toLowerCase().includes((p.breed ?? '').toLowerCase()) ? 1 : 0);
      return { pet: p, distanceKm, score };
    })
    .filter((row) => row.distanceKm <= radiusKm)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
};

/**
 * Called after a StrayReport is created. Looks for likely matches and
 * pushes alerts to the original owners + notifies the reporter.
 */
export const notifyMatches = async (opts: {
  reportId: string;
  reporterId: string;
  species: 'DOG' | 'CAT' | 'OTHER';
  latitude: number;
  longitude: number;
  description: string;
}) => {
  const matches = await findMatches(opts.latitude, opts.longitude, opts.species, opts.description);
  for (const match of matches) {
    const owner = await prisma.user.findUnique({ where: { id: match.pet.ownerId } });
    if (!owner) continue;
    await createNotification({
      userId: owner.id,
      kind: 'LOST_PET_MATCH',
      title: `🐾 Πιθανή εμφάνιση: ${match.pet.name}`,
      body: `Βρέθηκε αναφορά ${match.distanceKm.toFixed(2)} χλμ μακριά. Έλεγξέ τη!`,
      data: { lostPetId: match.pet.id, reportId: opts.reportId },
    });
    if (owner.pushToken) {
      await sendPoisonAlertPush(owner.pushToken, {
        alertId: opts.reportId,
        latitude: opts.latitude,
        longitude: opts.longitude,
        addressHint: 'Πιθανή εμφάνιση χαμένου κατοικιδίου',
        description: `Ίσως είναι ο/η ${match.pet.name}`,
        distanceKm: match.distanceKm,
      });
    }
  }
  return matches.length;
};
