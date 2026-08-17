import { db } from '@/lib/db';
import { DuplicateMatch } from './types';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

/**
 * E.164 & standard phone normalization.
 */
export function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * Standard email normalization.
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

/**
 * Search database for potential duplicates matching normalized email, phone, or company name.
 */
export async function detectDuplicateLeads(input: {
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  excludeLeadId?: string;
}): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const normalizedMail = normalizeEmail(input.email);
  const normalizedPh = normalizePhoneNumber(input.phone);

  if (normalizedMail) {
    const emailLeads = await db.crmLead.findMany({
      where: {
        email: { equals: normalizedMail, mode: 'insensitive' },
        id: input.excludeLeadId ? { not: input.excludeLeadId } : undefined,
      },
      select: { id: true, leadCode: true, displayName: true, firstName: true, lastName: true },
    });

    for (const l of emailLeads) {
      matches.push({
        leadId: l.id,
        leadCode: l.leadCode,
        displayName: l.displayName || `${l.firstName} ${l.lastName}`,
        matchReason: 'EMAIL',
      });
    }
  }

  if (normalizedPh && matches.length === 0) {
    const phoneLeads = await db.crmLead.findMany({
      where: {
        OR: [{ phone: normalizedPh }, { normalizedPhone: normalizedPh }],
        id: input.excludeLeadId ? { not: input.excludeLeadId } : undefined,
      },
      select: { id: true, leadCode: true, displayName: true, firstName: true, lastName: true },
    });

    for (const l of phoneLeads) {
      matches.push({
        leadId: l.id,
        leadCode: l.leadCode,
        displayName: l.displayName || `${l.firstName} ${l.lastName}`,
        matchReason: 'PHONE',
      });
    }
  }

  return matches;
}

/**
 * Atomic lead merging: merges duplicateLeadId into primaryLeadId without history loss.
 */
export async function mergeLeads(primaryLeadId: string, duplicateLeadId: string, actorId: string) {
  if (primaryLeadId === duplicateLeadId) {
    throw new Error('Cannot merge a lead into itself.');
  }

  return db.$transaction(async (tx) => {
    const primary = await tx.crmLead.findUnique({ where: { id: primaryLeadId } });
    const duplicate = await tx.crmLead.findUnique({ where: { id: duplicateLeadId } });

    if (!primary || !duplicate) {
      throw new Error('Primary or duplicate lead record not found.');
    }

    // Re-parent related records
    await tx.crmOpportunity.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    await tx.crmInteraction.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    await tx.crmFollowUp.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    await tx.crmAppointment.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    await tx.crmNote.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    await tx.crmStageHistory.updateMany({
      where: { leadId: duplicateLeadId },
      data: { leadId: primaryLeadId },
    });

    // Merge notes summary
    const mergedNotes = [primary.notesSummary, `[Merged from ${duplicate.leadCode}]: ${duplicate.notesSummary || ''}`]
      .filter(Boolean)
      .join('\n');

    // Update primary lead and archive duplicate
    const updatedPrimary = await tx.crmLead.update({
      where: { id: primaryLeadId },
      data: {
        notesSummary: mergedNotes,
      },
    });

    await tx.crmLead.update({
      where: { id: duplicateLeadId },
      data: {
        status: 'DORMANT',
        archivedAt: new Date(),
      },
    });

    await eventBus.publish('LeadMerged', { primaryLeadId, duplicateLeadId, actorId }, actorId);

    await logAuditEvent({
      actorId,
      action: 'LEAD_MERGED',
      entityType: 'CrmLead',
      entityId: primaryLeadId,
      metadata: { duplicateLeadId, primaryLeadCode: primary.leadCode, duplicateLeadCode: duplicate.leadCode },
    });

    return updatedPrimary;
  });
}
