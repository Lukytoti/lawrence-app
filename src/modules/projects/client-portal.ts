import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function grantClientPortalAccess(
  clientId: string,
  projectId: string,
  email: string,
  actorUserId: string
) {
  const access = await db.clientPortalAccess.upsert({
    where: { projectId_email: { projectId, email } },
    update: { status: 'ACTIVE' },
    create: {
      clientId,
      projectId,
      email,
      status: 'ACTIVE',
    },
  });

  await db.projectActivity.create({
    data: {
      projectId,
      actorId: actorUserId,
      activityType: 'CLIENT_ACCESS_GRANTED',
      visibility: 'INTERNAL',
      description: `Client portal access granted to ${email}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CLIENT_ACCESS_GRANTED',
    entityType: 'ClientPortalAccess',
    entityId: access.id,
    metadata: { projectId, email },
  });

  return access;
}

export async function revokeClientPortalAccess(
  projectId: string,
  email: string,
  actorUserId: string
) {
  const access = await db.clientPortalAccess.update({
    where: { projectId_email: { projectId, email } },
    data: { status: 'REVOKED' },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CLIENT_ACCESS_REVOKED',
    entityType: 'ClientPortalAccess',
    entityId: access.id,
    metadata: { projectId, email },
  });

  return access;
}

export async function verifyClientPortalAccess(projectId: string, clientEmail: string) {
  const access = await db.clientPortalAccess.findUnique({
    where: { projectId_email: { projectId, email: clientEmail } },
  });

  if (!access || access.status !== 'ACTIVE') {
    return false;
  }

  // Update last access timestamp
  await db.clientPortalAccess.update({
    where: { id: access.id },
    data: { lastAccessAt: new Date() },
  });

  return true;
}

export async function getClientPortalProjectData(projectId: string, clientEmail: string) {
  const isAllowed = await verifyClientPortalAccess(projectId, clientEmail);
  if (!isAllowed) {
    throw new Error(`Unauthorized client access attempt for project ${projectId} by ${clientEmail}.`);
  }

  const project = await db.digitalProject.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      service: true,
      milestones: {
        orderBy: { sequence: 'asc' },
        include: { deliverables: { where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUIRED'] } }, include: { evidence: true } } },
      },
      deliverables: {
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUIRED'] } },
        include: { evidence: true, reviews: true },
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        where: { visibility: 'CLIENT_VISIBLE' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  });

  if (!project) throw new Error(`Project ${projectId} not found.`);

  return {
    id: project.id,
    projectCode: project.projectCode,
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    targetEndDate: project.targetEndDate,
    completedAt: project.completedAt,
    client: {
      companyName: project.client.companyName,
      contactName: project.client.contactName,
    },
    service: project.service ? { name: project.service.name, category: project.service.category } : null,
    milestones: project.milestones,
    deliverables: project.deliverables,
    activities: project.activities,
  };
}
