export type AnalyticsScopeType = 'GLOBAL' | 'TEAM' | 'MEMBER';

export type MetricUnit = 'COUNT' | 'CURRENCY' | 'PERCENT' | 'RATIO' | 'SCORE';

export type MetricPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface KPIDefinition {
  key: string;
  displayName: string;
  description: string;
  sourceModule: string;
  calculationSource: string;
  unit: MetricUnit;
  periodType: MetricPeriodType;
  permissionRequired?: string;
}

export interface MetricValueWithTrend {
  key: string;
  displayName: string;
  currentValue: number;
  previousValue: number;
  absoluteDifference: number;
  percentageChange: number;
  trendDirection: 'UP' | 'DOWN' | 'FLAT';
  unit: MetricUnit;
  sourceModule: string;
}

export interface OrganizationAnalyticsDTO {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  atRiskMembers: number;
  exitedMembers: number;
  newMembersThisPeriod: number;
  memberGrowthRate: number;
  directDownlineCount: number;
  totalOrganizationSize: number;
  averageOrganizationDepth: number;
}

export interface RankAnalyticsDTO {
  membersByRank: Record<string, number>;
  rankDistribution: Array<{ rankCode: string; rankName: string; count: number; percentage: number }>;
  rankAdvancementThisPeriod: number;
  newlyAchievedRanks: Array<{ memberId: string; memberName: string; rankCode: string }>;
  approachingNextRankCount: number;
  losingQualificationCount: number;
  emeraldSequenceProgressCount: number;
  qualifiedDirectorCount: number;
  directorQualificationTrend: Array<{ period: string; count: number }>;
}

export interface QualificationAnalyticsDTO {
  qualifiedMembers: number;
  notQualifiedMembers: number;
  notYetEvaluatedMembers: number;
  qualificationRate: number;
  activeStatusRate: number;
  totalQpv: number;
  totalPpv: number;
  totalBv: number;
  totalGroupPv: number;
  qualifiedDirectorLegsCount: number;
  qpvTrend: Array<{ period: string; value: number }>;
  qualificationRateTrend: Array<{ period: string; rate: number }>;
}

export interface CompensationAnalyticsDTO {
  totalCalculatedAmount: number;
  totalApprovedAmount: number;
  totalPostedAmount: number;
  compensationByRule: Record<string, number>;
  compensationByPeriod: Array<{ period: string; amount: number }>;
  compensationByRank: Record<string, number>;
  unconfiguredRulesCount: number;
  totalAdjustmentAmount: number;
  postingStatusSummary: Record<string, number>;
}

export interface FinancialAnalyticsDTO {
  totalLedgerBalance: number;
  availableBalance: number;
  reservedFunds: number;
  earningsPosted: number;
  totalWithdrawals: number;
  totalAdjustments: number;
  paymentRequestsCount: number;
  approvedPaymentsAmount: number;
  rejectedPaymentsAmount: number;
  cancelledPaymentsAmount: number;
  financialDisputesCount: number;
}

export interface CrmAnalyticsDTO {
  totalLeads: number;
  newLeadsThisPeriod: number;
  leadsBySource: Record<string, number>;
  leadsByTemperature: Record<string, number>;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  conversionRate: number;
  averageDealValue: number;
  followUpsDueCount: number;
  overdueFollowUpsCount: number;
  appointmentsCount: number;
  appointmentConversionRate: number;
}

export interface ProductivityAnalyticsDTO {
  dailyScoreAverage: number;
  weeklyScoreAverage: number;
  monthlyScoreAverage: number;
  activityCompletionRate: number;
  goalCompletionRate: number;
  taskCompletionRate: number;
  evidenceCompletionRate: number;
  averageStreakDays: number;
  overdueTasksCount: number;
  productivityTrend: Array<{ period: string; score: number }>;
}

export interface EngagementAnalyticsDTO {
  averageEngagementScore: number;
  trainingCompletionRate: number;
  trainingOverdueCount: number;
  communityPostsCount: number;
  communityCommentsCount: number;
  communityReactionsCount: number;
  messagingActivityCount: number;
  membersRequiringAttentionCount: number;
  leadershipAlertsCount: number;
}

export interface LeadershipAttentionSignalDTO {
  memberId: string;
  memberName: string;
  memberCode: string;
  signalType: string;
  sourceDomain: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  detectedAt: Date;
  recommendedAction: string;
}

export interface AnomalySignalDTO {
  metricKey: string;
  baselineValue: number;
  currentValue: number;
  difference: number;
  percentageChange: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
}

export interface ExecutiveDashboardDataDTO {
  periodId?: string;
  scopeType: AnalyticsScopeType;
  scopeId?: string;
  organization: OrganizationAnalyticsDTO;
  rankPerformance: RankAnalyticsDTO;
  qualification: QualificationAnalyticsDTO;
  compensation?: CompensationAnalyticsDTO;
  financial?: FinancialAnalyticsDTO;
  crm: CrmAnalyticsDTO;
  productivity: ProductivityAnalyticsDTO;
  engagement: EngagementAnalyticsDTO;
  attentionSignals: LeadershipAttentionSignalDTO[];
  anomalies: AnomalySignalDTO[];
  kpismatrix: MetricValueWithTrend[];
}
