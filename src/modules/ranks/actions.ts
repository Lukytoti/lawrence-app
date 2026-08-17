'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  evaluateMemberQualification,
  getRankProgress,
  getRankHistory,
  getQualificationHistory,
  getActivePlanVersion,
} from './service';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthenticated');
  }
  return session.user as { id: string; name?: string; email?: string };
}

export async function evaluateQualificationAction(memberId: string, periodId: string, volumes: any) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:qualification:manage');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:qualification:manage');
  }

  const qual = await evaluateMemberQualification(memberId, periodId, volumes, actor.id);
  revalidatePath('/network/members');
  revalidatePath('/network/organization');
  return { success: true, qual };
}

export async function fetchMemberRankProgressAction(memberId: string, periodId?: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:ranks:read');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:ranks:read');
  }

  return getRankProgress(memberId, periodId);
}

export async function fetchMemberRankHistoryAction(memberId: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:ranks:read');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:ranks:read');
  }

  return getRankHistory(memberId);
}
