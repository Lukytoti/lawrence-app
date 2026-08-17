'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  createLead,
  moveLeadStage,
  createOpportunity,
  createInteraction,
  scheduleFollowUp,
  completeFollowUp,
  scheduleAppointment,
  searchLeads,
} from './service';
import { convertLeadToNetworkMember, convertLeadToDigitalClient } from './conversion';
import { mergeLeads } from './duplicates';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error('Unauthorized: Authentication session required.');
  }
  return session?.user as any;
}

export async function createLeadAction(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source?: string;
  leadType?: any;
  notesSummary?: string;
  tags?: string[];
}) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:create');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM creation permissions (crm:create).');
  }

  const lead = await createLead({
    ...data,
    ownerId: user.id,
  });

  revalidatePath('/crm');
  return { success: true, lead };
}

export async function moveLeadStageAction(leadId: string, toStageId: string, notes?: string) {
  const user = await getAuthenticatedUser();

  const authorized = (await hasPermission(user.id, 'crm:update')) || (await hasPermission(user.id, 'crm:read_own'));
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM update permissions.');
  }

  const result = await moveLeadStage({
    leadId,
    toStageId,
    movedBy: user.id,
    notes,
  });

  revalidatePath('/crm');
  revalidatePath(`/crm/leads/${leadId}`);
  return { success: true, ...result };
}

export async function createOpportunityAction(data: {
  leadId: string;
  businessDomain?: string;
  title: string;
  value: number;
  currency?: string;
}) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:create');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM creation permissions.');
  }

  const opp = await createOpportunity({
    ...data,
    ownerId: user.id,
  });

  revalidatePath(`/crm/leads/${data.leadId}`);
  return { success: true, opportunity: opp };
}

export async function scheduleFollowUpAction(data: {
  leadId: string;
  opportunityId?: string;
  title: string;
  dueAt: Date;
  notes?: string;
}) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:manage_followups');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM follow-up permissions.');
  }

  const followUp = await scheduleFollowUp({
    ...data,
    assignedToId: user.id,
    createdBy: user.id,
  });

  revalidatePath('/my-day');
  revalidatePath(`/crm/leads/${data.leadId}`);
  return { success: true, followUp };
}

export async function completeFollowUpAction(followUpId: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:manage_followups');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM follow-up permissions.');
  }

  const fu = await completeFollowUp(followUpId, user.id);

  revalidatePath('/my-day');
  revalidatePath(`/crm/leads/${fu.leadId}`);
  return { success: true, followUp: fu };
}

export async function convertLeadToMemberAction(leadId: string, sponsorId?: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:convert');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM conversion permissions (crm:convert).');
  }

  const result = await convertLeadToNetworkMember({
    leadId,
    sponsorId,
    actorId: user.id,
  });

  revalidatePath('/crm');
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath('/network/members');
  return { success: true, ...result };
}

export async function convertLeadToClientAction(leadId: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:convert');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM conversion permissions (crm:convert).');
  }

  const result = await convertLeadToDigitalClient({
    leadId,
    actorId: user.id,
  });

  revalidatePath('/crm');
  revalidatePath(`/crm/leads/${leadId}`);
  return { success: true, ...result };
}

export async function mergeLeadsAction(primaryLeadId: string, duplicateLeadId: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'crm:update');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient CRM update permissions.');
  }

  const primary = await mergeLeads(primaryLeadId, duplicateLeadId, user.id);

  revalidatePath('/crm');
  revalidatePath(`/crm/leads/${primaryLeadId}`);
  return { success: true, primary };
}
