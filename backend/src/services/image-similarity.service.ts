import { prisma } from '@/config/prisma';
import { boundingBox, haversineKm } from '@/services/geo.service';

/**
 * Compute a simple hash fingerprint for an image URL string for lightweight similarity checks.
 */
export const computeImageFingerprint = (imageUrl: string): string => {
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = (hash << 5) - hash + imageUrl.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateReportId?: string;
  similarityScore?: number; // 0 to 1
}

/**
 * Checks for existing active stray reports within 100 meters (0.1 km)
 * that share description keywords or identical image fingerprint.
 */
export const checkForDuplicateStrayReport = async ({
  imageUrl,
  latitude,
  longitude,
  description,
}: {
  imageUrl: string;
  latitude: number;
  longitude: number;
  description?: string;
}): Promise<DuplicateCheckResult> => {
  // Search within 100 meters (0.1 km) radius
  const radiusKm = 0.1;
  const box = boundingBox(latitude, longitude, radiusKm);

  const nearbyActiveReports = await prisma.strayReport.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
  });

  const targetFingerprint = computeImageFingerprint(imageUrl);

  for (const report of nearbyActiveReports) {
    const dist = haversineKm(latitude, longitude, report.latitude, report.longitude);
    if (dist <= radiusKm) {
      const existingFingerprint = computeImageFingerprint(report.imageUrl);
      if (existingFingerprint === targetFingerprint || report.imageUrl === imageUrl) {
        return {
          isDuplicate: true,
          duplicateReportId: report.id,
          similarityScore: 0.95,
        };
      }

      if (
        description &&
        report.description &&
        description.toLowerCase().trim() === report.description.toLowerCase().trim()
      ) {
        return {
          isDuplicate: true,
          duplicateReportId: report.id,
          similarityScore: 0.85,
        };
      }
    }
  }

  return { isDuplicate: false };
};
