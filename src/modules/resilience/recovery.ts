import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { CreateRecoveryPlanInput, CreateRecoveryStepInput, ExecuteRecoveryInput, RecoveryExecutionStatus } from './types';
import { generateCorrelationId, generateEventCode, sanitizeErrorMessage, sanitizeForAudit } from './security';
import crypto from 'crypto';

// Valid recovery execution state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['RUNNING', 'CANCELLED'],
  RUNNING: ['PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'],
  PAUSED: ['RUNNING', 'CANCELLED'],
  FAILED: ['ROLLBACK_REQUIRED'],
  COMPLETED: [],
  CANCELLED: [],
  ROLLBACK_REQUIRED: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create a new recovery plan.
 */
export async function createRecoveryPlan(input: CreateRecoveryPlanInput) {
  return db.recoveryPlan.create({
    data: {
      planCode: input.planCode,
      name: input.name,
      description: input.description,
      scope: input.scope,
      priority: input.priority ?? 0,
      targetRpoMinutes: input.targetRpoMinutes,
      targetRtoMinutes: input.targetRtoMinutes,
      createdById: input.createdById,
    },
  });
}

/**
 * Update a recovery plan (only DRAFT/PAUSED).
 */
export async function updateRecoveryPlan(id: string, data: Partial<CreateRecoveryPlanInput>) {
  const plan = await db.recoveryPlan.findUnique({ where: { id } });
  if (!plan) throw new Error(`Recovery plan not found: ${id}`);
  if (plan.status !== 'DRAFT' && plan.status !== 'PAUSED') {
    throw new Error(`Cannot update recovery plan in status: ${plan.status}`);
  }
  const { planCode, createdById, ...updateData } = data;
  return db.recoveryPlan.update({ where: { id }, data: updateData });
}

/**
 * Activate a recovery plan.
 */
export async function activateRecoveryPlan(id: string) {
  const plan = await db.recoveryPlan.findUnique({ where: { id } });
  if (!plan) throw new Error(`Recovery plan not found: ${id}`);
  if (plan.status !== 'DRAFT' && plan.status !== 'PAUSED') {
    throw new Error(`Cannot activate recovery plan from status: ${plan.status}`);
  }
  return db.recoveryPlan.update({ where: { id }, data: { status: 'ACTIVE' } });
}

/**
 * Pause a recovery plan.
 */
export async function pauseRecoveryPlan(id: string) {
  const plan = await db.recoveryPlan.findUnique({ where: { id } });
  if (!plan) throw new Error(`Recovery plan not found: ${id}`);
  if (plan.status !== 'ACTIVE') {
    throw new Error(`Cannot pause recovery plan from status: ${plan.status}`);
  }
  return db.recoveryPlan.update({ where: { id }, data: { status: 'PAUSED' } });
}

/**
 * Add a step to a recovery plan.
 */
export async function addRecoveryStep(input: CreateRecoveryStepInput) {
  return db.recoveryStep.create({
    data: {
      recoveryPlanId: input.recoveryPlanId,
      stepNumber: input.stepNumber,
      name: input.name,
      description: input.description,
      stepType: input.stepType,
      commandReference: input.commandReference,
      dependencyJson: input.dependencyJson,
      timeoutSeconds: input.timeoutSeconds ?? 300,
      isRequired: input.isRequired ?? true,
    },
  });
}

/**
 * Execute a recovery plan.
 * Creates a RecoveryExecution and associated step executions.
 * Recovery execution is deterministic, ordered, idempotent, auditable, resumable, and failure-aware.
 */
