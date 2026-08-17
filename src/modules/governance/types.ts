export type SecurityEventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'SECRET_EXPOSURE_ATTEMPT'
  | 'ANOMALY_DETECTED'
  | 'PRIVILEGE_ESCALATION'
  | 'EXPORT_BURST'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCESS_DENIED'
  | 'SYSTEM_ALERT';

export type SecurityIncidentStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'CONTAINED'
  | 'RESOLVED'
  | 'CLOSED';

export type AccessReviewStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REVOKED'
  | 'EXPIRED';

export type ComplianceControlStatus = 'ACTIVE' | 'INACTIVE' | 'AT_RISK';

export type ComplianceFramework = 'SOC2' | 'ISO27001' | 'GDPR' | 'INTERNAL';

export type SecurityRiskStatus =
  | 'OPEN'
  | 'MITIGATING'
  | 'ACCEPTED'
  | 'RESOLVED'
  | 'CLOSED';

export type OperationalIncidentStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'MITIGATED'
  | 'RESOLVED'
  | 'CLOSED';

export type MetricType = 'HEALTH' | 'LATENCY' | 'ERROR_RATE' | 'THROUGHPUT' | 'USAGE';

export interface CreateSecurityEventInput {
  eventType: SecurityEventType | string;
  severity: SecurityEventSeverity;
  source: string;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata?: Record<string, any>;
  correlationId?: string;
}

export interface CreateSecurityIncidentInput {
  title: string;
  description: string;
  severity: SecurityEventSeverity;
  category: string;
  assignedToId?: string;
  rootCause?: string;
  metadata?: Record<string, any>;
}

export interface CreateAccessReviewInput {
  userId: string;
  reviewerId: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateComplianceControlInput {
  controlCode: string;
  name: string;
  description: string;
  category: string;
  framework: ComplianceFramework;
  ownerRole: string;
  frequency: string;
  evidenceRequired?: boolean;
}

export interface RecordComplianceEvidenceInput {
  controlId: string;
  evidenceType: string;
  reference: string;
  description?: string;
  collectedById?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreateSecurityRiskInput {
  title: string;
  description: string;
  category: string;
  severity: SecurityEventSeverity;
  likelihood: number; // 1-5
  impact: number; // 1-5
  ownerId?: string;
  mitigationPlan?: string;
}

export interface RecordSystemMetricInput {
  metricCode: string;
  service: string;
  metricType: MetricType;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface RecordRateLimitEventInput {
  key: string;
  scope: string;
  endpoint?: string;
  actorId?: string;
  count: number;
  limit: number;
  windowStart: Date;
  windowEnd: Date;
  blocked?: boolean;
}

export interface GovernanceDashboardDto {
  totalSecurityEventsToday: number;
  openIncidentsCount: number;
  pendingAccessReviewsCount: number;
  activeComplianceControlsCount: number;
  complianceScorePercentage: number;
  openRisksCount: number;
  overallSystemHealth: string;
  recentSecurityEvents: any[];
  activeIncidents: any[];
  urgentRisks: any[];
}

export interface SecurityDashboardDto {
  totalEvents24h: number;
  criticalEventsCount: number;
  blockedRateLimitEventsCount: number;
  secretExposureAttemptsCount: number;
  recentEvents: any[];
}

export interface ComplianceDashboardDto {
  totalControls: number;
  activeControls: number;
  atRiskControls: number;
  complianceScorePercentage: number;
  frameworkBreakdown: Record<string, { total: number; active: number }>;
  expiredEvidenceCount: number;
  recentEvidences: any[];
}

export interface RiskDto {
  id: string;
  riskCode: string;
  title: string;
  description: string;
  severity: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: string;
  mitigationPlan?: string;
  createdAt: Date;
}

export interface AccessReviewDto {
  id: string;
  reviewCode: string;
  userId: string;
  reviewerId: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  itemsCount: number;
}
