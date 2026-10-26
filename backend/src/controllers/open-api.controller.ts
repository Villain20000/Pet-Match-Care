import { Request, Response } from 'express';
import { prisma } from '@/config/prisma';

export const openApiPetsHandler = async (_req: Request, res: Response) => {
  const pets = await prisma.petForAdoption.findMany({
    where: { status: 'AVAILABLE', isQuarantined: false },
    select: {
      id: true,
      name: true,
      species: true,
      age: true,
      size: true,
      description: true,
      imageUrl: true,
      isVaccinated: true,
      isSterilized: true,
      createdAt: true,
    },
    take: 100,
  });

  return res.json({
    apiVersion: 'v1',
    count: pets.length,
    data: pets,
  });
};

export const openApiStatsHandler = async (_req: Request, res: Response) => {
  const [totalStrayReports, totalAdoptablePets, totalSpots] = await Promise.all([
    prisma.strayReport.count(),
    prisma.petForAdoption.count({ where: { status: 'AVAILABLE' } }),
    prisma.petFriendlySpot.count({ where: { isVerified: true } }),
  ]);

  return res.json({
    apiVersion: 'v1',
    stats: {
      totalStrayReports,
      totalAdoptablePets,
      totalVerifiedPetSpots: totalSpots,
    },
  });
};
