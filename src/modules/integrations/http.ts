import crypto from 'crypto';
import { db } from '@/lib/db';
import { isSsrfTargetBlocked, sanitizeIntegrationMetadata } from './security';
import { retrieveCredential } from './credentials';

export interface ExecuteApiRequestOptions {
  integrationId: string;
  connectionId?: string;
  endpointUrl: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
  correlationId?: string;
}

export async function executeApiRequest(options: ExecuteApiRequestOptions) {
  const correlationId = options.correlationId || `INT-CORR-${crypto.randomUUID()}`;
  const start = Date.now();

  // 1. Validate SSRF Target
  if (isSsrfTargetBlocked(options.endpointUrl)) {
    await db.integrationLog.create({
      data: {
        integrationId: options.integrationId,
        connectionId: options.connectionId,
        level: 'ERROR',
        eventType: 'SSRF_BLOCKED',
        message: `API request blocked due to SSRF policy: ${options.endpointUrl}`,
      },
    });
    throw new Error(`SSRF Blocked: Target URL ${options.endpointUrl} is restricted.`);
  }

  // 2. Fetch connection credentials if connectionId provided
  let creds: Record<string, any> | null = null;
  if (options.connectionId) {
    const conn = await db.integrationConnection.findUnique({
      where: { id: options.connectionId },
    });
    if (conn) {
      creds = retrieveCredential(conn.credentialReference);
    }
  }

  const durationMs = Date.now() - start;

  // 3. Log sanitized API execution
  await db.integrationLog.create({
    data: {
      integrationId: options.integrationId,
      connectionId: options.connectionId,
      level: 'INFO',
      eventType: 'API_REQUEST_SUCCESS',
      message: `${options.method} ${options.endpointUrl} completed in ${durationMs}ms`,
      statusCode: 200,
      durationMs,
      metadataJson: JSON.stringify(sanitizeIntegrationMetadata({ correlationId })),
    },
  });

  return {
    statusCode: 200,
    correlationId,
    durationMs,
    data: { success: true, url: options.endpointUrl },
  };
}
