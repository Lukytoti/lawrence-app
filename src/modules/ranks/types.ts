export type RequirementStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'NOT_APPLICABLE'
  | 'PENDING_REVIEW';

export type QualifiedStatus = 'QUALIFIED' | 'NOT_QUALIFIED' | 'PROVISIONAL' | 'NOT_YET_EVALUATED';

export interface RankSummary {
  id: string;
  code: string;
  name: string;
  displayName: string;
  level: number;
  category: string;
  isConfigured?: boolean;
  description?: string | null;
}

export interface RankRequirementProgress {
  id: string;
  requirementType: string;
  metric: string;
  threshold: number;
  currentValue: number;
  remainingValue: number;
  progressPercent: number;
  status: RequirementStatus;
  description: string;
  isRequired: boolean;
}

export interface NextRankProgressPayload {
  currentRank: RankSummary;
  achievedRank: RankSummary;
  qualifiedRank: RankSummary;
  nextRank: RankSummary | null;
  qualifiedStatus: QualifiedStatus;
  activeStatus: boolean;
  pv: number;
  ppv: number;
  qpv: number;
  bv: number;
  svbRatePercent: number;
  consecutiveQualifyingMonths?: number;
  requirements: RankRequirementProgress[];
  overallProgressPercent: number;
}

export interface QualificationPeriodSummary {
  id: string;
  year: number;
  month: number;
  periodStart: Date | string;
  periodEnd: Date | string;
  status: string;
}

export interface MemberQualificationSummary {
  id: string;
  memberId: string;
  period: QualificationPeriodSummary;
  achievedRank: RankSummary;
  qualifiedRank: RankSummary;
  pv: number;
  ppv: number;
  qpv: number;
  bv: number;
  svbRatePercent: number;
  activeStatus: boolean;
  qualifiedStatus: QualifiedStatus;
  evaluatedAt: Date | string;
}

export interface SVBRateConfigSummary {
  id: string;
  minQPV: number;
  maxQPV?: number | null;
  ratePercent: number;
  description?: string | null;
}

export interface PlanVersionSummary {
  id: string;
  country: string;
  planName: string;
  versionName: string;
  status: string;
  effectiveFrom: Date | string;
  ranksCount: number;
}
