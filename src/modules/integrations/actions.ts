'use server';

import { hasIntegrationPermission, INTEGRATION_PERMISSIONS } from './permissions';
import {
  registerIntegration,
  createConnection,
  testConnection,
  registerEndpoint,
  registerWebhook,
  createMapping,
  getIntegrationDashboard,
} from './service';
import { retryDeadLetter, discardDeadLetter } from './dead-letter';
import { sanitizeIntegrationMetadata } from './security';
import { logAuditEvent } from '@/lib/audit';

export async function getIntegrationDashboardAction(actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.READ_OWN);
  if (!allowed) throw new Error('Unauthorized integration dashboard access');
  const dto = await getIntegrationDashboard();
  return sanitizeIntegrationMetadata(dto);
}

export async function registerIntegrationAction(input: any, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.CREATE);
  if (!allowed) throw new Error('Unauthorized integration creation');

  const integration = await registerIntegration(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'REGISTER_INTEGRATION',
    entityType: 'Integration',
    entityId: integration.id,
    metadata: { integrationCode: integration.integrationCode },
  });
  return sanitizeIntegrationMetadata(integration);
}

export async function createConnectionAction(input: any, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_CONNECTIONS);
  if (!allowed) throw new Error('Unauthorized connection creation');

  const conn = await createConnection(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_INTEGRATION_CONNECTION',
    entityType: 'IntegrationConnection',
    entityId: conn.id,
    metadata: { connectionCode: conn.connectionCode },
  });
  return sanitizeIntegrationMetadata(conn);
}

export async function testConnectionAction(connectionId: string, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_CONNECTIONS);
  if (!allowed) throw new Error('Unauthorized connection test');

  const res = await testConnection(connectionId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'TEST_INTEGRATION_CONNECTION',
    entityType: 'IntegrationConnection',
    entityId: connectionId,
    metadata: { success: res.success },
  });
  return res;
}

export async function registerEndpointAction(input: any, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.CREATE);
  if (!allowed) throw new Error('Unauthorized endpoint creation');

  const ep = await registerEndpoint(input);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'REGISTER_INTEGRATION_ENDPOINT',
    entityType: 'IntegrationEndpoint',
    entityId: ep.id,
  });
  return sanitizeIntegrationMetadata(ep);
}

export async function registerWebhookAction(input: any, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_WEBHOOKS);
  if (!allowed) throw new Error('Unauthorized webhook creation');

  const wh = await registerWebhook(input);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'REGISTER_INTEGRATION_WEBHOOK',
    entityType: 'IntegrationWebhook',
    entityId: wh.id,
  });
  return sanitizeIntegrationMetadata(wh);
}

export async function createMappingAction(input: any, actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_MAPPINGS);
  if (!allowed) throw new Error('Unauthorized mapping creation');

  const map = await createMapping(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_INTEGRATION_MAPPING',
    entityType: 'IntegrationMapping',
    entityId: map.id,
  });
  return sanitizeIntegrationMetadata(map);
}

export async function retryDeadLetterAction(id: string, type: 'EVENT' | 'JOB', actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_DEAD_LETTERS);
  if (!allowed) throw new Error('Unauthorized dead-letter retry');

  const res = await retryDeadLetter(id, type);
  await logAuditEvent({
    actorId: actorUserId,
    action: `RETRY_DEAD_LETTER_${type}`,
    entityType: type === 'EVENT' ? 'IntegrationEvent' : 'IntegrationJob',
    entityId: id,
  });
  return sanitizeIntegrationMetadata(res);
}

export async function discardDeadLetterAction(id: string, type: 'EVENT' | 'JOB', actorUserId: string) {
  const allowed = await hasIntegrationPermission(actorUserId, INTEGRATION_PERMISSIONS.MANAGE_DEAD_LETTERS);
  if (!allowed) throw new Error('Unauthorized dead-letter discard');

  const res = await discardDeadLetter(id, type);
  await logAuditEvent({
    actorId: actorUserId,
    action: `DISCARD_DEAD_LETTER_${type}`,
    entityType: type === 'EVENT' ? 'IntegrationEvent' : 'IntegrationJob',
    entityId: id,
  });
  return sanitizeIntegrationMetadata(res);
}
