import { KPIDefinition } from './types';

export const KPI_REGISTRY: Record<string, KPIDefinition> = {
  total_members: {
    key: 'total_members',
    displayName: 'Total Members',
    description: 'Total network organization members count',
    sourceModule: 'Prompt 02 / 02.5 (Organization)',
    calculationSource: 'NetworkMember.count',
    unit: 'COUNT',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:read_own',
  },
  active_member_rate: {
    key: 'active_member_rate',
    displayName: 'Active Member Rate',
    description: 'Percentage of organization members currently active',
    sourceModule: 'Prompt 02 / 02.5 (Organization)',
    calculationSource: 'Active NetworkMember / Total NetworkMember',
    unit: 'PERCENT',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:read_own',
  },
  qualification_rate: {
    key: 'qualification_rate',
    displayName: 'Qualification Rate',
    description: 'Percentage of active members achieving qualified status in period',
    sourceModule: 'Prompt 03A / 03B (Ranks & Qualification)',
    calculationSource: 'MemberQualification (qualifiedStatus === QUALIFIED)',
    unit: 'PERCENT',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:read_own',
  },
  total_qpv: {
    key: 'total_qpv',
    displayName: 'Total Qualified Performance Volume (QPV)',
    description: 'Aggregated QPV across organization scope for target period',
    sourceModule: 'Prompt 03A / 03B (Ranks & Qualification)',
    calculationSource: 'MemberQualification.qpv SUM',
    unit: 'COUNT',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:read_own',
  },
  crm_pipeline_value: {
    key: 'crm_pipeline_value',
    displayName: 'Total CRM Pipeline Value',
    description: 'Aggregate value of all open sales opportunities in NGN',
    sourceModule: 'Prompt 06 (CRM)',
    calculationSource: 'CrmOpportunity.value SUM (status === OPEN)',
    unit: 'CURRENCY',
    periodType: 'MONTHLY',
    permissionRequired: 'crm:read_own',
  },
  crm_conversion_rate: {
    key: 'crm_conversion_rate',
    displayName: 'CRM Lead Conversion Rate',
    description: 'Percentage of leads converted into members or won opportunities',
    sourceModule: 'Prompt 06 (CRM)',
    calculationSource: 'Converted CrmLead / Total CrmLead',
    unit: 'PERCENT',
    periodType: 'MONTHLY',
    permissionRequired: 'crm:read_own',
  },
  productivity_score_avg: {
    key: 'productivity_score_avg',
    displayName: 'Average Productivity Score',
    description: 'Aggregated daily activity, goal, task, and evidence score average',
    sourceModule: 'Prompt 04 (Productivity)',
    calculationSource: 'ProductivityScore.overallScore AVG',
    unit: 'SCORE',
    periodType: 'MONTHLY',
    permissionRequired: 'productivity:read',
  },
  engagement_score_avg: {
    key: 'engagement_score_avg',
    displayName: 'Average Engagement Score',
    description: 'Community activity, training progress, and messaging score',
    sourceModule: 'Prompt 07 (Community & Engagement)',
    calculationSource: 'Community, Messaging, and Training Progress Aggregation',
    unit: 'SCORE',
    periodType: 'MONTHLY',
    permissionRequired: 'community:read',
  },
  total_compensation_posted: {
    key: 'total_compensation_posted',
    displayName: 'Total Compensation Posted',
    description: 'Total compensation earnings posted to double-entry ledger in period',
    sourceModule: 'Prompt 08 (Compensation)',
    calculationSource: 'MemberCompensationResult.finalPayableAmount (status === POSTED)',
    unit: 'CURRENCY',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:compensation',
  },
  total_ledger_balance: {
    key: 'total_ledger_balance',
    displayName: 'Total Double-Entry Ledger Balance',
    description: 'Authoritative double-entry ledger liabilities balance for members',
    sourceModule: 'Prompt 05 / 05.1 (Financial Ledger)',
    calculationSource: 'JournalEntry & FinancialAccount SUM',
    unit: 'CURRENCY',
    periodType: 'MONTHLY',
    permissionRequired: 'analytics:financial',
  },
};

export function getKPIDefinition(key: string): KPIDefinition | undefined {
  return KPI_REGISTRY[key];
}

export function getAllKPIDefinitions(): KPIDefinition[] {
  return Object.values(KPI_REGISTRY);
}
