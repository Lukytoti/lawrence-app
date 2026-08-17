import { db } from '@/lib/db';
import { ExecuteWorkflowInput, StepExecutionResult, ExecutionStatus } from './types';
import { evaluateConditionGroup } from './conditions';
import { sanitizeMetadata } from './sanitizer';
import { createOpportunity } from '@/modules/crm/service';
import { createRiskSignal } from '@/modules/retention/signals';
import { createRetentionCase } from '@/modules/retention/cases';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

export async function executeWorkflow(input: ExecuteWorkflowInput) {
  const { workflowId, idempotencyKey, contextPayload = {}, actorUserId = 'SYSTEM' } = input;

  // 1. Check idempotency: If execution already exists for idempotencyKey, return existing execution
  const existingExecution = await db.automationExecution.findUnique({
    where: { idempotencyKey },
    include: { stepExecutions: true },
  });

  if (existingExecution) {
    return { execution: existingExecution, newlyCreated: false };
  }

  try {
    // 2. Fetch workflow inside transaction with locking
    return await db.$transaction(async (tx) => {
      // Advisory lock for PostgreSQL concurrency safety on idempotencyKey
      try {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;
      } catch (err) {
        // Fallback for non-PostgreSQL (SQLite/Dev)
      }

      // Re-check inside transaction with lock held
      const existingTx = await tx.automationExecution.findUnique({
        where: { idempotencyKey },
        include: { stepExecutions: true },
      });
      if (existingTx) {
        return { execution: existingTx, newlyCreated: false };
      }

      const workflow = await tx.automationWorkflow.findUnique({
        where: { id: workflowId },
        include: { steps: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
      });

  if (!workflow) throw new Error(`AutomationWorkflow ${workflowId} not found.`);
  if (!workflow.isActive) {
    throw new Error(`AutomationWorkflow ${workflow.workflowCode} is inactive.`);
  }

    const execution = await tx.automationExecution.create({
      data: {
        workflowId: workflow.id,
        workflowVersion: workflow.version,
        triggerType: input.triggerType,
        triggerEvent: input.triggerEvent,
        correlationId: input.correlationId,
        idempotencyKey,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    await tx.automationExecutionLog.create({
      data: {
        executionId: execution.id,
        eventType: 'INFO',
        message: `Workflow execution started for ${workflow.name} (${workflow.workflowCode})`,
        metadataJson: JSON.stringify({ triggerType: input.triggerType, triggerEvent: input.triggerEvent }),
      },
    });

    const stepResults: StepExecutionResult[] = [];
    let executionStatus: ExecutionStatus = 'COMPLETED';
    let errorMessage: string | undefined = undefined;

    // Execute steps sequentially
    for (const step of workflow.steps) {
      let config: any = {};
      try {
        config = typeof step.configurationJson === 'string' ? JSON.parse(step.configurationJson) : step.configurationJson;
      } catch (err) {
        config = {};
      }

      const stepExec = await tx.automationStepExecution.create({
        data: {
          executionId: execution.id,
          stepId: step.id,
          sequence: step.sequence,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      try {
        let stepOutput: any = null;

        if (step.type === 'CONDITION') {
          const pass = evaluateConditionGroup(config, contextPayload);
          stepOutput = { conditionPassed: pass };
          if (!pass) {
            // Condition failed: Skip remaining steps
            await tx.automationStepExecution.update({
              where: { id: stepExec.id },
              data: { status: 'SKIPPED', outputJson: JSON.stringify(stepOutput), completedAt: new Date() },
            });
            break;
          }
        } else if (step.type === 'TASK') {
          // Cross-Domain Integration: Prompt 04 Task
          if (config.assigneeUserId && config.title) {
            const member = await tx.networkMember.findFirst({ where: { userId: config.assigneeUserId } });
            if (member) {
              const createdTask = await tx.task.create({
                data: {
                  assigneeId: member.id,
                  assignedBy: actorUserId,
                  title: config.title,
                  description: config.description || 'Automated task created by workflow',
                  priority: config.priority || 'MEDIUM',
                  status: 'TODO',
                  dueDate: config.dueDate ? new Date(config.dueDate) : new Date(Date.now() + 86400000 * 3),
                },
              });
              stepOutput = { taskId: createdTask.id, title: createdTask.title };
            }
          }
        } else if (step.type === 'CRM_ACTION') {
          // Cross-Domain Integration: Prompt 06 CRM Opportunity
          if (config.leadId && config.title) {
            const opp = await createOpportunity({
              leadId: config.leadId,
              businessDomain: config.businessDomain || 'DIGITAL_MARKETING',
              title: config.title,
              value: Number(config.value) || 0,
              ownerId: actorUserId,
            });
            stepOutput = { crmOpportunityId: opp.id, title: opp.title };
          }
        } else if (step.type === 'RETENTION_ACTION') {
          // Cross-Domain Integration: Prompt 12 Risk Signal & Case
          if (config.clientId) {
            const signal = await createRiskSignal({
              clientId: config.clientId,
              signalType: config.signalType || 'AUTOMATION_TRIGGERED',
              severity: config.severity || 'MEDIUM',
              description: config.description || 'Automated retention risk signal',
              sourceDomain: config.sourceDomain || 'ENGAGEMENT',
            });

            if (config.createCase) {
              const retentionCase = await createRetentionCase(
                {
                  clientId: config.clientId,
                  severity: config.severity || 'MEDIUM',
                  reason: config.description || 'Automated retention case',
                  assignedOwnerId: config.assignedOwnerId,
                },
                actorUserId
              );
              stepOutput = { signalId: signal.id, retentionCaseId: retentionCase.id };
            } else {
              stepOutput = { signalId: signal.id };
            }
          }
        } else if (step.type === 'NOTIFICATION') {
          // Cross-Domain Integration: In-App Notification
          if (config.userId && config.message) {
            await tx.notification.create({
              data: {
                userId: config.userId,
                type: config.notificationType || 'WORKFLOW_ALERT',
                title: config.title || 'Workflow Notification',
                message: config.message,
              },
            });
            stepOutput = { notifiedUserId: config.userId };
          }
        } else if (step.type === 'DELAY') {
          stepOutput = { delayMs: config.delayMs || 0 };
        } else {
          stepOutput = { executedStepType: step.type };
        }

        await tx.automationStepExecution.update({
          where: { id: stepExec.id },
          data: { status: 'COMPLETED', outputJson: JSON.stringify(sanitizeMetadata(stepOutput)), completedAt: new Date() },
        });

        stepResults.push({ stepId: step.id, sequence: step.sequence, status: 'COMPLETED', output: stepOutput });
      } catch (err: any) {
        errorMessage = err.message || 'Step execution failed';
        executionStatus = 'FAILED';

        await tx.automationStepExecution.update({
          where: { id: stepExec.id },
          data: { status: 'FAILED', error: errorMessage, completedAt: new Date() },
        });

        stepResults.push({ stepId: step.id, sequence: step.sequence, status: 'FAILED', error: errorMessage });
        break; // Stop remaining steps on step failure
      }
    }

    // Finalize execution
    const finalExecution = await tx.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: executionStatus,
        completedAt: new Date(),
        error: errorMessage,
      },
      include: { stepExecutions: true },
    });

    await tx.automationExecutionLog.create({
      data: {
        executionId: execution.id,
        eventType: executionStatus === 'COMPLETED' ? 'INFO' : 'ERROR',
        message: `Workflow ${workflow.workflowCode} finished with status ${executionStatus}`,
        metadataJson: JSON.stringify({ error: errorMessage }),
      },
    });

    await logAuditEvent({
      actorId: actorUserId,
      action: executionStatus === 'COMPLETED' ? 'AUTOMATION_EXECUTION_COMPLETED' : 'AUTOMATION_EXECUTION_FAILED',
      entityType: 'AutomationExecution',
      entityId: execution.id,
      metadata: { workflowCode: workflow.workflowCode, status: executionStatus },
    });

    await eventBus.publish(
      executionStatus === 'COMPLETED' ? 'AutomationCompleted' : 'AutomationFailed',
      { executionId: execution.id, workflowId: workflow.id, status: executionStatus },
      actorUserId
    );

    return { execution: finalExecution, newlyCreated: true };
  });
  } catch (err: any) {
    if (err.code === 'P2002' || (err.message && err.message.toLowerCase().includes('idempotency'))) {
      const existing = await db.automationExecution.findUnique({
        where: { idempotencyKey },
        include: { stepExecutions: true },
      });
      if (existing) {
        return { execution: existing, newlyCreated: false };
      }
    }
    throw err;
  }
}
