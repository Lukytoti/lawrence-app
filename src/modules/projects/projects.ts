import { db } from '@/lib/db';
import {
  ProjectStatus,
  ProjectHealthPayload,
  ProjectProgressPayload,
  CreateProjectInput,
} from './types';
import { logAuditEvent } from '@/lib/audit';

const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['PLANNED', 'CANCELLED'],
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['CLIENT_REVIEW', 'REVISION_REQUIRED', 'COMPLETED', 'CANCELLED'],
  CLIENT_REVIEW: ['ACTIVE', 'REVISION_REQUIRED', 'COMPLETED', 'CANCELLED'],
  REVISION_REQUIRED: ['ACTIVE', 'CLIENT_REVIEW', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: [],
};

export async function createProject(input: CreateProjectInput, actorUserId: string) {
  const count = await db.digitalProject.count();
  const year = new Date().getFullYear();
  const ts = Date.now().toString().slice(-4);
  const projectCode = `PRJ-${year}-${10001 + count}-${ts}`;

  const project = await db.digitalProject.create({
    data: {
      projectCode,
      clientId: input.clientId,
      crmOpportunityId: input.crmOpportunityId,
      serviceId: input.serviceId,
      ownerId: input.ownerId,
      projectManagerId: input.projectManagerId || input.ownerId,
      title: input.title,
      description: input.description,
      status: 'DRAFT',
      priority: input.priority || 'MEDIUM',
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      targetEndDate: input.targetEndDate ? new Date(input.targetEndDate) : undefined,
      currency: input.currency || 'NGN',
      contractValue: input.contractValue || 0,
    },
    include: { client: true, service: true },
  });

  await db.projectActivity.create({
    data: {
      projectId: project.id,
      actorId: actorUserId,
      activityType: 'PROJECT_CREATED',
      visibility: 'INTERNAL',
      description: `Project ${project.projectCode} created: ${project.title}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PROJECT_CREATED',
    entityType: 'DigitalProject',
    entityId: project.id,
    metadata: { projectCode: project.projectCode, title: project.title },
  });

  return project;
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus,
  actorUserId: string
) {
  const project = await db.digitalProject.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project ${projectId} not found.`);

  const currentStatus = project.status as ProjectStatus;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid project status transition from ${currentStatus} to ${newStatus}. Allowed transitions: [${allowed.join(
        ', '
      )}]`
    );
  }

  const completedAt = newStatus === 'COMPLETED' ? new Date() : undefined;

  const updatedProject = await db.digitalProject.update({
    where: { id: projectId },
    data: {
      status: newStatus,
      completedAt: completedAt || project.completedAt,
    },
  });

  await db.projectActivity.create({
    data: {
      projectId,
      actorId: actorUserId,
      activityType: 'STATUS_CHANGED',
      visibility: 'CLIENT_VISIBLE',
      description: `Project status updated from ${currentStatus} to ${newStatus}`,
      metadataJson: JSON.stringify({ from: currentStatus, to: newStatus }),
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PROJECT_STATUS_CHANGED',
    entityType: 'DigitalProject',
    entityId: projectId,
    metadata: { from: currentStatus, to: newStatus },
  });

  return updatedProject;
}

export async function getProjectById(projectId: string) {
  const project = await db.digitalProject.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      service: true,
      owner: { include: { profile: true } },
      projectManager: { include: { profile: true } },
      milestones: { orderBy: { sequence: 'asc' }, include: { tasks: true, deliverables: true } },
      tasks: { orderBy: { createdAt: 'desc' }, include: { assignedTo: { include: { profile: true } } } },
      deliverables: { orderBy: { createdAt: 'desc' }, include: { evidence: true, reviews: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  if (!project) return null;

  const health = calculateProjectHealth(project);
  const progress = calculateProjectProgress(project);

  return {
    ...project,
    health,
    progress,
  };
}

export async function getProjects(options?: {
  clientId?: string;
  ownerId?: string;
  status?: string;
  scopeMemberIds?: string[];
}) {
  const where: any = {};
  if (options?.clientId) where.clientId = options.clientId;
  if (options?.ownerId) where.ownerId = options.ownerId;
  if (options?.status) where.status = options.status;
  if (options?.scopeMemberIds) where.ownerId = { in: options.scopeMemberIds };

  const projects = await db.digitalProject.findMany({
    where,
    include: {
      client: true,
      service: true,
      owner: { include: { profile: true } },
      milestones: true,
      tasks: true,
      deliverables: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return projects.map((p) => ({
    ...p,
    health: calculateProjectHealth(p),
    progress: calculateProjectProgress(p),
  }));
}

export function calculateProjectHealth(project: any): ProjectHealthPayload {
  const riskFactors: string[] = [];
  const now = new Date();

  if (project.status === 'COMPLETED') {
    return { health: 'COMPLETED', riskFactors: [], calculatedAt: now.toISOString() };
  }

  if (project.status === 'CANCELLED' || project.status === 'ARCHIVED') {
    return { health: 'BLOCKED', riskFactors: ['Project is inactive or cancelled'], calculatedAt: now.toISOString() };
  }

  // Check overdue target end date
  if (project.targetEndDate && new Date(project.targetEndDate) < now) {
    riskFactors.push(`Project past target end date (${new Date(project.targetEndDate).toLocaleDateString()})`);
  }

  // Check overdue milestones
  const overdueMilestones = (project.milestones || []).filter(
    (m: any) => m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now
  );
  if (overdueMilestones.length > 0) {
    riskFactors.push(`${overdueMilestones.length} milestone(s) past due date`);
  }

  // Check overdue tasks
  const overdueTasks = (project.tasks || []).filter(
    (t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate && new Date(t.dueDate) < now
  );
  if (overdueTasks.length > 0) {
    riskFactors.push(`${overdueTasks.length} task(s) past due date`);
  }

  // Check blocked milestones/tasks
  const blockedTasks = (project.tasks || []).filter((t: any) => t.status === 'BLOCKED');
  if (blockedTasks.length > 0) {
    riskFactors.push(`${blockedTasks.length} task(s) in BLOCKED status`);
  }

  let health: any = 'ON_TRACK';
  if (project.targetEndDate && new Date(project.targetEndDate) < now) {
    health = 'OVERDUE';
  } else if (blockedTasks.length > 0) {
    health = 'BLOCKED';
  } else if (riskFactors.length > 0) {
    health = 'AT_RISK';
  }

  return {
    health,
    riskFactors,
    calculatedAt: now.toISOString(),
  };
}

export function calculateProjectProgress(project: any): ProjectProgressPayload {
  const milestones = project.milestones || [];
  const tasks = project.tasks || [];
  const deliverables = project.deliverables || [];

  const milestoneCompletionPercent =
    milestones.length === 0
      ? 0
      : Math.round((milestones.filter((m: any) => m.status === 'COMPLETED').length / milestones.length) * 100);

  const taskCompletionPercent =
    tasks.length === 0
      ? 0
      : Math.round((tasks.filter((t: any) => t.status === 'COMPLETED').length / tasks.length) * 100);

  const deliverableApprovalPercent =
    deliverables.length === 0
      ? 0
      : Math.round((deliverables.filter((d: any) => d.status === 'APPROVED').length / deliverables.length) * 100);

  let overallProgressPercent = 0;
  let count = 0;
  if (milestones.length > 0) {
    overallProgressPercent += milestoneCompletionPercent;
    count++;
  }
  if (tasks.length > 0) {
    overallProgressPercent += taskCompletionPercent;
    count++;
  }
  if (deliverables.length > 0) {
    overallProgressPercent += deliverableApprovalPercent;
    count++;
  }

  overallProgressPercent = count > 0 ? Math.round(overallProgressPercent / count) : 0;

  return {
    milestoneCompletionPercent,
    taskCompletionPercent,
    deliverableApprovalPercent,
    overallProgressPercent,
  };
}
