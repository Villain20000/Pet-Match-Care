import { PrismaClient } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const ugcService = {
  async submitReport(reporterId: string, data: {
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
  }) {
    return prisma.contentReport.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details,
      },
    });
  },

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new HttpError(400, 'INVALID_INPUT');
    }

    return prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      create: {
        blockerId,
        blockedId,
      },
      update: {},
    });
  },

  async deleteUserAccount(userId: string) {
    // Clean up or anonymize dependent records before deleting user
    await prisma.strayReport.deleteMany({ where: { reporterId: userId } });
    await prisma.petForAdoption.deleteMany({ where: { shelterId: userId } });
    await prisma.adoptionApplication.deleteMany({ where: { applicantId: userId } });
    await prisma.lostPet.deleteMany({ where: { ownerId: userId } });
    await prisma.poisonAlert.deleteMany({ where: { reporterId: userId } });

    return prisma.user.delete({
      where: { id: userId },
    });
  },
};