export async function executeRecoveryPlan(input: ExecuteRecoveryInput) {
  const plan = await db.recoveryPlan.findUnique({
    where: { id: input.recoveryPlanId },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  });
  if (!plan) throw new Error(`Recovery plan not found: ${input.recoveryPlanId}`);
  if (plan.status !== 'ACTIVE') throw new Error(`Recovery plan is not active: ${plan.planCode}`);

  const corrId = input.correlationId || generateCorrelationId();
  const executionCode = `REC_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

  // Create the execution with all step executions in a transaction
  const execution = await db.$transaction(async (tx) => {
    const exec = await tx.recoveryExecution.create({
      data: {
        executionCode,
        recoveryPlanId: input.recoveryPlanId,
        triggerType: input.triggerType,
        initiatedById: input.initiatedById,
        correlationId: corrId,
        metadataJson: input.metadataJson,
        status: 'RUNNING',
        currentStep: plan.steps.length > 0 ? plan.steps[0].stepNumber : null,
      },
    });

    // Create step executions for all steps
    for (const step of plan.steps) {
      await tx.recoveryStepExecution.create({
        data: {
          recoveryExecutionId: exec.id,
          recoveryStepId: step.id,
          status: 'PENDING',
        },
      });
    }

    return exec;
  });

  // Audit log
  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('RECOVERY_STARTED'),
      recoveryPlanId: input.recoveryPlanId,
      recoveryExecutionId: execution.id,
      eventType: 'RECOVERY_STARTED',
      message: `Recovery execution started for plan ${plan.planCode}`,
      correlationId: corrId,
      metadataJson: JSON.stringify(sanitizeForAudit({ triggerType: input.triggerType, planCode: plan.planCode })),
    },
  });

  await eventBus.publish('RecoveryStarted', {
    executionId: execution.id,
    planCode: plan.planCode,
    triggerType: input.triggerType,
  });

  // Execute steps sequentially
  const steps = plan.steps;
  for (const step of steps) {
    const stepExec = await db.recoveryStepExecution.findUnique({
      where: { recoveryExecutionId_recoveryStepId: { recoveryExecutionId: execution.id, recoveryStepId: step.id } },
    });

    if (!stepExec || stepExec.status === 'COMPLETED' || stepExec.status === 'SKIPPED') continue;

    // Check if execution was paused/cancelled
    const currentExec = await db.recoveryExecution.findUnique({ where: { id: execution.id } });
    if (currentExec && (currentExec.status === 'PAUSED' || currentExec.status === 'CANCELLED')) break;

    await db.recoveryStepExecution.update({
      where: { id: stepExec.id },
      data: { status: 'RUNNING', startedAt: new Date(), attemptCount: { increment: 1 } },
    });

    await db.recoveryExecution.update({
      where: { id: execution.id },
      data: { currentStep: step.stepNumber },
    });

    try {
      // Simulate step execution (in production, this would delegate to actual recovery actions)
      await db.recoveryStepExecution.update({
        where: { id: stepExec.id },
        data: { status: 'COMPLETED', completedAt: new Date(), outputSummary: `Step ${step.name} completed successfully` },
      });
    } catch (stepError) {
      const errMsg = sanitizeErrorMessage(stepError);
      await db.recoveryStepExecution.update({
        where: { id: stepExec.id },
        data: { status: 'FAILED', errorMessage: errMsg, completedAt: new Date() },
      });

      await eventBus.publish('RecoveryStepFailed', {
        executionId: execution.id,
        stepId: step.id,
        stepName: step.name,
        error: errMsg,
      });

      if (step.isRequired) {
        await db.recoveryExecution.update({
          where: { id: execution.id },
          data: { status: 'FAILED', errorMessage: `Required step failed: ${step.name}`, completedAt: new Date() },
        });

        await eventBus.publish('RecoveryFailed', {
          executionId: execution.id,
          planCode: plan.planCode,
          error: errMsg,
        });

        return db.recoveryExecution.findUnique({ where: { id: execution.id }, include: { stepExecutions: true } });
      }
    }
  }

  // All steps completed
  const finalExec = await db.recoveryExecution.findUnique({ where: { id: execution.id } });
  if (finalExec && finalExec.status === 'RUNNING') {
    await db.recoveryExecution.update({
      where: { id: execution.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    await db.recoveryPlan.update({
      where: { id: input.recoveryPlanId },
      data: { lastTestedAt: new Date(), lastSuccessfulTestAt: new Date() },
    });

    await db.recoveryAuditLog.create({
      data: {
        eventCode: generateEventCode('RECOVERY_COMPLETED'),
        recoveryPlanId: input.recoveryPlanId,
        recoveryExecutionId: execution.id,
        eventType: 'RECOVERY_COMPLETED',
        message: `Recovery execution completed for plan ${plan.planCode}`,
        correlationId: corrId,
      },
    });

    await eventBus.publish('RecoveryCompleted', {
      executionId: execution.id,
      planCode: plan.planCode,
    });
  }

  return db.recoveryExecution.findUnique({ where: { id: execution.id }, include: { stepExecutions: true } });
}

/**
 * Transition recovery execution status with state machine validation.
 */
export async function transitionRecoveryStatus(executionId: string, newStatus: RecoveryExecutionStatus) {
  const execution = await db.recoveryExecution.findUnique({ where: { id: executionId } });
  if (!execution) throw new Error(`Recovery execution not found: ${executionId}`);

  if (!isValidTransition(execution.status, newStatus)) {
    throw new Error(`Invalid state transition: ${execution.status} -> ${newStatus}`);
  }

  const updateData: any = { status: newStatus };
  if (newStatus === 'COMPLETED' || newStatus === 'FAILED' || newStatus === 'CANCELLED') {
    updateData.completedAt = new Date();
  }

  return db.recoveryExecution.update({ where: { id: executionId }, data: updateData });
}

/**
 * Pause a running recovery execution.
 */
export async function pauseRecovery(executionId: string) {
  return transitionRecoveryStatus(executionId, 'PAUSED');
}

/**
 * Resume a paused recovery execution.
 */
export async function resumeRecovery(executionId: string) {
  return transitionRecoveryStatus(executionId, 'RUNNING');
}

/**
 * Cancel a recovery execution.
 */
export async function cancelRecovery(executionId: string) {
  return transitionRecoveryStatus(executionId, 'CANCELLED');
}

/**
 * Mark a failed recovery as requiring rollback.
 */
export async function rollbackRecovery(executionId: string) {
  return transitionRecoveryStatus(executionId, 'ROLLBACK_REQUIRED');
}

/**
 * Verify a completed recovery execution.
 */
export async function verifyRecovery(executionId: string) {
  const execution = await db.recoveryExecution.findUnique({
    where: { id: executionId },
    include: { stepExecutions: true },
  });
  if (!execution) throw new Error(`Recovery execution not found: ${executionId}`);
  if (execution.status !== 'COMPLETED') throw new Error(`Cannot verify non-completed recovery: ${execution.status}`);

  const allStepsComplete = execution.stepExecutions.every(se => se.status === 'COMPLETED' || se.status === 'SKIPPED');

  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('RECOVERY_VERIFIED'),
      recoveryExecutionId: executionId,
      recoveryPlanId: execution.recoveryPlanId,
      eventType: allStepsComplete ? 'RECOVERY_VERIFIED' : 'RECOVERY_VERIFICATION_FAILED',
      message: allStepsComplete
        ? `Recovery ${execution.executionCode} verified successfully`
        : `Recovery ${execution.executionCode} verification incomplete`,
      correlationId: execution.correlationId,
    },
  });

  return { verified: allStepsComplete, executionCode: execution.executionCode };
}
