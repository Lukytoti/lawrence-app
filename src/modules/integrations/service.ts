import { db } from '@/lib/db';
import {
  RegisterIntegrationInput,
  CreateConnectionInput,
  RegisterEndpointInput,
  RegisterWebhookInput,
  CreateMappingInput,
  IntegrationDashboardDto,
} from './types';
import { storeCredential, retrieveCredential } from './credentials';
import { GenericHttpProviderAdapter } from './providers/generic-http';
import { eventBus } from '@/lib/events';

export async function registerIntegration(input: RegisterIntegrationInput, actorUserId?: string) {
  const existing = await db.integration.findUnique({
    where: { integrationCode: input.integrationCode },
  });
  if (existing) {
    throw new Error(`Integration with code ${input.integrationCode} already exists`);
  }

  const integration = await db.integration.create({
    data: {
      integrationCode: input.integrationCode,
      name: input.name,
      description: input.description,
      provider: input.provider,
      category: input.category,
      version: input.version || '1.0.0',
      documentationUrl: input.documentationUrl,
      createdById: actorUserId,
    },
  });

  return integration;
}

export async function createConnection(input: CreateConnectionInput, actorUserId?: string) {
  const integration = await db.integration.findUnique({
    where: { id: input.integrationId },
  });
  if (!integration) throw new Error('Integration not found');

  const credentialRef = storeCredential(input.credentials);

  const connection = await db.integrationConnection.create({
    data: {
      integrationId: input.integrationId,
      connectionCode: input.connectionCode,
      name: input.name,
      environment: input.environment || 'PRODUCTION',
      authType: input.authType,
      credentialReference: credentialRef,
      configurationJson: input.configuration ? JSON.stringify(input.configuration) : null,
      createdById: actorUserId,
    },
  });

  return connection;
}

export async function testConnection(connectionId: string) {
  const conn = await db.integrationConnection.findUnique({
    where: { id: connectionId },
    include: { integration: true },
  });
  if (!conn) throw new Error('Connection not found');

  const creds = retrieveCredential(conn.credentialReference);
  const adapter = new GenericHttpProviderAdapter();
  const testRes = await adapter.testConnection(creds || {});

  const now = new Date();
  if (testRes.success) {
    await db.integrationConnection.update({
      where: { id: connectionId },
      data: {
        lastTestedAt: now,
        lastSuccessfulAt: now,
        status: 'ACTIVE',
        failureReason: null,
      },
    });

    await db.integrationHealth.create({
      data: {
        integrationId: conn.integrationId,
        connectionId: conn.id,
        status: 'HEALTHY',
        latencyMs: testRes.latencyMs || 10,
        successRate: 100.0,
        errorRate: 0.0,
      },
    });
  } else {
    await db.integrationConnection.update({
      where: { id: connectionId },
      data: {
        lastTestedAt: now,
        lastFailureAt: now,
        status: 'ERROR',
        failureReason: testRes.error || 'Connection failed',
      },
    });

    await db.integrationHealth.create({
      data: {
        integrationId: conn.integrationId,
        connectionId: conn.id,
        status: 'UNAVAILABLE',
        errorRate: 100.0,
        detailsJson: JSON.stringify({ error: testRes.error }),
      },
    });

    eventBus.publish('IntegrationConnectionFailed', {
      connectionId: conn.id,
      connectionCode: conn.connectionCode,
      error: testRes.error,
    });
  }

  return testRes;
}

export async function registerEndpoint(input: RegisterEndpointInput) {
  return db.integrationEndpoint.create({
    data: {
      integrationId: input.integrationId,
      name: input.name,
      method: input.method,
      path: input.path,
      purpose: input.purpose,
      direction: input.direction,
      timeoutMs: input.timeoutMs || 30000,
      retryPolicyJson: input.retryPolicy ? JSON.stringify(input.retryPolicy) : null,
    },
  });
}

export async function registerWebhook(input: RegisterWebhookInput) {
  const secretRef = storeCredential({ secret: input.secret });
  return db.integrationWebhook.create({
    data: {
      integrationId: input.integrationId,
      webhookCode: input.webhookCode,
      name: input.name,
      endpointPath: input.endpointPath,
      secretReference: secretRef,
      signatureAlgorithm: input.signatureAlgorithm || 'HMAC_SHA256',
      eventType: input.eventType,
    },
  });
}

export async function createMapping(input: CreateMappingInput, actorUserId?: string) {
  return db.integrationMapping.create({
    data: {
      integrationId: input.integrationId,
      mappingCode: input.mappingCode,
      sourceSystem: input.sourceSystem,
      targetSystem: input.targetSystem,
      sourceEntity: input.sourceEntity,
      targetEntity: input.targetEntity,
      mappingJson: JSON.stringify(input.fieldMappings),
      createdById: actorUserId,
    },
  });
}

export async function getIntegrationDashboard(): Promise<IntegrationDashboardDto> {
  const [
    totalIntegrations,
    activeIntegrationsCount,
    activeConnectionsCount,
    pendingJobsCount,
    deadLetterEventsCount,
    recentLogs,
    activeHealths,
  ] = await Promise.all([
    db.integration.count(),
    db.integration.count({ where: { status: 'ACTIVE' } }),
    db.integrationConnection.count({ where: { status: 'ACTIVE' } }),
    db.integrationJob.count({ where: { status: 'PENDING' } }),
    db.integrationEvent.count({ where: { status: 'DEAD_LETTER' } }),
    db.integrationLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    db.integrationHealth.findMany({ take: 5, orderBy: { lastCheckedAt: 'desc' } }),
  ]);

  return {
    totalIntegrations,
    activeIntegrationsCount,
    activeConnectionsCount,
    pendingJobsCount,
    deadLetterEventsCount,
    overallHealthStatus: deadLetterEventsCount > 0 ? 'DEGRADED' : 'HEALTHY',
    recentLogs,
    activeHealths,
  };
}
