'use server';

import { getExecutiveDashboardData, createAnalyticsSnapshot } from './service';
import { generateCsvExport } from './exports';
import { requireAnalyticsRead, requireAnalyticsExport } from './permissions';
import { AnalyticsScopeType } from './types';

export async function fetchExecutiveDashboardAction(
  userId: string,
  scopeType: AnalyticsScopeType = 'GLOBAL',
  scopeId?: string,
  periodId?: string
) {
  await requireAnalyticsRead(userId);
  return await getExecutiveDashboardData(userId, scopeType, scopeId, periodId);
}

export async function exportAnalyticsCsvAction(
  userId: string,
  reportType: string,
  memberIdsScope?: string[]
) {
  await requireAnalyticsExport(userId);
  return await generateCsvExport(reportType, userId, memberIdsScope);
}

export async function generateSnapshotAction(
  userId: string,
  scopeType: AnalyticsScopeType,
  scopeId: string | undefined,
  periodId: string | undefined,
  metricKey: string,
  metricValue: number,
  metricUnit: string,
  metadataObj?: any
) {
  await requireAnalyticsRead(userId);
  return await createAnalyticsSnapshot(scopeType, scopeId, periodId, metricKey, metricValue, metricUnit, metadataObj);
}
