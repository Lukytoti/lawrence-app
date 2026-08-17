import React from 'react';
import BackupDetailClient from '@/modules/resilience/components/BackupDetailClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Backup Details | Lawrence Operating System',
  description: 'Inspect backup execution, storage verification and checksum details.',
};

export default async function BackupDetailPage({ params }: { params: Promise<{ backupId: string }> }) {
  const { backupId } = await params;
  const execution = await db.backupExecution.findUnique({
    where: { id: backupId },
    include: { backupPlan: true },
  });

  const safeExecution = execution
    ? { ...execution, sizeBytes: execution.sizeBytes ? execution.sizeBytes.toString() : null }
    : null;

  return <BackupDetailClient execution={safeExecution} />;
}
