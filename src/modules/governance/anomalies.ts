import { db } from '@/lib/db';
import { recordSecurityEvent } from './security-events';
import { createSecurityIncident } from './incidents';
import { createSecurityRisk } from './risks';
import { eventBus } from '@/lib/events';

export async function detectAuthAnomalies(actorUserId?: string, ipAddress?: string) {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 mins window
  const failedLogins = await db.platformSecurityEvent.count({
    where: {
      eventType: 'AUTH_FAILURE',
      createdAt: { gte: windowStart },
      ...(actorUserId ? { actorId: actorUserId } : {}),
    },
  });

  if (failedLogins >= 5) {
    const anomalyEvent = await recordSecurityEvent({
      eventType: 'ANOMALY_DETECTED',
      severity: 'HIGH',
      source: 'ANOMALY_ENGINE',
      actorId: actorUserId,
      ipAddress,
      action: 'DETECT_AUTH_BURST',
      result: 'BLOCKED',
      metadata: { failedLoginsCount: failedLogins, windowMinutes: 15 },
    });

    eventBus.publish('AnomalyDetected', {
      anomalyType: 'AUTH_BURST',
      actorId: actorUserId,
      severity: 'HIGH',
    });

    if (failedLogins >= 10) {
      await createSecurityIncident({
        title: `Brute-force authentication anomaly detected for actor ${actorUserId || ipAddress || 'Unknown'}`,
        description: `${failedLogins} failed authentication attempts recorded in 15 minutes.`,
        severity: 'HIGH',
        category: 'AUTHENTICATION_ANOMALY',
      });
    }

    return { anomalyDetected: true, failedLoginsCount: failedLogins, event: anomalyEvent };
  }

  return { anomalyDetected: false, failedLoginsCount: failedLogins };
}

export async function detectExportBurstAnomalies(actorUserId: string, exportCount: number) {
  if (exportCount >= 20) {
    const risk = await createSecurityRisk({
      title: `Excessive Bulk Data Export Anomaly (${actorUserId})`,
      description: `Actor executed ${exportCount} export operations within a short window.`,
      category: 'DATA_EXFILTRATION_RISK',
      severity: 'HIGH',
      likelihood: 4,
      impact: 4,
      ownerId: actorUserId,
    });

    eventBus.publish('AnomalyDetected', {
      anomalyType: 'EXPORT_BURST',
      actorId: actorUserId,
      severity: 'HIGH',
    });

    return { anomalyDetected: true, riskId: risk.id };
  }

  return { anomalyDetected: false };
}
