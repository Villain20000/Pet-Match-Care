import { prisma } from '@/config/prisma';
import { HttpError } from '@/middlewares/error';
import crypto from 'node:crypto';

export const generateDigitalSignature = (recordData: {
  petId: string;
  title: string;
  performedAt: Date;
  vetLicenseNumber?: string;
}): string => {
  const secret = process.env.JWT_SECRET || 'petmatch_medical_secret';
  const payload = `${recordData.petId}:${recordData.title}:${recordData.performedAt.toISOString()}:${recordData.vetLicenseNumber ?? ''}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const medicalRecordsService = {
  async listForPet(petId: string) {
    return prisma.petMedicalRecord.findMany({
      where: { petId },
      orderBy: { performedAt: 'desc' },
    });
  },

  async addRecord(actor: { userId: string; role: string }, petId: string, data: {
    recordType: string;
    title: string;
    description?: string;
    performedAt: string | Date;
    vetName?: string;
    vetLicenseNumber?: string;
    isPrescription?: boolean;
    nextDueDate?: string | Date;
  }) {
    const pet = await prisma.petForAdoption.findUnique({ where: { id: petId } });
    if (!pet) throw new HttpError(404, 'NOT_FOUND');
    const isShelterOwner = pet.shelterId === actor.userId;
    const isVet = actor.role === 'VET';
    if (!isShelterOwner && !isVet) throw new HttpError(403, 'FORBIDDEN');

    const performedAtDate = new Date(data.performedAt);
    const digitalSignature = data.vetLicenseNumber
      ? generateDigitalSignature({
          petId,
          title: data.title,
          performedAt: performedAtDate,
          vetLicenseNumber: data.vetLicenseNumber,
        })
      : null;

    return prisma.petMedicalRecord.create({
      data: {
        petId,
        recordType: data.recordType,
        title: data.title,
        description: data.description,
        performedAt: performedAtDate,
        vetName: data.vetName,
        vetLicenseNumber: data.vetLicenseNumber,
        isPrescription: Boolean(data.isPrescription),
        digitalSignature,
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
