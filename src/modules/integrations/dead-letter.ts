import { db } from '@/lib/db';

export async function listDeadLetters(limit: number = 50) {
  const [deadEvents, deadJobs] = await Promise.all([
    db.integrationEvent.findMany({
      where: { status: 'DEAD_LETTER' },
      take: limit,
      orderBy: { receivedAt: 'desc' },
      include: { integration: true },
    }),
    db.integrationJob.findMany({
      where: { status: 'DEAD_LETTER' },
      take: limit,
      orderBy: { scheduledAt: 'desc' },
      include: { integration: true },
    }),
  ]);

  return { deadEvents, deadJobs };
}

export async function inspectDeadLetter(id: string, type: 'EVENT' | 'JOB') {
  if (type === 'EVENT') {
    return db.integrationEvent.findUnique({
      where: { id },
      include: { integration: true, connection: true, logs: true },
    });
  } else {
    return db.integrationJob.findUnique({
      where: { id },
      include: { integration: true, connection: true, logs: true },
    });
  }
}

export async function retryDeadLetter(id: string, type: 'EVENT' | 'JOB') {
  if (type === 'EVENT') {
    const event = await db.integrationEvent.findUnique({ where: { id } });
    if (!event) throw new Error('Dead letter event not found');

    return db.integrationEvent.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        error: null,
      },
    });
  } else {
    const job = await db.integrationJob.findUnique({ where: { id } });
    if (!job) throw new Error('Dead letter job not found');

    return db.integrationJob.update({
      where: { id },
      data: {
        status: 'PENDING',
        attemptCount: 0,
        nextRetryAt: new Date(),
        error: null,
      },
    });
  }
}

export async function discardDeadLetter(id: string, type: 'EVENT' | 'JOB') {
  if (type === 'EVENT') {
    return db.integrationEvent.update({
      where: { id },
      data: { status: 'IGNORED' },
    });
  } else {
    return db.integrationJob.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
