'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  createNetworkMember,
  moveMemberSponsor,
  exitMember,
  archiveMember,
  restoreMember,
  searchMembers,
  getDirectDownlines,
} from './service';
import { CreateMemberPayload, MoveMemberPayload, ExitMemberPayload } from './types';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthenticated');
  }
  return session.user as { id: string; name?: string; email?: string };
}

export async function createMemberAction(payload: CreateMemberPayload) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:create');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:create');
  }

  const member = await createNetworkMember(payload, actor.id);
  revalidatePath('/network/organization');
  revalidatePath('/network/members');
  return { success: true, member };
}

export async function moveMemberAction(payload: MoveMemberPayload) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:move');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:move');
  }

  const rel = await moveMemberSponsor(payload.memberId, payload.newSponsorId, payload.reason, actor.id);
  revalidatePath('/network/organization');
  revalidatePath('/network/members');
  return { success: true, rel };
}

export async function exitMemberAction(payload: ExitMemberPayload) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:archive');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:archive');
  }

  const member = await exitMember(payload.memberId, payload.exitReason, actor.id);
  revalidatePath('/network/organization');
  revalidatePath('/network/members');
  return { success: true, member };
}

export async function archiveMemberAction(memberId: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:archive');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:archive');
  }

  const member = await archiveMember(memberId, actor.id);
  revalidatePath('/network/organization');
  revalidatePath('/network/members');
  return { success: true, member };
}

export async function restoreMemberAction(memberId: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:restore');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:restore');
  }

  const member = await restoreMember(memberId, actor.id);
  revalidatePath('/network/organization');
  revalidatePath('/network/members');
  return { success: true, member };
}

export async function searchMembersAction(query: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:members:read');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:members:read');
  }

  return searchMembers(query, 20);
}

export async function fetchDownlinesAction(sponsorId: string) {
  const actor = await getAuthenticatedUser();
  const allowed = await hasPermission(actor.id, 'network:organization:read');
  if (!allowed) {
    throw new Error('Unauthorized: Missing permission network:organization:read');
  }

  return getDirectDownlines(sponsorId);
}
