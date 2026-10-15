import { PrismaClient } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const medicalRecordsService = {
  async listForPet(petId: string) {
    return prisma.petMedicalRecord.findMany({
      where: { petId },
      orderBy: { performedAt: 'desc' },
    });
  },

  async addRecord(shelterId: string, petId: string, data: {
    recordType: string;
    title: string;
    description?: string;
    performedAt: string | Date;
    vetName?: string;
    nextDueDate?: string | Date;
  }) {
    const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
    if (!pet) throw new HttpError(404, 'NOT_FOUND');
    if (pet.shelterId !== shelterId) throw new HttpError(403, 'FORBIDDEN');

    return prisma.petMedicalRecord.create({
      data: {
        petId,
        recordType: data.recordType,
        title: data.title,
        description: data.description,
        performedAt: new Date(data.performedAt),
        vetName: data.vetName,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
      },
    });
  },

  async deleteRecord(shelterId: string, recordId: string) {
    const record = await prisma.petMedicalRecord.findUnique({
      where: { id: recordId },
      include: { pet: true },
    });
    if (!record) throw new HttpError(404, 'NOT_FOUND');
    if (record.pet.shelterId !== shelterId) throw new HttpError(403, 'FORBIDDEN');

    return prisma.petMedicalRecord.delete({ where: { id: recordId } });
  },
};
