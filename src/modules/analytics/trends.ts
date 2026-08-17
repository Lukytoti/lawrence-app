import { MetricValueWithTrend, MetricUnit } from './types';

/**
 * Calculates current vs previous value difference, percentage change, and trend direction with zero-denominator safety.
 */
export function calculateMetricTrend(
  key: string,
  displayName: string,
  currentValue: number,
  previousValue: number,
  unit: MetricUnit = 'COUNT',
  sourceModule: string = 'Executive Intelligence'
): MetricValueWithTrend {
  const absoluteDifference = Number((currentValue - previousValue).toFixed(2));
  
  let percentageChange = 0;
  if (previousValue > 0) {
    percentageChange = Number(((absoluteDifference / previousValue) * 100).toFixed(2));
  } else if (previousValue === 0 && currentValue > 0) {
    percentageChange = 100;
  } else {
    percentageChange = 0;
  }

  let trendDirection: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
  if (absoluteDifference > 0) trendDirection = 'UP';
  else if (absoluteDifference < 0) trendDirection = 'DOWN';

  return {
    key,
    displayName,
    currentValue,
    previousValue,
    absoluteDifference,
    percentageChange,
    trendDirection,
    unit,
    sourceModule,
  };
}

export function getMonthlyMemberGrowthTrend(currentCount: number, previousCount: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_member_growth',
    'Monthly Member Growth',
    currentCount,
    previousCount,
    'COUNT',
    'Prompt 02 / 02.5'
  );
}

export function getMonthlyQpvTrend(currentQpv: number, previousQpv: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_qpv_trend',
    'Monthly QPV Trend',
    currentQpv,
    previousQpv,
    'COUNT',
    'Prompt 03A / 03B'
  );
}

export function getMonthlyQualificationRateTrend(currentRate: number, previousRate: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_qualification_rate_trend',
    'Qualification Rate Trend',
    currentRate,
    previousRate,
    'PERCENT',
    'Prompt 03A / 03B'
  );
}

export function getMonthlyCompensationTrend(currentAmt: number, previousAmt: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_compensation_trend',
    'Monthly Compensation Trend',
    currentAmt,
    previousAmt,
    'CURRENCY',
    'Prompt 08'
  );
}

export function getMonthlyCrmConversionTrend(currentRate: number, previousRate: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_crm_conversion_trend',
    'CRM Conversion Rate Trend',
    currentRate,
    previousRate,
    'PERCENT',
    'Prompt 06'
  );
}

export function getMonthlyProductivityTrend(currentScore: number, previousScore: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_productivity_trend',
    'Productivity Score Trend',
    currentScore,
    previousScore,
    'SCORE',
    'Prompt 04'
  );
}

export function getMonthlyEngagementTrend(currentScore: number, previousScore: number): MetricValueWithTrend {
  return calculateMetricTrend(
    'monthly_engagement_trend',
    'Engagement Score Trend',
    currentScore,
    previousScore,
    'SCORE',
    'Prompt 07'
  );
}
