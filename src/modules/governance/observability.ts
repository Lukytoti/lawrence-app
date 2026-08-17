import { db } from '@/lib/db';
import { RecordSystemMetricInput } from './types';

export async function recordSystemMetric(input: RecordSystemMetricInput) {
  return db.systemMetric.create({
    data: {
      metricCode: input.metricCode,
      service: input.service,
      metricType: input.metricType,
      value: input.value,
      unit: input.unit,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export async function getServiceTelemetry(serviceName?: string) {
  const where: any = serviceName ? { service: serviceName } : {};

  const recentMetrics = await db.systemMetric.findMany({
    where,
    take: 50,
    orderBy: { recordedAt: 'desc' },
  });

  const recentErrors = await db.platformSecurityEvent.count({
    where: {
      result: 'FAILURE',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const rateLimitBlocks = await db.rateLimitEvent.count({
    where: {
      blocked: true,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  return {
    recentMetrics,
    recentErrorsCount24h: recentErrors,
    rateLimitBlocksCount24h: rateLimitBlocks,
  };
}
