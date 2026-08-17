import { db } from '@/lib/db';
import { CreateSecurityEventInput } from './types';
import { eventBus } from '@/lib/events';
import crypto from 'crypto';

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /authorization/i,
  /bearer/i,
  /cvv/i,
  /creditcard/i,
  /cardnumber/i,
  /privatekey/i,
  /private_key/i,
  /ssn/i,
  /pin/i,
];

/**
 * Deeply sanitizes sensitive data from metadata payloads.
 */
export function sanitizeGovernanceMetadata(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    // Scrub JWT tokens
    let sanitized = data.replace(/bearer\s+[a-zA-Z0-9\._\-]+/gi, 'Bearer [REDACTED]');
    // Scrub credit card numbers (13-19 digits)
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARD_REDACTED]');
    return sanitized;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeGovernanceMetadata(item));
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const isKeySensitive = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
      if (isKeySensitive) {
        cleanObj[key] = '[REDACTED]';
      } else {
        cleanObj[key] = sanitizeGovernanceMetadata(val);
      }
    }
    return cleanObj;
  }
  return data;
}

export async function recordSecurityEvent(input: CreateSecurityEventInput) {
  const correlationId = input.correlationId || `SEC-CORR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const sanitizedMetadata = input.metadata ? sanitizeGovernanceMetadata(input.metadata) : null;
  const count = await db.platformSecurityEvent.count();
  const eventCode = `SECEVT-2026-${(100001 + count).toString().padStart(6, '0')}-${crypto.randomBytes(2).toString('hex')}`;

  const securityEvent = await db.platformSecurityEvent.create({
    data: {
      eventCode,
      eventType: input.eventType,
      severity: input.severity,
      source: input.source,
      actorId: input.actorId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
      result: input.result,
      metadataJson: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
      correlationId,
    },
  });

  eventBus.publish('SecurityEventRecorded', {
    eventId: securityEvent.id,
    eventCode: securityEvent.eventCode,
    eventType: securityEvent.eventType,
    severity: securityEvent.severity,
    actorId: securityEvent.actorId,
    correlationId: securityEvent.correlationId,
  });

  return securityEvent;
}
