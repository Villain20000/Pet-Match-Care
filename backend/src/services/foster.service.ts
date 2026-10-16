import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fosterService = {
  async getProfile(userId: string) {
    return prisma.fosterProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, email: true, pushToken: true } } },
    });
  },

  async upsertProfile(userId: string, data: {
    city: string;
    isAvailable?: boolean;
    maxPets?: number;
    preferredSpecies?: 'DOG' | 'CAT' | 'OTHER';
    hasGarden?: boolean;
    hasOtherPets?: boolean;
    notes?: string;
  }) {
    return prisma.fosterProfile.upsert({
      where: { userId },
      create: {
        userId,
        city: data.city,
        isAvailable: data.isAvailable ?? true,
        maxPets: data.maxPets ?? 1,
        preferredSpecies: data.preferredSpecies ?? 'DOG',
        hasGarden: data.hasGarden ?? false,
        hasOtherPets: data.hasOtherPets ?? false,
        notes: data.notes,
      },
      update: {
        city: data.city,
        isAvailable: data.isAvailable,
        maxPets: data.maxPets,
        preferredSpecies: data.preferredSpecies,
        hasGarden: data.hasGarden,
        hasOtherPets: data.hasOtherPets,
        notes: data.notes,
      },
    });
  },

  async searchProfiles(filters: { city?: string; species?: 'DOG' | 'CAT' | 'OTHER' }) {
    return prisma.fosterProfile.findMany({
      where: {
        isAvailable: true,
        ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
        ...(filters.species ? { preferredSpecies: filters.species } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },
};
