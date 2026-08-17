// Module 20 — Platform Resilience Types

export type Criticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ResiliencePolicyScope = 'PLATFORM' | 'SERVICE' | 'DATA' | 'INFRASTRUCTURE';

export type BackupType = 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SNAPSHOT' | 'CONFIGURATION' | 'DOCUMENT';
export type BackupFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
export type BackupStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';

export type RecoveryPlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'RETIRED';
export type RecoveryStepType =
  | 'VALIDATION' | 'BACKUP' | 'RESTORE' | 'CONFIGURATION'
  | 'SERVICE_START' | 'SERVICE_STOP' | 'HEALTH_CHECK'
  | 'DATA_VERIFICATION' | 'NOTIFICATION' | 'MANUAL_APPROVAL';

export type RecoveryExecutionStatus =
  | 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  | 'FAILED' | 'CANCELLED' | 'ROLLBACK_REQUIRED';

export type RecoveryStepExecutionStatus =
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'RETRYING';

export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'INCIDENT' | 'DRILL' | 'AUTOMATED';

export type DependencyType =
  | 'DATABASE' | 'CACHE' | 'STORAGE' | 'EXTERNAL_API' | 'INTEGRATION'
  | 'MESSAGING' | 'AUTHENTICATION' | 'INTERNAL_SERVICE' | 'THIRD_PARTY';

export type ContinuityPlanStatus = 'DRAFT' | 'ACTIVE' | 'UNDER_REVIEW' | 'RETIRED';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus =
  | 'OPEN' | 'ACKNOWLEDGED' | 'ASSESSING' | 'RECOVERING'
  | 'MONITORING' | 'RESOLVED' | 'CLOSED';
export type IncidentSource =
  | 'MONITORING' | 'BACKUP' | 'RECOVERY' | 'INTEGRATION'
  | 'SECURITY' | 'DATABASE' | 'INFRASTRUCTURE' | 'MANUAL';

export type DrillType = 'DRY_RUN' | 'TABLETOP' | 'RESTORE_TEST' | 'FAILOVER_TEST' | 'FULL_RECOVERY_TEST';

// DTO Interfaces
export interface CreateBackupPlanInput {
  planCode: string;
  name: string;
  description?: string;
  backupType: BackupType;
  frequency: BackupFrequency;
  retentionDays?: number;
  storageReference?: string;
  encryptionRequired?: boolean;
  verificationRequired?: boolean;
}

export interface CreateRecoveryPlanInput {
  planCode: string;
  name: string;
  description?: string;
  scope: ResiliencePolicyScope;
  priority?: number;
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  createdById?: string;
}

export interface CreateRecoveryStepInput {
  recoveryPlanId: string;
  stepNumber: number;
  name: string;
  description?: string;
  stepType: RecoveryStepType;
  commandReference?: string;
  dependencyJson?: string;
  timeoutSeconds?: number;
  isRequired?: boolean;
}

export interface ExecuteRecoveryInput {
  recoveryPlanId: string;
  triggerType: TriggerType;
  initiatedById?: string;
  correlationId?: string;
  metadataJson?: string;
}

export interface CreateDependencyInput {
  dependencyCode: string;
  name: string;
  serviceName: string;
  dependencyType: DependencyType;
  criticality: Criticality;
  healthCheckReference?: string;
  fallbackStrategy?: string;
  rpoMinutes?: number;
  rtoMinutes?: number;
}

export interface CreateContinuityPlanInput {
  planCode: string;
  name: string;
  description?: string;
  businessFunction: string;
  criticality: Criticality;
  minimumOperatingLevel?: string;
  maximumTolerableDowntimeMinutes: number;
  ownerId?: string;
}

export interface CreateContinuityProcedureInput {
  continuityPlanId: string;
  procedureCode: string;
  name: string;
  sequence: number;
  description?: string;
  responsibleRole?: string;
  dependencyJson?: string;
  fallbackAction?: string;
  isRequired?: boolean;
}

export interface CreateResilienceIncidentInput {
  incidentCode: string;
  name: string;
  description?: string;
  severity: IncidentSeverity;
  source: IncidentSource;
  correlationId?: string;
}

export interface CreateResiliencePolicyInput {
  policyCode: string;
  name: string;
  description?: string;
  scope: ResiliencePolicyScope;
  rpoMinutes: number;
  rtoMinutes: number;
  priority?: number;
  criticality: Criticality;
  createdById?: string;
}

export interface RecoveryDrillInput {
  recoveryPlanId: string;
  drillType: DrillType;
  initiatedById?: string;
  metadataJson?: string;
}

export interface RpoRtoComplianceResult {
  isCompliant: boolean;
  targetMinutes: number;
  actualMinutes: number;
  violationMinutes: number;
  lastMeasuredAt: Date | null;
}

export interface ResilienceDashboardDto {
  totalBackupPlans: number;
  activeBackupPlans: number;
  totalRecoveryPlans: number;
  activeRecoveryPlans: number;
  totalDependencies: number;
  activeDependencies: number;
  totalContinuityPlans: number;
  activeContinuityPlans: number;
  openIncidents: number;
  criticalIncidents: number;
  recentBackups: any[];
  recentRecoveries: any[];
  rpoCompliance: boolean;
  rtoCompliance: boolean;
}
