export type HealthStatus = 'HEALTHY' | 'STABLE' | 'AT_RISK' | 'CRITICAL' | 'CHURNED';
export type RetentionCaseStatus = 'OPEN' | 'INVESTIGATING' | 'ACTION_PLAN' | 'MONITORING' | 'RESOLVED' | 'CHURNED';
export type RetentionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RenewalStatus = 'UPCOMING' | 'OUTREACH' | 'NEGOTIATION' | 'RENEWED' | 'DECLINED' | 'CHURNED';
export type ExpansionStatus = 'IDENTIFIED' | 'QUALIFIED' | 'CONVERTED_TO_CRM' | 'DISMISSED';
export type TouchpointType = 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'CHECK_IN' | 'RENEWAL_OUTREACH' | 'SUPPORT_FOLLOWUP' | 'DELIVERY_REVIEW' | 'EXECUTIVE_REVIEW';
export type RiskSignalSourceDomain = 'BILLING' | 'PROJECT' | 'CRM' | 'CONTRACT' | 'ENGAGEMENT';
export type RiskSignalStatus = 'ACTIVE' | 'RESOLVED' | 'IGNORED';
export type SuccessPlanStatus = 'DRAFT' | 'ACTIVE' | 'AT_RISK' | 'COMPLETED' | 'CANCELLED';

export interface ScoreFactor {
  category: string;
  impactScore: number; // positive or negative
  description: string;
}

export interface ClientHealthResult {
  clientId: string;
  healthStatus: HealthStatus;
  healthScore: number; // 0 - 100
  factors: ScoreFactor[];
  calculatedAt: Date;
}

export interface CreateRetentionCaseInput {
  clientId: string;
  severity?: RetentionSeverity;
  reason: string;
  detectedSignals?: string[];
  assignedOwnerId?: string;
  actionPlan?: string;
  dueDate?: Date;
}

export interface CreateRenewalInput {
  clientId: string;
  contractId: string;
  expirationWindowDays?: number;
  targetRenewalDate: Date;
  proposedValue?: number;
  currency?: string;
  assignedOwnerId?: string;
  notes?: string;
}

export interface CreateExpansionOpportunityInput {
  clientId: string;
  serviceCategory: string;
  title: string;
  description?: string;
  estimatedValue?: number;
  currency?: string;
}

export interface CreateTouchpointInput {
  clientId: string;
  type: TouchpointType;
  summary: string;
  notes?: string;
  performedById: string;
  contactedAt?: Date;
}

export interface CreateSuccessPlanInput {
  clientId: string;
  title: string;
  clientObjectives: string;
  successMilestones: string[];
  expectedOutcomes?: string;
  reviewDate?: Date;
  ownerId?: string;
}
