import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { TrainingCategory, TrainingAssignmentPriority, TrainingAssignmentStatus } from './types';
import { getDownlineMemberIds } from '@/modules/org/service';

export interface CreateTrainingModuleInput {
  title: string;
  description: string;
  category?: TrainingCategory;
  content: string;
  resourceUrl?: string;
  durationMinutes?: number;
  createdById: string;
}

export async function createTrainingModule(input: CreateTrainingModuleInput) {
  if (!input.title || !input.content) {
    throw new Error('Title and content are required for training module.');
  }

  const module = await db.trainingModule.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category || 'GENERAL',
      content: input.content.trim(),
      resourceUrl: input.resourceUrl || null,
      durationMinutes: input.durationMinutes || 30,
      createdById: input.createdById,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: input.createdById,
      action: 'TRAINING_CREATED',
      entityType: 'TrainingModule',
      entityId: module.id,
    },
  });

  return module;
}

export interface AssignTrainingInput {
  trainingId: string;
  assignedById: string;
  assignedScopeType: 'INDIVIDUAL' | 'TEAM' | 'ORG' | 'ROLE' | 'RANK';
  assignedScopeValue: string; // memberId, teamRootMemberId, role code, or rank code
  dueAt?: Date;
  priority?: TrainingAssignmentPriority;
}

export async function assignTrainingModule(input: AssignTrainingInput) {
  const training = await db.trainingModule.findUnique({ where: { id: input.trainingId } });
  if (!training) throw new Error('Training module not found.');

  const targetMemberIds: string[] = [];

  if (input.assignedScopeType === 'INDIVIDUAL') {
    targetMemberIds.push(input.assignedScopeValue);
  } else if (input.assignedScopeType === 'TEAM') {
    // Materialize training assignment for the team root member AND all qualifying downline members
    const teamRootId = input.assignedScopeValue;
    targetMemberIds.push(teamRootId);
    const downlines = await getDownlineMemberIds(teamRootId);
    downlines.forEach((id) => {
      if (!targetMemberIds.includes(id)) targetMemberIds.push(id);
    });
  } else if (input.assignedScopeType === 'ORG') {
    const allMembers = await db.networkMember.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    allMembers.forEach((m) => targetMemberIds.push(m.id));
  } else {
    // Default fallback to individual member ID
    targetMemberIds.push(input.assignedScopeValue);
  }

  const createdAssignments = [];

  for (const memberId of targetMemberIds) {
    const member = await db.networkMember.findUnique({ where: { id: memberId } });
    if (!member) continue;

    // Use upsert to guarantee assignment idempotency
    const assignment = await db.trainingAssignment.upsert({
      where: {
        trainingId_assignedToMemberId: {
          trainingId: input.trainingId,
          assignedToMemberId: memberId,
        },
      },
      update: {
        assignedById: input.assignedById,
        dueAt: input.dueAt || null,
        priority: input.priority || 'MEDIUM',
        status: 'ASSIGNED',
      },
      create: {
        trainingId: input.trainingId,
        assignedToMemberId: memberId,
        assignedById: input.assignedById,
        assignedScopeType: input.assignedScopeType,
        assignedScopeValue: input.assignedScopeValue,
        dueAt: input.dueAt || null,
        priority: input.priority || 'MEDIUM',
        status: 'ASSIGNED',
      },
    });

    // Create single source of truth TrainingProgress linked exclusively via assignmentId
    await db.trainingProgress.upsert({
      where: { assignmentId: assignment.id },
      update: {},
      create: {
        assignmentId: assignment.id,
        status: 'NOT_STARTED',
        progressPercent: 0,
      },
    });

    await eventBus.publish('TrainingAssigned', {
      assignmentId: assignment.id,
      trainingId: input.trainingId,
      assignedToMemberId: memberId,
      assignedById: input.assignedById,
    }, input.assignedById);

    createdAssignments.push(assignment);
  }

  await db.auditLog.create({
    data: {
      actorId: input.assignedById,
      action: 'TRAINING_ASSIGNED',
      entityType: 'TrainingModule',
      entityId: input.trainingId,
      metadata: JSON.stringify({
        scopeType: input.assignedScopeType,
        scopeValue: input.assignedScopeValue,
        assignmentsCreated: createdAssignments.length,
      }),
    },
  });

  return createdAssignments;
}

