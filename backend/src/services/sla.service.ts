import { prisma } from '@/config/prisma';
import { ReportCondition } from '@prisma/client';
import { createNotification } from '@/services/notifications.service';

/**
 * Returns the SLA deadline Date based on stray report condition severity.
 * - CRITICAL: 2 hours
 * - INJURED: 6 hours
 * - DECEASED: 12 hours
 * - STABLE / default: 24 hours
 */
export const calculateSlaTarget = (
  condition: ReportCondition,
  fromDate: Date = new Date(),
): Date => {
  const target = new Date(fromDate);
  switch (condition) {
    case 'CRITICAL':
      target.setHours(target.getHours() + 2);
      break;
    case 'INJURED':
      target.setHours(target.getHours() + 6);
      break;
    case 'DECEASED':
      target.setHours(target.getHours() + 12);
      break;
    case 'STABLE':
    default:
      target.setHours(target.getHours() + 24);
      break;
  }
  return target;
};

/**
 * Evaluates active stray report SLAs and updates status / sends notifications for breached SLAs.
 */
export const evaluateSlaStatuses = async () => {
  const now = new Date();

  // Find reports that are past their SLA target timestamp and still OPEN
  const overdueReports = await prisma.strayReport.findMany({
    where: {
      status: 'OPEN',
      slaTargetAt: { lt: now },
      slaStatus: { not: 'SLA_BREACHED' },
    },
    take: 100,
  });

  for (const report of overdueReports) {
    await prisma.strayReport.update({
      where: { id: report.id },
      data: { slaStatus: 'SLA_BREACHED' },
    });

    // Find municipal workers to escalate notification to
    const workers = await prisma.user.findMany({
      where: { role: 'MUNICIPAL_WORKER' },
      take: 10,
    });

    for (const worker of workers) {
      await createNotification({
        userId: worker.id,
        kind: 'STRAY_REPORT_UPDATE',
        title: '⚠️ Υπέρβαση Χρόνου Απόκρισης (SLA Breach)',
        body: `Η αναφορά ${report.id.substring(0, 8)} (${report.condition}) έχει υπερβεί το όριο απόκρισης!`,
        data: { reportId: report.id, condition: report.condition, slaStatus: 'SLA_BREACHED' },
      });
    }
  }

  return { checkedCount: overdueReports.length };
};
