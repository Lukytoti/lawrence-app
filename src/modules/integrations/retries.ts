import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';

export const RETRY_SCHEDULE_SECONDS = [0, 30, 120, 600, 1800];

export function calculateNextRetryDelay(attemptCount: number): number {
  const index = Math.min(attemptCount, RETRY_SCHEDULE_SECONDS.length - 1);
  const baseSeconds = RETRY_SCHEDULE_SECONDS[index];
  // Add ±10% jitter to prevent thundering herd
  const jitter = baseSeconds * 0.1 * (Math.random() * 2 - 1);
  return Math.round(baseSeconds + jitter);
}

export function isErrorRetryable(error: any): boolean {
  if (!error) return true;
  const msg = typeof error === 'string' ? error : error.message || '';
  if (msg.includes('401') || msg.includes('403') || msg.includes('SSRF') || msg.includes('Invalid signature')) {
    return false; // Authentication/security errors are non-retryable
  }
  return true;
}

export async function scheduleJobRetry(jobId: string, error: string) {
  const job = await db.integrationJob.findUnique({
    where: { id: jobId },
  });
  if (!job) throw new Error('Job not found');

  const newAttemptCount = job.attemptCount + 1;
  const retryable = isErrorRetryable(error);

  if (newAttemptCount >= job.maxAttempts || !retryable) {
    // Transition to DEAD_LETTER
    const deadJob = await db.integrationJob.update({
      where: { id: jobId },
      data: {
        status: 'DEAD_LETTER',
        error: `Dead-letter transition: ${error}`,
        attemptCount: newAttemptCount,
      },
    });

    eventBus.publish('IntegrationDeadLetterCreated', {
      jobId: job.id,
      integrationId: job.integrationId,
      error,
    });

    return deadJob;
  }

  const delaySeconds = calculateNextRetryDelay(newAttemptCount);
  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

  return db.integrationJob.update({
    where: { id: jobId },
    data: {
      status: 'RETRYING',
      attemptCount: newAttemptCount,
      nextRetryAt,
      error,
    },
  });
}