export interface UpdateProgressInput {
  assignmentId: string;
  actorUserId: string;
  progressPercent: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  evidenceId?: string;
}

export async function updateTrainingProgress(input: UpdateProgressInput) {
  const assignment = await db.trainingAssignment.findUnique({
    where: { id: input.assignmentId },
    include: { progress: true, assignedToMember: true },
  });

  if (!assignment) throw new Error('Training assignment not found.');

  const isCompleted = input.progressPercent >= 100 || input.status === 'COMPLETED';
  const newStatus = isCompleted ? 'COMPLETED' : input.progressPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

  const updatedProgress = await db.trainingProgress.update({
    where: { assignmentId: input.assignmentId },
    data: {
      progressPercent: Math.min(100, Math.max(0, input.progressPercent)),
      status: newStatus,
      startedAt: assignment.progress?.startedAt || new Date(),
      completedAt: isCompleted ? new Date() : null,
      evidenceId: input.evidenceId || assignment.progress?.evidenceId || null,
    },
  });

  const updatedAssignment = await db.trainingAssignment.update({
    where: { id: input.assignmentId },
    data: { status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS' },
  });

  if (isCompleted) {
    await db.auditLog.create({
      data: {
        actorId: input.actorUserId,
        action: 'TRAINING_COMPLETED',
        entityType: 'TrainingAssignment',
        entityId: input.assignmentId,
      },
    });

    await eventBus.publish('TrainingCompleted', {
      assignmentId: input.assignmentId,
      trainingId: assignment.trainingId,
      memberId: assignment.assignedToMemberId,
    }, input.actorUserId);
  }

  return { assignment: updatedAssignment, progress: updatedProgress };
}

export async function reviewTrainingProgress(
  assignmentId: string,
  reviewerUserId: string,
  status: 'COMPLETED' | 'REVISION_REQUIRED',
  notes?: string
) {
  const assignment = await db.trainingAssignment.findUnique({
    where: { id: assignmentId },
    include: { progress: true },
  });

  if (!assignment) throw new Error('Assignment not found.');

  const updatedProgress = await db.trainingProgress.update({
    where: { assignmentId },
    data: {
      status,
      reviewedById: reviewerUserId,
      reviewerNotes: notes || null,
      reviewedAt: new Date(),
    },
  });

  const updatedAssignment = await db.trainingAssignment.update({
    where: { id: assignmentId },
    data: { status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS' },
  });

  await db.auditLog.create({
    data: {
      actorId: reviewerUserId,
      action: 'TRAINING_REVIEWED',
      entityType: 'TrainingAssignment',
      entityId: assignmentId,
      metadata: JSON.stringify({ status, notes }),
    },
  });

  return { assignment: updatedAssignment, progress: updatedProgress };
}

export async function getMemberTrainingAssignments(memberId: string) {
  const assignments = await db.trainingAssignment.findMany({
    where: { assignedToMemberId: memberId },
    include: {
      training: true,
      progress: { include: { evidence: true, reviewedBy: { select: { name: true } } } },
      assignedBy: { select: { name: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  // Automatically mark overdue if dueAt passed and status not COMPLETED
  const now = new Date();
  for (const a of assignments) {
    if (a.dueAt && a.dueAt < now && a.status !== 'COMPLETED' && a.status !== 'OVERDUE') {
      await db.trainingAssignment.update({
        where: { id: a.id },
        data: { status: 'OVERDUE' },
      });
      a.status = 'OVERDUE';
    }
  }

  return assignments;
}
