import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';
import { calculateLeadScore } from './scoring';
import { detectDuplicateLeads, normalizePhoneNumber, normalizeEmail } from './duplicates';
import { LeadType, LeadStatus, OpportunityStatus, FollowUpStatus, AppointmentStatus } from './types';

/**
 * Generate unique lead code e.g. LEAD-10001
 */
export async function generateLeadCode(): Promise<string> {
  const count = await db.crmLead.count();
  return `LEAD-${10001 + count}`;
}

/**
 * Get or create default pipeline for a business domain.
 */
export async function getOrCreateDefaultPipeline(domain = 'NETWORK_MARKETING') {
  let pipeline = await db.crmPipeline.findFirst({
    where: { domain, isDefault: true },
    include: { stages: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!pipeline) {
    const pipelineName = domain === 'NETWORK_MARKETING' ? 'Network Marketing Pipeline' : 'Digital Marketing Pipeline';
    pipeline = await db.crmPipeline.create({
      data: {
        name: pipelineName,
        domain,
        isDefault: true,
        stages: {
          create: domain === 'NETWORK_MARKETING'
            ? [
                { name: 'New Prospect', code: 'NEW_PROSPECT', winProbability: 10, sortOrder: 0, colorHex: '#3B82F6' },
                { name: 'Contacted', code: 'CONTACTED', winProbability: 25, sortOrder: 1, colorHex: '#8B5CF6' },
                { name: 'Conversation Started', code: 'CONVERSATION_STARTED', winProbability: 40, sortOrder: 2, colorHex: '#EC4899' },
                { name: 'Presentation', code: 'PRESENTATION', winProbability: 60, sortOrder: 3, colorHex: '#F59E0B' },
                { name: 'Follow-Up', code: 'FOLLOW_UP', winProbability: 75, sortOrder: 4, colorHex: '#10B981' },
                { name: 'Joined', code: 'JOINED', winProbability: 100, sortOrder: 5, colorHex: '#059669' },
              ]
            : [
                { name: 'New Lead', code: 'NEW_LEAD', winProbability: 10, sortOrder: 0, colorHex: '#3B82F6' },
                { name: 'Contacted', code: 'CONTACTED', winProbability: 20, sortOrder: 1, colorHex: '#8B5CF6' },
                { name: 'Discovery Call', code: 'DISCOVERY_CALL', winProbability: 40, sortOrder: 2, colorHex: '#EC4899' },
                { name: 'Proposal Sent', code: 'PROPOSAL_SENT', winProbability: 70, sortOrder: 3, colorHex: '#F59E0B' },
                { name: 'Negotiation', code: 'NEGOTIATION', winProbability: 85, sortOrder: 4, colorHex: '#10B981' },
                { name: 'Won', code: 'WON', winProbability: 100, sortOrder: 5, colorHex: '#059669' },
              ],
        },
      },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  return pipeline;
}

/**
 * Create a new CrmLead with duplicate checking and scoring.
 */
export async function createLead(input: {
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  companyName?: string;
  jobTitle?: string;
  website?: string;
  source?: string;
  sourceDetail?: string;
  leadType?: LeadType;
  ownerId: string;
  notesSummary?: string;
  tags?: string[];
  skipDuplicateCheck?: boolean;
}) {
  if (!input.skipDuplicateCheck) {
    const duplicates = await detectDuplicateLeads({
      email: input.email,
      phone: input.phone,
      companyName: input.companyName,
    });

    if (duplicates.length > 0) {
      const match = duplicates[0];
      throw new Error(`Possible duplicate found: ${match.displayName} (${match.leadCode}) matched on ${match.matchReason}.`);
    }
  }

  const leadCode = await generateLeadCode();
  const normalizedPh = normalizePhoneNumber(input.phone);
  const normalizedMail = normalizeEmail(input.email);

  const initialScore = calculateLeadScore({
    email: input.email,
    phone: input.phone,
    source: input.source,
  });

  const lead = await db.crmLead.create({
    data: {
      leadCode,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: input.displayName || `${input.firstName} ${input.lastName}`,
      email: normalizedMail,
      phone: input.phone,
      normalizedPhone: normalizedPh,
      country: input.country || 'NG',
      city: input.city,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      website: input.website,
      source: input.source || 'MANUAL',
      sourceDetail: input.sourceDetail,
      leadType: input.leadType || 'NETWORK_PROSPECT',
      ownerId: input.ownerId,
      notesSummary: input.notesSummary,
      score: initialScore.score,
      temperature: initialScore.temperature,
      status: 'NEW',
    },
  });

  // Assign tags if provided
  if (input.tags && input.tags.length > 0) {
    for (const tagText of input.tags) {
      const tag = await db.crmTag.upsert({
        where: { name: tagText },
        update: {},
        create: { name: tagText },
      });

      await db.crmLeadTag.create({
        data: { leadId: lead.id, tagId: tag.id },
      });
    }
  }

  await eventBus.publish('LeadCreated', { leadId: lead.id, leadCode: lead.leadCode, ownerId: input.ownerId }, input.ownerId);

  await logAuditEvent({
    actorId: input.ownerId,
    action: 'LEAD_CREATED',
    entityType: 'CrmLead',
    entityId: lead.id,
    metadata: { leadCode, displayName: lead.displayName, leadType: lead.leadType },
  });

  return lead;
}

/**
 * Move lead pipeline stage and record auditable history.
 */
export async function moveLeadStage(input: {
  leadId: string;
  toStageId: string;
  movedBy: string;
  notes?: string;
}) {
  const toStage = await db.crmStage.findUnique({
    where: { id: input.toStageId },
  });

  if (!toStage) {
    throw new Error(`Target pipeline stage not found: ${input.toStageId}`);
  }

  const lead = await db.crmLead.findUnique({
    where: { id: input.leadId },
  });

  if (!lead) {
    throw new Error(`Lead not found: ${input.leadId}`);
  }

  const history = await db.crmStageHistory.create({
    data: {
      leadId: input.leadId,
      toStageId: input.toStageId,
      movedBy: input.movedBy,
      notes: input.notes,
    },
  });

  const updatedLead = await db.crmLead.update({
    where: { id: input.leadId },
    data: {
      status: toStage.code === 'JOINED' || toStage.code === 'WON' ? 'WON' : 'ENGAGED',
    },
  });

  await eventBus.publish('LeadStageChanged', { leadId: lead.id, stageId: input.toStageId, movedBy: input.movedBy }, input.movedBy);

  await logAuditEvent({
    actorId: input.movedBy,
    action: 'LEAD_STAGE_CHANGED',
    entityType: 'CrmLead',
    entityId: lead.id,
    metadata: { stageName: toStage.name, stageCode: toStage.code },
  });

  return { lead: updatedLead, history };
}

/**
 * Create commercial CrmOpportunity linked to a CrmLead.
 * Note: CrmOpportunity represents pipeline value only.mutations to financial balances execute through Prompt 05 financial ledger.
 */
export async function createOpportunity(input: {
  leadId: string;
  businessDomain?: string;
  title: string;
  value: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: Date;
  ownerId: string;
}) {
  const domain = input.businessDomain || 'NETWORK_MARKETING';
  const pipeline = await getOrCreateDefaultPipeline(domain);
  const firstStage = pipeline.stages[0];

  const opp = await db.crmOpportunity.create({
    data: {
      leadId: input.leadId,
      pipelineId: pipeline.id,
      stageId: firstStage.id,
      ownerId: input.ownerId,
      businessDomain: domain,
      title: input.title,
      value: input.value,
      currency: input.currency || 'NGN',
      probability: input.probability || firstStage.winProbability,
      expectedCloseDate: input.expectedCloseDate,
      status: 'OPEN',
    },
  });

  // Recalculate lead score
  await refreshLeadScore(input.leadId);

  await eventBus.publish('OpportunityCreated', { opportunityId: opp.id, leadId: input.leadId, value: input.value }, input.ownerId);

  await logAuditEvent({
    actorId: input.ownerId,
    action: 'OPPORTUNITY_CREATED',
    entityType: 'CrmOpportunity',
    entityId: opp.id,
    metadata: { title: opp.title, value: input.value, currency: opp.currency },
  });

  return opp;
}

/**
 * Create interaction log (outreach, call, social DM, email).
 */
export async function createInteraction(input: {
  leadId: string;
  type: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: string;
  summary: string;
  occurredAt?: Date;
  createdBy: string;
}) {
  const interaction = await db.crmInteraction.create({
    data: {
      leadId: input.leadId,
      type: input.type,
      direction: input.direction || 'OUTBOUND',
      status: input.status || 'COMPLETED',
      summary: input.summary,
      occurredAt: input.occurredAt || new Date(),
      createdBy: input.createdBy,
    },
  });

  await refreshLeadScore(input.leadId);

  return interaction;
}

/**
 * Schedule actionable CrmFollowUp.
 */
export async function scheduleFollowUp(input: {
  leadId: string;
  opportunityId?: string;
  assignedToId: string;
  title: string;
  notes?: string;
  dueAt: Date;
  createdBy: string;
}) {
  const followUp = await db.crmFollowUp.create({
    data: {
      leadId: input.leadId,
      opportunityId: input.opportunityId,
      assignedToId: input.assignedToId,
      title: input.title,
      notes: input.notes,
      dueAt: input.dueAt,
      status: 'PENDING',
      createdBy: input.createdBy,
    },
  });

  await eventBus.publish('FollowUpCreated', { followUpId: followUp.id, leadId: input.leadId, dueAt: input.dueAt }, input.createdBy);

  await logAuditEvent({
    actorId: input.createdBy,
    action: 'FOLLOWUP_CREATED',
    entityType: 'CrmFollowUp',
    entityId: followUp.id,
    metadata: { title: followUp.title, dueAt: input.dueAt },
  });

  return followUp;
}

/**
 * Complete follow-up.
 */
export async function completeFollowUp(followUpId: string, actorId: string) {
  const fu = await db.crmFollowUp.update({
    where: { id: followUpId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  await eventBus.publish('FollowUpCompleted', { followUpId, leadId: fu.leadId }, actorId);

  await logAuditEvent({
    actorId,
    action: 'FOLLOWUP_COMPLETED',
    entityType: 'CrmFollowUp',
    entityId: followUpId,
    metadata: { leadId: fu.leadId },
  });

  return fu;
}

/**
 * Schedule Appointment.
 */
export async function scheduleAppointment(input: {
  leadId: string;
  opportunityId?: string;
  ownerId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  meetingLink?: string;
  notes?: string;
}) {
  const appt = await db.crmAppointment.create({
    data: {
      leadId: input.leadId,
      opportunityId: input.opportunityId,
      ownerId: input.ownerId,
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      location: input.location,
      meetingLink: input.meetingLink,
      notes: input.notes,
      status: 'SCHEDULED',
    },
  });

  await refreshLeadScore(input.leadId);

  await eventBus.publish('AppointmentCreated', { appointmentId: appt.id, leadId: input.leadId, startAt: input.startAt }, input.ownerId);

  await logAuditEvent({
    actorId: input.ownerId,
    action: 'APPOINTMENT_CREATED',
    entityType: 'CrmAppointment',
    entityId: appt.id,
    metadata: { title: appt.title, startAt: input.startAt },
  });

  return appt;
}

/**
 * Recalculate and update score/temperature for a CrmLead.
 */
export async function refreshLeadScore(leadId: string) {
  const lead = await db.crmLead.findUnique({
    where: { id: leadId },
    include: {
      interactions: true,
      appointments: true,
      opportunities: true,
    },
  });

  if (!lead) return;

  const result = calculateLeadScore(lead);

  await db.crmLead.update({
    where: { id: leadId },
    data: {
      score: result.score,
      temperature: result.temperature,
    },
  });
}

/**
 * Fetch consolidated user-facing chronological lead timeline.
 */
export async function getLeadTimeline(leadId: string) {
  const lead = await db.crmLead.findUnique({
    where: { id: leadId },
    include: {
      interactions: { orderBy: { occurredAt: 'desc' } },
      followUps: { orderBy: { dueAt: 'desc' } },
      appointments: { orderBy: { startAt: 'desc' } },
      opportunities: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      stageHistories: { include: { toStage: true }, orderBy: { movedAt: 'desc' } },
    },
  });

  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  // Build unified timeline events
  const timeline: Array<{
    id: string;
    type: string;
    timestamp: Date;
    title: string;
    description?: string;
  }> = [];

  timeline.push({
    id: `created-${lead.id}`,
    type: 'LEAD_CREATED',
    timestamp: lead.createdAt,
    title: `Lead ${lead.leadCode} Created`,
    description: `Source: ${lead.source}`,
  });

  for (const s of lead.stageHistories) {
    timeline.push({
      id: s.id,
      type: 'STAGE_CHANGED',
      timestamp: s.movedAt,
      title: `Moved to stage: ${s.toStage.name}`,
      description: s.notes || undefined,
    });
  }

  for (const i of lead.interactions) {
    timeline.push({
      id: i.id,
      type: `INTERACTION_${i.type}`,
      timestamp: i.occurredAt,
      title: `${i.direction} ${i.type}`,
      description: i.summary,
    });
  }

  for (const f of lead.followUps) {
    timeline.push({
      id: f.id,
      type: 'FOLLOW_UP',
      timestamp: f.dueAt,
      title: `Follow Up: ${f.title}`,
      description: `Status: ${f.status}`,
    });
  }

  for (const a of lead.appointments) {
    timeline.push({
      id: a.id,
      type: 'APPOINTMENT',
      timestamp: a.startAt,
      title: `Appointment: ${a.title}`,
      description: a.location || a.meetingLink || undefined,
    });
  }

  timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return timeline;
}

/**
 * Indexed DB Search across CrmLead fields.
 */
export async function searchLeads(query: string, ownerId?: string) {
  const where: any = {
    OR: [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { displayName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { leadCode: { contains: query, mode: 'insensitive' } },
      { companyName: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (ownerId) {
    where.ownerId = ownerId;
  }

  return db.crmLead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 25,
  });
}
