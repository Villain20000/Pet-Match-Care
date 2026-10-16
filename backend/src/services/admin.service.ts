import { PrismaClient, type AdoptionStatus } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const adminPetsService = {
  async listShelterPets(shelterId: string) {
    return prisma.petForAdoption.findMany({
      where: { shelterId },
      include: { medicalRecords: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createPet(shelterId: string, data: {
    name: string;
    species: 'DOG' | 'CAT' | 'OTHER';
    age: string;
    size: string;
    description: string;
    imageUrl: string;
    isUrgent?: boolean;
    isMicrochipped?: boolean;
    microchipNumber?: string;
    isVaccinated?: boolean;
    isSterilized?: boolean;
    healthNotes?: string;
  }) {
    return prisma.petForAdoption.create({
      data: {
        shelterId,
        name: data.name,
        species: data.species,
        age: data.age,
        size: data.size,
        description: data.description,
        imageUrl: data.imageUrl,
        isUrgent: data.isUrgent ?? false,
        isMicrochipped: data.isMicrochipped ?? false,
        microchipNumber: data.microchipNumber,
        isVaccinated: data.isVaccinated ?? false,
        isSterilized: data.isSterilized ?? false,
        healthNotes: data.healthNotes,
      },
    });
  },

  async updatePet(shelterId: string, petId: string, data: Partial<{
    name: string;
    species: 'DOG' | 'CAT' | 'OTHER';
    age: string;
    size: string;
    description: string;
    imageUrl: string;
    status: AdoptionStatus;
    isUrgent: boolean;
    isMicrochipped: boolean;
    microchipNumber: string;
    isVaccinated: boolean;
    isSterilized: boolean;
    healthNotes: string;
  }>) {
    const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
    if (!pet) throw new HttpError(404, 'NOT_FOUND');
    if (pet.shelterId !== shelterId) throw new HttpError(403, 'FORBIDDEN');

    return prisma.petForAdoption.update({
      where: { id: petId },
      data,
    });
  },

  async deletePet(shelterId: string, petId: string) {
    const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
    if (!pet) throw new HttpError(404, 'NOT_FOUND');
    if (pet.shelterId !== shelterId) throw new HttpError(403, 'FORBIDDEN');

    return prisma.petForAdoption.delete({ where: { id: petId } });
  },
};

export const adminReportsService = {
  async listMunicipalReports(assignedMunicipality: string) {
    return prisma.strayReport.findMany({
      where: { assignedMunicipality },
      include: { reporter: { select: { id: true, fullName: true, email: true } }, updates: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateReportStatus(authorId: string, reportId: string, status: 'IN_PROGRESS' | 'RESOLVED' | 'ASSIGNED', body: string, photoUrl?: string) {
    const report = await prisma.strayReport.findUnique({ where: { id: reportId } });
    if (!report) throw new HttpError(404, 'NOT_FOUND');

    await prisma.strayReport.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
    });

    return prisma.strayReportUpdate.create({
      data: {
        reportId,
        authorId,
        body,
        status,
        photoUrl,
      },
    });
  },
};
