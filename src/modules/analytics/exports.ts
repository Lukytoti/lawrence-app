import {
  getOrganizationReport,
  getRankPerformanceReport,
  getQualificationReport,
  getCompensationReport,
  getFinancialReport,
  getCrmPerformanceReport,
  getProductivityReport,
  getEngagementReport,
} from './reports';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export function sanitizeCsvField(value: any): string {
  const str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export async function generateCsvExport(
  reportType: string,
  actorUserId: string,
  memberIdsScope?: string[]
): Promise<string> {
  let csvContent = '';
  const timestamp = new Date().toISOString();

  switch (reportType) {
    case 'ORGANIZATION': {
      const report = await getOrganizationReport(memberIdsScope);
      csvContent = `Metric,Value\n`;
      csvContent += `${sanitizeCsvField('Total Members')},${sanitizeCsvField(report.data.totalMembers)}\n`;
      csvContent += `${sanitizeCsvField('Active Members')},${sanitizeCsvField(report.data.activeMembers)}\n`;
      csvContent += `${sanitizeCsvField('Inactive Members')},${sanitizeCsvField(report.data.inactiveMembers)}\n`;
      csvContent += `${sanitizeCsvField('At-Risk Members')},${sanitizeCsvField(report.data.atRiskMembers)}\n`;
      csvContent += `${sanitizeCsvField('Exited Members')},${sanitizeCsvField(report.data.exitedMembers)}\n`;
      csvContent += `${sanitizeCsvField('New Members This Period')},${sanitizeCsvField(report.data.newMembersThisPeriod)}\n`;
      csvContent += `${sanitizeCsvField('Member Growth Rate (%)')},${sanitizeCsvField(report.data.memberGrowthRate)}\n`;
      csvContent += `${sanitizeCsvField('Direct Downline Count')},${sanitizeCsvField(report.data.directDownlineCount)}\n`;
      break;
    }

    case 'RANK': {
      const report = await getRankPerformanceReport(undefined, memberIdsScope);
      csvContent = `Rank Code,Member Count,Percentage (%)\n`;
      for (const item of report.data.rankDistribution) {
        csvContent += `${sanitizeCsvField(item.rankCode)},${sanitizeCsvField(item.count)},${sanitizeCsvField(item.percentage)}\n`;
      }
      break;
    }

    case 'QUALIFICATION': {
      const report = await getQualificationReport(undefined, memberIdsScope);
      csvContent = `Metric,Value\n`;
      csvContent += `${sanitizeCsvField('Qualified Members')},${sanitizeCsvField(report.data.qualifiedMembers)}\n`;
      csvContent += `${sanitizeCsvField('Not Qualified Members')},${sanitizeCsvField(report.data.notQualifiedMembers)}\n`;
      csvContent += `${sanitizeCsvField('Qualification Rate (%)')},${sanitizeCsvField(report.data.qualificationRate)}\n`;
      csvContent += `${sanitizeCsvField('Total QPV')},${sanitizeCsvField(report.data.totalQpv)}\n`;
      csvContent += `${sanitizeCsvField('Total PPV')},${sanitizeCsvField(report.data.totalPpv)}\n`;
      csvContent += `${sanitizeCsvField('Total BV')},${sanitizeCsvField(report.data.totalBv)}\n`;
      break;
    }

    case 'COMPENSATION': {
      const report = await getCompensationReport(undefined, memberIdsScope);
      csvContent = `Metric,Amount (NGN)\n`;
      csvContent += `${sanitizeCsvField('Total Calculated Amount')},${sanitizeCsvField(report.data.totalCalculatedAmount)}\n`;
      csvContent += `${sanitizeCsvField('Total Approved Amount')},${sanitizeCsvField(report.data.totalApprovedAmount)}\n`;
      csvContent += `${sanitizeCsvField('Total Posted Amount')},${sanitizeCsvField(report.data.totalPostedAmount)}\n`;
      csvContent += `${sanitizeCsvField('Total Adjustments Amount')},${sanitizeCsvField(report.data.totalAdjustmentAmount)}\n`;
      break;
    }

    case 'FINANCIAL': {
      const report = await getFinancialReport(memberIdsScope);
      csvContent = `Metric,Amount (NGN)\n`;
      csvContent += `${sanitizeCsvField('Total Double-Entry Ledger Balance')},${sanitizeCsvField(report.data.totalLedgerBalance)}\n`;
      csvContent += `${sanitizeCsvField('Available Balance')},${sanitizeCsvField(report.data.availableBalance)}\n`;
      csvContent += `${sanitizeCsvField('Approved Withdrawals')},${sanitizeCsvField(report.data.approvedPaymentsAmount)}\n`;
      csvContent += `${sanitizeCsvField('Payment Requests Count')},${sanitizeCsvField(report.data.paymentRequestsCount)}\n`;
      break;
    }

    case 'CRM': {
      const report = await getCrmPerformanceReport();
      csvContent = `Metric,Value\n`;
      csvContent += `${sanitizeCsvField('Total Leads')},${sanitizeCsvField(report.data.totalLeads)}\n`;
      csvContent += `${sanitizeCsvField('New Leads This Period')},${sanitizeCsvField(report.data.newLeadsThisPeriod)}\n`;
      csvContent += `${sanitizeCsvField('Total Pipeline Value (NGN)')},${sanitizeCsvField(report.data.totalPipelineValue)}\n`;
      csvContent += `${sanitizeCsvField('Opportunities Won')},${sanitizeCsvField(report.data.opportunitiesWon)}\n`;
      csvContent += `${sanitizeCsvField('Opportunities Lost')},${sanitizeCsvField(report.data.opportunitiesLost)}\n`;
      csvContent += `${sanitizeCsvField('Conversion Rate (%)')},${sanitizeCsvField(report.data.conversionRate)}\n`;
      break;
    }

    case 'PRODUCTIVITY': {
      const report = await getProductivityReport(memberIdsScope);
      csvContent = `Metric,Score / Value\n`;
      csvContent += `${sanitizeCsvField('Daily Score Average')},${sanitizeCsvField(report.data.dailyScoreAverage)}\n`;
      csvContent += `${sanitizeCsvField('Weekly Score Average')},${sanitizeCsvField(report.data.weeklyScoreAverage)}\n`;
      csvContent += `${sanitizeCsvField('Monthly Score Average')},${sanitizeCsvField(report.data.monthlyScoreAverage)}\n`;
      csvContent += `${sanitizeCsvField('Activity Completion Rate (%)')},${sanitizeCsvField(report.data.activityCompletionRate)}\n`;
      csvContent += `${sanitizeCsvField('Overdue Tasks Count')},${sanitizeCsvField(report.data.overdueTasksCount)}\n`;
      break;
    }

    case 'ENGAGEMENT': {
      const report = await getEngagementReport(memberIdsScope);
      csvContent = `Metric,Value\n`;
      csvContent += `${sanitizeCsvField('Average Engagement Score')},${sanitizeCsvField(report.data.averageEngagementScore)}\n`;
      csvContent += `${sanitizeCsvField('Training Completion Rate (%)')},${sanitizeCsvField(report.data.trainingCompletionRate)}\n`;
      csvContent += `${sanitizeCsvField('Community Posts Count')},${sanitizeCsvField(report.data.communityPostsCount)}\n`;
      csvContent += `${sanitizeCsvField('Direct Messages Count')},${sanitizeCsvField(report.data.messagingActivityCount)}\n`;
      csvContent += `${sanitizeCsvField('Leadership Alerts Count')},${sanitizeCsvField(report.data.leadershipAlertsCount)}\n`;
      break;
    }

    default:
      throw new Error(`Unsupported export report type: ${reportType}`);
  }

  // Audit export action
  await logAuditEvent({
    actorId: actorUserId,
    action: 'REPORT_EXPORTED',
    entityType: 'AnalyticsReport',
    entityId: reportType,
    metadata: { reportType, timestamp },
  });

  return csvContent;
}
