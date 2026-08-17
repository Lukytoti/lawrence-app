import {
  queryOrganizationAnalytics,
  queryRankAnalytics,
  queryQualificationAnalytics,
  queryCompensationAnalytics,
  queryFinancialAnalytics,
  queryCrmAnalytics,
  queryProductivityAnalytics,
  queryEngagementAnalytics,
} from './queries';

export interface ExecutiveReportWrapper<T> {
  reportType: string;
  generatedAt: Date;
  authoritativeSource: string;
  data: T;
}

export async function getOrganizationReport(memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryOrganizationAnalytics(memberIdsScope);
  return {
    reportType: 'ORGANIZATION_PERFORMANCE_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 02/02.5 Organization Relationship CTE',
    data,
  };
}

export async function getRankPerformanceReport(periodId?: string, memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryRankAnalytics(periodId, memberIdsScope);
  return {
    reportType: 'RANK_PERFORMANCE_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 03A/03B Rank & MemberQualification Engine',
    data,
  };
}

export async function getQualificationReport(periodId?: string, memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryQualificationAnalytics(periodId, memberIdsScope);
  return {
    reportType: 'QUALIFICATION_TREND_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 03A/03B MemberQualification Engine',
    data,
  };
}

export async function getCompensationReport(periodId?: string, memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryCompensationAnalytics(periodId, memberIdsScope);
  return {
    reportType: 'COMPENSATION_RUN_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 08 MemberCompensationResult Engine',
    data,
  };
}

export async function getFinancialReport(memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryFinancialAnalytics(memberIdsScope);
  return {
    reportType: 'DOUBLE_ENTRY_FINANCIAL_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 05/05.1 Double-Entry Financial Ledger',
    data,
  };
}

export async function getCrmPerformanceReport(ownerUserId?: string): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryCrmAnalytics(ownerUserId);
  return {
    reportType: 'CRM_PIPELINE_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 06 CRM Lead & Opportunity Engine',
    data,
  };
}

export async function getProductivityReport(memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryProductivityAnalytics(memberIdsScope);
  return {
    reportType: 'MEMBER_PRODUCTIVITY_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 04 Member Productivity & Score Engine',
    data,
  };
}

export async function getEngagementReport(memberIdsScope?: string[]): Promise<ExecutiveReportWrapper<any>> {
  const data = await queryEngagementAnalytics(memberIdsScope);
  return {
    reportType: 'COMMUNITY_ENGAGEMENT_REPORT',
    generatedAt: new Date(),
    authoritativeSource: 'Prompt 07 Community & Communication Engine',
    data,
  };
}
