import { prisma } from '@/config/prisma';
import { RescueDispatchStatus } from '@prisma/client';
import { HttpError } from '@/middlewares/error';
import { createNotification } from '@/services/notifications.service';

export const assignOrUpdateDispatch = async ({
  reportId,
  actorId,
  actorRole,
  rescuerId,
  status,
  notes,
}: {
  reportId: string;
  actorId: string;
  actorRole: string;
  rescuerId?: string;
  status: RescueDispatchStatus;
  notes?: string;
}) => {
  const report = await prisma.strayReport.findUnique({
    where: { id: reportId },
    include: { dispatch: true },
  });

  if (!report) {
    throw new HttpError(404, 'STRAY_REPORT_NOT_FOUND');
  }

  // Permissions: MUNICIPAL_WORKER, PLATFORM_ADMIN or assigned rescuer (VOLUNTEER)
  const isWorkerOrAdmin =
    actorRole === 'MUNICIPAL_WORKER' ||
    actorRole === 'PLATFORM_ADMIN' ||
    actorRole === 'SHELTER_ADMIN';
  const isAssignedRescuer = report.dispatch?.rescuerId === actorId;

  if (!isWorkerOrAdmin && !isAssignedRescuer) {
    throw new HttpError(403, 'FORBIDDEN');
  }

  const existingDispatch = report.dispatch;
  const fromStatus = existingDispatch?.status ?? RescueDispatchStatus.UNASSIGNED;

  const dispatch = await prisma.$transaction(async (tx) => {
    const updated = await tx.rescueDispatch.upsert({
      where: { reportId },
      create: {
        reportId,
        rescuerId: rescuerId ?? (actorRole === 'VOLUNTEER' ? actorId : null),
        status,
        notes,
        dispatchedAt: status === 'DISPATCHED' ? new Date() : null,
        arrivedAt: status === 'ON_SCENE' ? new Date() : null,
        completedAt: status === 'RESOLVED' || status === 'TRANSPORTED_TO_VET' ? new Date() : null,
      },
      update: {
        ...(rescuerId ? { rescuerId } : {}),
        status,
        notes: notes ?? existingDispatch?.notes,
        dispatchedAt: status === 'DISPATCHED' ? new Date() : existingDispatch?.dispatchedAt,
        arrivedAt: status === 'ON_SCENE' ? new Date() : existingDispatch?.arrivedAt,
        completedAt:
          status === 'RESOLVED' || status === 'TRANSPORTED_TO_VET'
            ? new Date()
            : existingDispatch?.completedAt,
      },
    });

    await tx.rescueDispatchLog.create({
      data: {
        dispatchId: updated.id,
        actorId,
        fromStatus,
        toStatus: status,
        note: notes ?? null,
      },
    });

    // Also sync StrayReport status if resolved
    if (status === 'RESOLVED') {
      await tx.strayReport.update({
        where: { id: reportId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    } else if (status === 'DISPATCHED' || status === 'EN_ROUTE' || status === 'ON_SCENE') {
      await tx.strayReport.update({
        where: { id: reportId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return updated;
  });

  // Notify original reporter about dispatch status update
  if (report.reporterId !== actorId) {
    await createNotification({
      userId: report.reporterId,
      kind: 'STRAY_REPORT_UPDATE',
      title: 'Ενημέρωση Αποστολής Διάσωσης',
      body: `Η κατάσταση της αποστολής άλλαξε σε: ${status}`,
      data: { reportId, dispatchId: dispatch.id, status },
    });
  }

  return dispatch;
};

export const getDispatchByReportId = async (reportId: string) => {
  return prisma.rescueDispatch.findUnique({
    where: { reportId },
    include: {
      rescuer: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      logs: { orderBy: { createdAt: 'desc' } },
    },
  });
};
