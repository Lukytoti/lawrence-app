import React from 'react';
import BackupDashboardClient from '@/modules/resilience/components/BackupDashboardClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Backups & Storage Verification | Lawrence Operating System',
  description: 'Backup plans, storage verification, checksum integrity and retention governance.',
};

export default async function BackupsPage() {
  const [plans, executions] = await Promise.all([
    db.backupPlan.findMany({ orderBy: { createdAt: 'desc' } }),
    db.backupExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { backupPlan: true },
    }),
  ]);

  const safeExecutions = executions.map(e => ({
    ...e,
    sizeBytes: e.sizeBytes ? e.sizeBytes.toString() : null,
  }));

  return <BackupDashboardClient plans={plans} executions={safeExecutions} />;
}
