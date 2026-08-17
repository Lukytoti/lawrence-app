import { db } from '@/lib/db';

export async function verifyAuditIntegrity(): Promise<{
  totalAuditLogs: number;
  totalSecurityEvents: number;
  unlinkedSecurityEventsCount: number;
  isIntegrityHealthy: boolean;
}> {
  const totalAuditLogs = await db.auditLog.count();
  const totalSecurityEvents = await db.platformSecurityEvent.count();

  const unlinkedSecurityEventsCount = await db.platformSecurityEvent.count({
    where: { correlationId: null },
  });

  return {
    totalAuditLogs,
    totalSecurityEvents,
    unlinkedSecurityEventsCount,
    isIntegrityHealthy: unlinkedSecurityEventsCount === 0,
  };
}
