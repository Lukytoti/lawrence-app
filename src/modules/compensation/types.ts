export type CompensationCategory =
  | 'SVB'
  | 'LDB'
  | 'NDB'
  | 'RANK_BONUS'
  | 'LEADERSHIP_BONUS'
  | 'OTHER_CONFIGURED_COMPENSATION';

export type CompensationRunStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'CALCULATED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'POSTING'
  | 'POSTED'
  | 'FAILED'
  | 'CANCELLED';

export type RuleStatus = 'ACTIVE' | 'UNCONFIGURED' | 'DEPRECATED';

export type LineEligibilityStatus = 'QUALIFIED' | 'UNCONFIGURED' | 'INELIGIBLE';

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  category: CompensationCategory;
  calculatedAmount: number;
  baseAmount: number;
  rateOrFormulaRef: string;
  eligibilityStatus: LineEligibilityStatus;
  explanation: string;
  sourceMemberId?: string;
  snapshot?: any;
  warning?: string;
}

export interface MemberCompensationCalculationResult {
  memberId: string;
  achievedRankCode: string;
  qualifiedRankCode: string;
  qualifyingQPV: number;
  qualifyingPPV: number;
  qualifyingBV: number;
  grossCalculatedAmount: number;
  adjustmentsAmount: number;
  finalPayableAmount: number;
  currency: string;
  status: string;
  explanationJson: string;
  snapshotJson: string;
  earningLines: RuleEvaluationResult[];
  warnings: string[];
}

export interface CompensationRunSummary {
  runId: string;
  periodId: string;
  planVersionId: string;
  countryCode: string;
  status: CompensationRunStatus;
  totalMembersCount: number;
  totalGrossAmount: number;
  currency: string;
  categoryBreakdown: Record<CompensationCategory, number>;
  unconfiguredRulesCount: number;
  warningsCount: number;
}
