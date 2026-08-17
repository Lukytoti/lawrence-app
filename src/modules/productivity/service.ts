import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { logAuditEvent } from '@/lib/audit';
import { calculateDailyProductivityScore } from './rules';
import { DailyMyDayPayload, DailyActivityItemPayload, GoalSummary } from './types';

/**
 * Helper to get local date string YYYY-MM-DD in member's timezone.
 */
export function getLocalDateString(date = new Date(), timeZone = 'Africa/Lagos'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch (err) {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Lazily get or create date-stamped activity instances for a member for target date.
 */
export async function getOrCreateDailyInstances(memberId: string, targetDateStr: string) {
  const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);
  const targetDateEnd = new Date(`${targetDateStr}T23:59:59.999Z`);

  // Fetch active templates for member
  const templates = await db.activityTemplate.findMany({
    where: {
      memberId,
      effectiveFrom: { lte: targetDateEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: targetDate } }],
    },
    include: { activityType: true },
  });

  const instances: any[] = [];

  for (const t of templates) {
    const inst = await db.activityInstance.upsert({
      where: {
        templateId_targetDate: {
          templateId: t.id,
          targetDate,
        },
      },
      update: {},
      create: {
        templateId: t.id,
        memberId,
        targetDate,
        targetValue: t.targetValue,
        completedValue: 0,
        status: 'PENDING',
      },
      include: {
        template: { include: { activityType: true } },
        evidenceItems: { include: { reviews: true } },
      },
    });
    instances.push(inst);
  }

  return instances;
}

/**
 * Calculate member active daily streak count.
 */
export async function calculateStreakCount(memberId: string): Promise<number> {
  const scores = await db.productivityScore.findMany({
    where: { memberId, periodType: 'DAILY' },
    orderBy: { startDate: 'desc' },
    take: 30,
  });

  let streak = 0;
  for (const s of scores) {
    if (Number(s.overallScore) >= 70) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get full /my-day workspace payload for member.
 */
export async function getMyDayWorkspace(memberId: string, targetDateStr?: string): Promise<DailyMyDayPayload> {
  const member = await db.networkMember.findUnique({
    where: { id: memberId },
    include: { user: { include: { profile: true } } },
  });

  if (!member) {
    throw new Error(`Member not found: ${memberId}`);
  }

  const timeZone = member.user.profile?.timeZone || 'Africa/Lagos';
  const dateStr = targetDateStr || getLocalDateString(new Date(), timeZone);

  // Lazily ensure instances exist
  const rawInstances = await getOrCreateDailyInstances(memberId, dateStr);

  const activities: DailyActivityItemPayload[] = rawInstances.map((inst) => ({
    instanceId: inst.id,
    templateId: inst.templateId,
    activityTypeCode: inst.template.activityType.code,
    activityTypeName: inst.template.activityType.name,
    category: inst.template.activityType.category as any,
    measurementUnit: inst.template.activityType.measurementUnit as any,
    targetValue: Number(inst.targetValue),
    completedValue: Number(inst.completedValue),
    status: inst.status as any,
    requiresEvidence: inst.template.requiresEvidence || inst.template.activityType.requiresEvidence,
    evidenceItems: inst.evidenceItems.map((e: any) => ({
      id: e.id,
      fileName: e.fileName,
      storageKey: e.storageKey,
      publicUrl: e.publicUrl,
      status: e.status as any,
    })),
    submittedAt: inst.submittedAt,
    notes: inst.notes,
  }));

  // Fetch Goals for member
  const rawGoals = await db.goal.findMany({
    where: { memberId },
    orderBy: { targetDate: 'asc' },
  });

  const goals: GoalSummary[] = rawGoals.map((g) => {
    const target = Number(g.targetValue);
    const current = Number(g.currentValue);
    const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return {
      id: g.id,
      memberId: g.memberId,
      parentGoalId: g.parentGoalId,
      title: g.title,
      description: g.description,
      timeframe: g.timeframe as any,
      category: g.category as any,
      targetValue: target,
      currentValue: current,
      unit: g.unit,
      startDate: g.startDate,
      targetDate: g.targetDate,
      status: g.status as any,
      privacyLevel: g.privacyLevel as any,
      progressPercent,
    };
  });

  // Fetch Tasks for member
  const rawTasks = await db.task.findMany({
    where: { assigneeId: memberId, status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 10,
  });

  const tasks = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority as any,
    status: t.status as any,
    dueDate: t.dueDate,
  }));

  // Calculate Scores
  const scoreResult = calculateDailyProductivityScore(activities);
  const streakCount = await calculateStreakCount(memberId);

  // Save/Upsert ProductivityScore
  const targetDateObj = new Date(`${dateStr}T00:00:00.000Z`);
  await db.productivityScore.upsert({
    where: {
      memberId_periodType_startDate: {
        memberId,
        periodType: 'DAILY',
        startDate: targetDateObj,
      },
    },
    update: {
      activityScore: scoreResult.activityScore,
      goalScore: scoreResult.goalScore,
      taskScore: scoreResult.taskScore,
      evidenceScore: scoreResult.evidenceScore,
      overallScore: scoreResult.overallScore,
      currentStreak: streakCount,
      calculatedAt: new Date(),
    },
    create: {
      memberId,
      periodType: 'DAILY',
      startDate: targetDateObj,
      endDate: targetDateObj,
      activityScore: scoreResult.activityScore,
      goalScore: scoreResult.goalScore,
      taskScore: scoreResult.taskScore,
      evidenceScore: scoreResult.evidenceScore,
      overallScore: scoreResult.overallScore,
      currentStreak: streakCount,
      calculatedAt: new Date(),
    },
  });

  const attentionItems: string[] = [];
  const missedCount = activities.filter((a) => a.status === 'PENDING' && a.completedValue < a.targetValue).length;
  if (missedCount > 0) {
    attentionItems.push(`⚠ ${missedCount} activity items pending daily completion`);
  }
  const pendingEvidence = activities.filter((a) => a.requiresEvidence && a.evidenceItems.length === 0 && a.completedValue > 0).length;
  if (pendingEvidence > 0) {
    attentionItems.push(`📷 ${pendingEvidence} completed activities require screenshot proof`);
  }

  return {
    memberId,
    dateStr,
    timeZone,
    dailyScore: scoreResult.overallScore,
    streakCount,
    activities,
    goals,
    tasks,
    attentionItems,
  };
}

