export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'ACTIVE'
  | 'CLIENT_REVIEW'
  | 'REVISION_REQUIRED'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type ProjectTaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type DeliverableStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUIRED';

export type DeliverableType = 'FILE' | 'LINK' | 'DOCUMENT' | 'PROTOTYPE' | 'DEPLOYMENT';

export type ClientReviewStatus = 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';

export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' | 'BLOCKED' | 'COMPLETED';

export interface ProjectHealthPayload {
  health: ProjectHealth;
  riskFactors: string[];
  calculatedAt: string;
}

export interface ProjectProgressPayload {
  milestoneCompletionPercent: number;
  taskCompletionPercent: number;
  deliverableApprovalPercent: number;
  overallProgressPercent: number;
}

export interface CreateProjectInput {
  clientId: string;
  crmOpportunityId?: string;
  serviceId?: string;
  templateId?: string;
  ownerId: string;
  projectManagerId?: string;
  title: string;
  description?: string;
  priority?: ProjectPriority;
  startDate?: Date | string;
  targetEndDate?: Date | string;
  currency?: string;
  contractValue?: number;
}

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  sequence?: number;
  dueDate?: Date | string;
}

export interface CreateProjectTaskInput {
  projectId: string;
  milestoneId?: string;
  assignedToId?: string;
  title: string;
  description?: string;
  priority?: ProjectPriority;
  dueDate?: Date | string;
  estimatedHours?: number;
}

export interface SubmitDeliverableInput {
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  type?: DeliverableType;
  evidenceId?: string;
  actorUserId: string;
}

export interface RequestClientReviewInput {
  projectId: string;
  deliverableId: string;
  actorUserId: string;
}

export interface SubmitClientReviewInput {
  projectId: string;
  deliverableId: string;
  status: 'APPROVED' | 'REVISION_REQUESTED';
  feedback?: string;
  reviewedByUserId: string;
}
