'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  getMyDayWorkspace,
  submitActivityReport,
  submitEvidence,
  reviewEvidence,
} from './service';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error('Unauthorized: Authentication session required.');
  }
  return session?.user as any;
}

export async function fetchMyDayAction(targetDateStr?: string) {
  const user = await getAuthenticatedUser();
  const member = await db.networkMember.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    throw new Error('Network member record not found for authenticated user.');
  }

  const authorized = await hasPermission(user.id, 'tasks:read');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient productivity permissions.');
  }

  return getMyDayWorkspace(member.id, targetDateStr);
}

export async function submitReportAction(instanceId: string, completedValue: number, notes?: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'tasks:read');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient productivity permissions.');
  }

  const result = await submitActivityReport(instanceId, completedValue, notes, user.id);
  revalidatePath('/my-day');
  return { success: true, instance: result };
}

export async function submitEvidenceAction(
  activityInstanceId: string,
  storageKey: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  publicUrl?: string
) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'tasks:read');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient productivity permissions.');
  }

  const ev = await submitEvidence(
    activityInstanceId,
    storageKey,
    fileName,
    fileSize,
    mimeType,
    user.id,
    publicUrl
  );
  revalidatePath('/my-day');
  return { success: true, evidence: ev };
}

export async function reviewEvidenceAction(
  evidenceId: string,
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
  feedback?: string
) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'reports:manage');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient leader review permissions (reports:manage).');
  }

  const result = await reviewEvidence(evidenceId, user.id, status, feedback);
  revalidatePath('/my-day');
  return { success: true, review: result };
}
