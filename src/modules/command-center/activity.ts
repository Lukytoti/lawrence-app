import { db } from '@/lib/db';
import { ActivityTimelineItem } from './types';

export async function getUniversalActivityTimeline(
  actorUserId: string,
  limit: number = 25
): Promise<ActivityTimelineItem[]> {
  const auditLogs = await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return auditLogs.map((log) => {
    let route = '/admin/audit';
    if (log.entityType === 'CrmLead') route = `/crm/leads/${log.entityId}`;
    if (log.entityType === 'DigitalProject') route = `/projects/${log.entityId}`;
    if (log.entityType === 'Invoice') route = `/billing/invoices/${log.entityId}`;
    if (log.entityType === 'RetentionCase') route = `/retention/cases`;

    return {
      id: log.id,
      timestamp: log.createdAt,
      actorId: log.actorId || undefined,
      actorName: log.actor?.name || log.actor?.email || 'System',
      event: log.action,
      domain: log.entityType.toUpperCase(),
      entityType: log.entityType,
      entityId: log.entityId || '',
      status: 'SUCCESS',
      route,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
    };
  });
}
