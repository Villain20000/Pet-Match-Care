import { prisma } from '@/config/prisma';
import { ReportStatus, Role } from '@prisma/client';
import { HttpError } from '@/utils/http';

/**
 * Append an update to a stray report. Only MUNICIPAL_WORKER / SHELTER_ADMIN
 * can perform this, and only when they're progressing the status forward
 * (we reject REGRESSIONS except via a dedicated reopen action).
 */
const ALLOWED_ACTORS: Role[] = ['MUNICIPAL_WORKER', 'SHELTER_ADMIN'];
const ALLOWED_STATUSES: ReportStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'EXPIRED',
];

export const appendUpdate = async (args: {
  reportId: string;
  authorId: string;
  authorRole: Role;
  status: ReportStatus;
  body: string;
  photoUrl?: string;
}) => {
  if (!ALLOWED_ACTORS.includes(args.authorRole)) {
    throw new HttpError(403, 'BAD_GUARD_ROLE_TIMELINE');
  }
  if (!ALLOWED_STATUSES.includes(args.status)) {
    throw new HttpError(400, 'INVALID_STATUS');
  }

  return prisma.$transaction(async (tx) => {
    const report = await tx.strayReport.findUnique({ where: { id: args.reportId } });
    if (!report) throw new HttpError(404, 'STRAY_REPORT_NOT_FOUND');

    const update = await tx.strayReportUpdate.create({
      data: {
        reportId: args.reportId,
        authorId: args.authorId,
        status: args.status,
        body: args.body,
        photoUrl: args.photoUrl ?? null,
      },
    });

    await tx.strayReport.update({
      where: { id: args.reportId },
      data: {
        status: args.status,
        assignedAt: args.status === 'ASSIGNED' ? new Date() : report.assignedAt,
        resolvedAt: args.status === 'RESOLVED' ? new Date() : report.resolvedAt,
      },
    });

    return update;
  });
};

export const listUpdates = (reportId: string) =>
  prisma.strayReportUpdate.findMany({
    where: { reportId },
    orderBy: { createdAt: 'asc' },
  });
