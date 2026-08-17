import { db } from '@/lib/db';
import { RiskSignalSourceDomain, RiskSignalStatus } from './types';

export async function createRiskSignal(input: {
  clientId: string;
  signalType: string;
  severity?: string;
  description: string;
  sourceDomain: RiskSignalSourceDomain;
}) {
  return db.clientRiskSignal.create({
    data: {
      clientId: input.clientId,
      signalType: input.signalType,
      severity: input.severity || 'MEDIUM',
      description: input.description,
      sourceDomain: input.sourceDomain,
      status: 'ACTIVE',
    },
  });
}

export async function resolveRiskSignal(signalId: string, status: RiskSignalStatus = 'RESOLVED') {
  return db.clientRiskSignal.update({
    where: { id: signalId },
    data: {
      status,
      resolvedAt: new Date(),
    },
  });
}

export async function detectActiveRiskSignals(clientId: string) {
  const activeSignals = await db.clientRiskSignal.findMany({
    where: { clientId, status: 'ACTIVE' },
    orderBy: { detectedAt: 'desc' },
  });

  return activeSignals;
}
