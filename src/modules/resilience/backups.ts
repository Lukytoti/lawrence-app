import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { CreateBackupPlanInput, BackupStatus, VerificationStatus } from './types';
import { generateCorrelationId, generateEventCode, sanitizeErrorMessage, sanitizeForAudit } from './security';
import crypto from 'crypto';

/**
 * Create a new backup plan.
 */
export async function createBackupPlan(input: CreateBackupPlanInput) {
  return db.backupPlan.create({
    data: {
      planCode: input.planCode,
      name: input.name,
      description: input.description,
      backupType: input.backupType,
      frequency: input.frequency,
      retentionDays: input.retentionDays ?? 30,
      storageReference: input.storageReference,
      encryptionRequired: input.encryptionRequired ?? true,
      verificationRequired: input.verificationRequired ?? true,
    },
  });
}

/**
 * Update a backup plan.
 */
export async function updateBackupPlan(id: string, data: Partial<CreateBackupPlanInput>) {
  // Remove planCode from updatable fields
  const { planCode, ...updateData } = data;
  return db.backupPlan.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Activate a backup plan.
 */
export async function activateBackupPlan(id: string) {
  return db.backupPlan.update({
    where: { id },
    data: { isActive: true },
  });
}

/**
 * Pause (deactivate) a backup plan.
 */
export async function pauseBackupPlan(id: string) {
  return db.backupPlan.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Execute a backup for a given plan.
 * Creates a BackupExecution record and simulates the backup process.
 * The distinction between "backup created" and "backup successfully verified" is enforced.
 */
export async function executeBackup(backupPlanId: string, correlationId?: string) {
  const plan = await db.backupPlan.findUnique({ where: { id: backupPlanId } });
  if (!plan) throw new Error(`Backup plan not found: ${backupPlanId}`);
  if (!plan.isActive) throw new Error(`Backup plan is not active: ${plan.planCode}`);

  const corrId = correlationId || generateCorrelationId();
  const executionCode = `BKP_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

  const execution = await db.backupExecution.create({
    data: {
      executionCode,
      backupPlanId,
      status: 'RUNNING',
      correlationId: corrId,
      verificationStatus: plan.verificationRequired ? 'PENDING' : 'NOT_REQUIRED',
    },
  });

  // Write audit log
  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('BACKUP_STARTED'),
      backupExecutionId: execution.id,
      eventType: 'BACKUP_STARTED',
      message: `Backup execution started for plan ${plan.planCode}`,
      correlationId: corrId,
      metadataJson: JSON.stringify(sanitizeForAudit({ planCode: plan.planCode, backupType: plan.backupType })),
    },
  });

  try {
    // Simulate backup completion with checksum
    const checksum = crypto.createHash('sha256').update(`${executionCode}-${Date.now()}`).digest('hex');
    const sizeBytes = BigInt(Math.floor(Math.random() * 1000000000) + 1000);

    const completed = await db.backupExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sizeBytes,
        checksum,
        storageReference: plan.storageReference ? `${plan.storageReference}/${executionCode}` : undefined,
      },
    });

    await db.backupPlan.update({
      where: { id: backupPlanId },
      data: { lastSuccessfulBackupAt: new Date() },
    });

    await db.recoveryAuditLog.create({
      data: {
        eventCode: generateEventCode('BACKUP_COMPLETED'),
        backupExecutionId: execution.id,
        eventType: 'BACKUP_COMPLETED',
        message: `Backup execution completed for plan ${plan.planCode}`,
        correlationId: corrId,
        metadataJson: JSON.stringify({ checksum, sizeBytes: sizeBytes.toString() }),
      },
    });

    await eventBus.publish('BackupCompleted', {
      executionId: execution.id,
      planCode: plan.planCode,
      backupType: plan.backupType,
      checksum,
    });

    return completed;
  } catch (error) {
    const errMsg = sanitizeErrorMessage(error);
    await db.backupExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', errorMessage: errMsg, completedAt: new Date() },
    });

    await db.backupPlan.update({
      where: { id: backupPlanId },
      data: { lastFailedBackupAt: new Date() },
    });

    await eventBus.publish('BackupFailed', {
      executionId: execution.id,
      planCode: plan.planCode,
      error: errMsg,
    });

    throw error;
  }
}

/**
 * Verify a backup execution.
 * A backup that cannot be verified MUST NOT be reported as fully recoverable.
 */
export async function verifyBackup(executionId: string): Promise<{ verified: boolean; checksum: string | null }> {
  const execution = await db.backupExecution.findUnique({ where: { id: executionId } });
  if (!execution) throw new Error(`Backup execution not found: ${executionId}`);
  if (execution.status !== 'COMPLETED') throw new Error(`Cannot verify backup in status: ${execution.status}`);

  // Verification checks: checksum, size, metadata
  const checksumValid = !!execution.checksum && execution.checksum.length === 64;
  const sizeValid = execution.sizeBytes !== null && execution.sizeBytes > 0n;
  const metadataValid = true; // Metadata validation placeholder

  const verified = checksumValid && sizeValid && metadataValid;

  await db.backupExecution.update({
    where: { id: executionId },
    data: { verificationStatus: verified ? 'VERIFIED' : 'FAILED' },
  });

  if (!verified) {
    await eventBus.publish('BackupVerificationFailed', {
      executionId,
      executionCode: execution.executionCode,
      reason: !checksumValid ? 'Invalid checksum' : !sizeValid ? 'Invalid size' : 'Metadata invalid',
    });
  }

  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('BACKUP_VERIFIED'),
      backupExecutionId: executionId,
      eventType: verified ? 'BACKUP_VERIFIED' : 'BACKUP_VERIFICATION_FAILED',
      message: verified
        ? `Backup ${execution.executionCode} verified successfully`
        : `Backup ${execution.executionCode} verification failed`,
      correlationId: execution.correlationId,
    },
  });

  return { verified, checksum: execution.checksum };
}

/**
 * List backup executions with pagination.
 */
export async function listBackups(options: {
  backupPlanId?: string;
  status?: BackupStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const where: any = {};
  if (options.backupPlanId) where.backupPlanId = options.backupPlanId;
  if (options.status) where.status = options.status;

  const [items, total] = await Promise.all([
    db.backupExecution.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { backupPlan: true },
    }),
    db.backupExecution.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Get backup health summary.
 */
export async function getBackupHealth() {
  const [totalPlans, activePlans, recentExecutions] = await Promise.all([
    db.backupPlan.count(),
    db.backupPlan.count({ where: { isActive: true } }),
    db.backupExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: { backupPlan: true },
    }),
  ]);

  const completedCount = recentExecutions.filter(e => e.status === 'COMPLETED').length;
  const verifiedCount = recentExecutions.filter(e => e.verificationStatus === 'VERIFIED').length;
  const failedCount = recentExecutions.filter(e => e.status === 'FAILED').length;

  return {
    totalPlans,
    activePlans,
    recentExecutions,
    successRate: recentExecutions.length > 0 ? completedCount / recentExecutions.length : 0,
    verificationRate: recentExecutions.length > 0 ? verifiedCount / recentExecutions.length : 0,
    failureRate: recentExecutions.length > 0 ? failedCount / recentExecutions.length : 0,
  };
}

/**
 * Check backup retention and flag expired executions.
 */
export async function checkBackupRetention() {
  const plans = await db.backupPlan.findMany({ where: { isActive: true } });
  const expired: string[] = [];

  for (const plan of plans) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - plan.retentionDays);

    const expiredExecutions = await db.backupExecution.findMany({
      where: {
        backupPlanId: plan.id,
        status: 'COMPLETED',
        startedAt: { lt: cutoff },
      },
    });

    expired.push(...expiredExecutions.map(e => e.id));
  }

  return { expiredCount: expired.length, expiredIds: expired };
}