/**
 * Submit report for an activity instance.
 */
export async function submitActivityReport(
  instanceId: string,
  completedValue: number,
  notes?: string,
  actorId?: string
) {
  const inst = await db.activityInstance.findUnique({
    where: { id: instanceId },
    include: { template: true },
  });

  if (!inst) {
    throw new Error(`Activity instance not found: ${instanceId}`);
  }

  const isCompleted = completedValue >= Number(inst.targetValue);
  const updated = await db.activityInstance.update({
    where: { id: instanceId },
    data: {
      completedValue,
      status: isCompleted ? 'VERIFIED' : 'REPORTED',
      submittedAt: new Date(),
      notes,
    },
  });

  await eventBus.publish('ActivityReported', { instanceId, memberId: inst.memberId, completedValue }, actorId);

  await logAuditEvent({
    actorId,
    action: 'REPORT_SUBMITTED',
    entityType: 'ActivityInstance',
    entityId: instanceId,
    metadata: { memberId: inst.memberId, completedValue, targetValue: Number(inst.targetValue) },
  });

  return updated;
}

/**
 * Submit proof evidence for an activity instance (Storage abstraction reference).
 */
export async function submitEvidence(
  activityInstanceId: string,
  storageKey: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  uploadedBy: string,
  publicUrl?: string
) {
  const ev = await db.evidence.create({
    data: {
      activityInstanceId,
      storageKey,
      fileName,
      fileSize,
      mimeType,
      publicUrl,
      uploadedBy,
      status: 'PENDING',
    },
  });

  await eventBus.publish('EvidenceSubmitted', { evidenceId: ev.id, activityInstanceId }, uploadedBy);

  await logAuditEvent({
    actorId: uploadedBy,
    action: 'EVIDENCE_SUBMITTED',
    entityType: 'Evidence',
    entityId: ev.id,
    metadata: { activityInstanceId, storageKey, fileName },
  });

  return ev;
}

/**
 * Audit review by leader/admin on submitted proof evidence.
 */
export async function reviewEvidence(
  evidenceId: string,
  reviewerId: string,
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
  feedback?: string
) {
  const ev = await db.evidence.update({
    where: { id: evidenceId },
    data: { status },
  });

  const review = await db.evidenceReview.create({
    data: {
      evidenceId,
      reviewerId,
      status,
      feedback,
    },
  });

  await eventBus.publish('EvidenceReviewed', { evidenceId, reviewerId, status }, reviewerId);

  await logAuditEvent({
    actorId: reviewerId,
    action: 'EVIDENCE_REVIEWED',
    entityType: 'Evidence',
    entityId: evidenceId,
    metadata: { status, feedback },
  });

  return { evidence: ev, review };
}
