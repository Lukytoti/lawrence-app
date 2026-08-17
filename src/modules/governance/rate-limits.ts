import { db } from '@/lib/db';
import { RecordRateLimitEventInput } from './types';
import { recordSecurityEvent } from './security-events';

export async function recordRateLimitEvent(input: RecordRateLimitEventInput) {
  const event = await db.rateLimitEvent.create({
    data: {
      key: input.key,
      scope: input.scope,
      endpoint: input.endpoint,
      actorId: input.actorId,
      count: input.count,
      limit: input.limit,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      blocked: input.blocked ?? false,
    },
  });

  if (input.blocked) {
    await recordSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      source: 'RATE_LIMIT_ENGINE',
      actorId: input.actorId,
      action: 'RATE_LIMIT_BLOCK',
      result: 'BLOCKED',
      metadata: { scope: input.scope, endpoint: input.endpoint, count: input.count, limit: input.limit },
    });
  }

  return event;
}

export async function getRateLimitStatus(key: string) {
  return db.rateLimitEvent.findMany({
    where: { key },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
}
