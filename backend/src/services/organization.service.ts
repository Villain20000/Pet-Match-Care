import { prisma } from '@/config/prisma';
import { OrgRole, OrgType } from '@prisma/client';

export const createOrganization = async (userId: string, data: {
  name: string;
  type?: OrgType;
  city?: string;
  vatNumber?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        type: data.type ?? 'NGO',
        city: data.city,
        vatNumber: data.vatNumber,
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId,
        role: OrgRole.OWNER,
      },
    });

    return org;
  });
};

export const getUserOrganizations = async (userId: string) => {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  });
};
