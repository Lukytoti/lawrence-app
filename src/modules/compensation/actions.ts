'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  initiateCompensationRun,
  calculateCompensationRun,
  previewCompensationRun,
  approveCompensationRun,
  createCompensationAdjustment,
} from './service';
import { postCompensationRunToLedger } from './ledger-posting';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error('Unauthorized: Authentication session required.');
  }
  return session?.user as any;
}

export async function initiateRunAction(periodId: string, planVersionId: string, countryCode = 'NG') {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:calculate');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:calculate permission.');

  const run = await initiateCompensationRun(periodId, planVersionId, user.id, countryCode);
  revalidatePath('/finance/compensation');
  return { success: true, run };
}

export async function calculateRunAction(runId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:calculate');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:calculate permission.');

  const run = await calculateCompensationRun(runId);
  revalidatePath('/finance/compensation');
  return { success: true, run };
}

export async function previewRunAction(periodId: string, planVersionId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:calculate');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:calculate permission.');

  const preview = await previewCompensationRun(periodId, planVersionId);
  return { success: true, preview };
}

export async function approveRunAction(runId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:approve');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:approve permission.');

  const run = await approveCompensationRun(runId, user.id);
  revalidatePath('/finance/compensation');
  return { success: true, run };
}

export async function postRunAction(runId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:post');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:post permission.');

  const run = await postCompensationRunToLedger(runId, user.id);
  revalidatePath('/finance/compensation');
  revalidatePath('/finance/earnings');
  return { success: true, run };
}

export async function createAdjustmentAction(originalResultId: string, adjustedAmount: number, reason: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'finance:compensation:adjust');
  if (!allowed) throw new Error('Forbidden: Lacks finance:compensation:adjust permission.');

  const adjustment = await createCompensationAdjustment(originalResultId, adjustedAmount, reason, user.id);
  revalidatePath('/finance/compensation');
  revalidatePath('/finance/earnings');
  return { success: true, adjustment };
}
