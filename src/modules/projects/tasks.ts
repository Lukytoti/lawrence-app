import { db } from '@/lib/db';
import { CreateProjectTaskInput, ProjectTaskStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function createProjectTask(input: CreateProjectTaskInput, actorUserId: string) {
  // Option: Optionally link to Prompt 04 Task if assignedToId exists
  let linkedTaskId: string | undefined = undefined;

  if (input.assignedToId) {
    const networkMember = await db.networkMember.findFirst({
      where: { userId: input.assignedToId },
    });

    if (networkMember) {
      const p4Task = await db.task.create({
        data: {
          assigneeId: networkMember.id,
          title: `[Project] ${input.title}`,
          description: input.description,
          priority: input.priority || 'MEDIUM',
          status: 'TODO',
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          assignedBy: actorUserId,
        },
      });
      linkedTaskId = p4Task.id;
    }
  }

  const projectTask = await db.projectTask.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId,
      assignedToId: input.assignedToId,
      taskId: linkedTaskId,
      title: input.title,
      description: input.description,
      status: 'TODO',
      priority: input.priority || 'MEDIUM',
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      estimatedHours: input.estimatedHours || 0,
    },
    include: { assignedTo: { include: { profile: true } }, milestone: true },
  });

  await db.projectActivity.create({
    data: {
      projectId: input.projectId,
      actorId: actorUserId,
      activityType: 'TASK_ASSIGNED',
      visibility: 'INTERNAL',
      description: `Task created: ${projectTask.title}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PROJECT_TASK_CREATED',
    entityType: 'ProjectTask',
    entityId: projectTask.id,
    metadata: { projectId: input.projectId, title: projectTask.title },
  });

  return projectTask;
}

export async function updateProjectTaskStatus(
  projectTaskId: string,
  newStatus: ProjectTaskStatus,
  actorUserId: string,
  actualHours?: number
) {
  const pTask = await db.projectTask.findUnique({ where: { id: projectTaskId } });
  if (!pTask) throw new Error(`ProjectTask ${projectTaskId} not found.`);

  const completedAt = newStatus === 'COMPLETED' ? new Date() : undefined;

  const updatedPTask = await db.projectTask.update({
    where: { id: projectTaskId },
    data: {
      status: newStatus,
      completedAt: completedAt || pTask.completedAt,
      actualHours: actualHours !== undefined ? actualHours : pTask.actualHours,
    },
  });

  // Sync to Prompt 04 Task if linked
  if (pTask.taskId) {
    const p4Status = newStatus === 'COMPLETED' ? 'COMPLETED' : newStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO';
    await db.task.update({
      where: { id: pTask.taskId },
      data: {
        status: p4Status,
        completedAt: completedAt || undefined,
      },
    }).catch(() => null); // Non-blocking sync
  }

  await db.projectActivity.create({
    data: {
      projectId: pTask.projectId,
      actorId: actorUserId,
      activityType: 'TASK_UPDATED',
      visibility: 'INTERNAL',
      description: `Task status updated to ${newStatus}: ${pTask.title}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PROJECT_TASK_UPDATED',
    entityType: 'ProjectTask',
    entityId: projectTaskId,
    metadata: { status: newStatus },
  });

  return updatedPTask;
}

export async function getProjectTasks(projectId: string) {
  return db.projectTask.findMany({
    where: { projectId },
    include: { assignedTo: { include: { profile: true } }, milestone: true },
    orderBy: { createdAt: 'desc' },
  });
}
