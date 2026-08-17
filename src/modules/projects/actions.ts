'use server';

import {
  requireProjectRead,
  requireProjectCreate,
  requireProjectUpdate,
  requireServiceManagement,
  requireTemplateManagement,
} from './permissions';
import {
  createProject,
  updateProjectStatus,
  getProjectById,
  getProjects,
} from './projects';
import { convertWonOpportunityToProject } from './conversion';
import { createMilestone, updateMilestoneStatus } from './milestones';
import { createProjectTask, updateProjectTaskStatus } from './tasks';
import { submitDeliverable, updateDeliverableStatus } from './deliverables';
import { requestClientReview, submitClientReview } from './reviews';
import { grantClientPortalAccess, revokeClientPortalAccess, getClientPortalProjectData } from './client-portal';
import { createDigitalService, setDigitalServiceStatus, getDigitalServices } from './service-catalog';
import { createProjectTemplate, getProjectTemplates } from './templates';
import { ProjectStatus, MilestoneStatus, ProjectTaskStatus, DeliverableStatus } from './types';

export async function fetchProjectsAction(userId: string, status?: string) {
  await requireProjectRead(userId);
  return getProjects({ status });
}

export async function fetchProjectByIdAction(userId: string, projectId: string) {
  await requireProjectRead(userId, projectId);
  return getProjectById(projectId);
}

export async function createProjectAction(userId: string, input: any) {
  await requireProjectCreate(userId);
  return createProject(input, userId);
}

export async function updateProjectStatusAction(userId: string, projectId: string, status: ProjectStatus) {
  await requireProjectUpdate(userId);
  return updateProjectStatus(projectId, status, userId);
}

export async function convertOpportunityAction(userId: string, crmOpportunityId: string, options?: any) {
  await requireProjectCreate(userId);
  return convertWonOpportunityToProject(crmOpportunityId, userId, options);
}

export async function createMilestoneAction(userId: string, input: any) {
  await requireProjectUpdate(userId);
  return createMilestone(input, userId);
}

export async function updateMilestoneStatusAction(userId: string, milestoneId: string, status: MilestoneStatus) {
  await requireProjectUpdate(userId);
  return updateMilestoneStatus(milestoneId, status, userId);
}

export async function createProjectTaskAction(userId: string, input: any) {
  await requireProjectUpdate(userId);
  return createProjectTask(input, userId);
}

export async function updateProjectTaskStatusAction(
  userId: string,
  projectTaskId: string,
  status: ProjectTaskStatus,
  actualHours?: number
) {
  await requireProjectUpdate(userId);
  return updateProjectTaskStatus(projectTaskId, status, userId, actualHours);
}

export async function submitDeliverableAction(userId: string, input: any) {
  await requireProjectUpdate(userId);
  return submitDeliverable({ ...input, actorUserId: userId });
}

export async function updateDeliverableStatusAction(userId: string, deliverableId: string, status: DeliverableStatus) {
  await requireProjectUpdate(userId);
  return updateDeliverableStatus(deliverableId, status, userId);
}

export async function requestClientReviewAction(userId: string, projectId: string, deliverableId: string) {
  await requireProjectUpdate(userId);
  return requestClientReview({ projectId, deliverableId, actorUserId: userId });
}

export async function submitClientReviewAction(userId: string, projectId: string, deliverableId: string, status: 'APPROVED' | 'REVISION_REQUESTED', feedback?: string) {
  return submitClientReview({ projectId, deliverableId, status, feedback, reviewedByUserId: userId });
}

export async function grantClientAccessAction(userId: string, clientId: string, projectId: string, email: string) {
  await requireProjectUpdate(userId);
  return grantClientPortalAccess(clientId, projectId, email, userId);
}

export async function revokeClientAccessAction(userId: string, projectId: string, email: string) {
  await requireProjectUpdate(userId);
  return revokeClientPortalAccess(projectId, email, userId);
}

export async function fetchClientPortalDataAction(projectId: string, clientEmail: string) {
  return getClientPortalProjectData(projectId, clientEmail);
}

export async function createServiceAction(userId: string, input: any) {
  await requireServiceManagement(userId);
  return createDigitalService(input);
}

export async function setServiceStatusAction(userId: string, id: string, isActive: boolean) {
  await requireServiceManagement(userId);
  return setDigitalServiceStatus(id, isActive);
}

export async function fetchServicesAction() {
  return getDigitalServices(false);
}

export async function createTemplateAction(userId: string, input: any) {
  await requireTemplateManagement(userId);
  return createProjectTemplate(input);
}

export async function fetchTemplatesAction() {
  return getProjectTemplates(false);
}
