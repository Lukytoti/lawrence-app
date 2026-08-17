import React from 'react';
import ResilienceAuditClient from '@/modules/resilience/components/ResilienceAuditClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Resilience Audit Trail | Lawrence Operating System',
  description: 'Immutable audit log of all resilience, backup and recovery operations.',
};

export default async function AuditPage() {
  const logs = await db.recoveryAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return <ResilienceAuditClient logs={logs} />;
}
