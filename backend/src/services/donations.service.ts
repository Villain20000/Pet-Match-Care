import { PrismaClient } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const donationsService = {
  async listCampaigns() {
    return prisma.donationCampaign.findMany({
      where: { isActive: true },
      include: {
        shelter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy: [{ isEmergency: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async createCampaign(shelterId: string, data: {
    title: string;
    description: string;
    targetAmount: number;
    neededItems?: string;
    isEmergency?: boolean;
  }) {
    return prisma.donationCampaign.create({
      data: {
        shelterId,
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        neededItems: data.neededItems,
        isEmergency: data.isEmergency ?? false,
      },
    });
  },

  async recordDonation(campaignId: string, amount: number) {
    const campaign = await prisma.donationCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new HttpError(404, 'NOT_FOUND');

    return prisma.donationCampaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: { increment: amount },
      },
    });
  },
};
