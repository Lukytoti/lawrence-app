import { db } from '@/lib/db';
import { CreateContinuityPlanInput, CreateContinuityProcedureInput, ContinuityPlanStatus } from './types';
import { generateCorrelationId, generateEventCode, sanitizeForAudit } from './security';

/**
 * Create a new business continuity plan.
 */
export async function createContinuityPlan(input: CreateContinuityPlanInput) {
  return db.continuityPlan.create({
    data: {
      planCode: input.planCode,
      name: input.name,
      description: input.description,
      businessFunction: input.businessFunction,
      criticality: input.criticality,
      minimumOperatingLevel: input.minimumOperatingLevel,
      maximumTolerableDowntimeMinutes: input.maximumTolerableDowntimeMinutes,
      ownerId: input.ownerId,
      status: 'DRAFT',
    },
  });
}

/**
 * Update an existing business continuity plan.
 */
export async function updateContinuityPlan(id: string, data: Partial<CreateContinuityPlanInput>) {
  const { planCode, ...updateData } = data;
  return db.continuityPlan.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Activate a business continuity plan.
 */
export async function activateContinuityPlan(id: string) {
  const plan = await db.continuityPlan.findUnique({ where: { id } });
  if (!plan) throw new Error(`Continuity plan not found: ${id}`);
  return db.continuityPlan.update({
    where: { id },
    data: { status: 'ACTIVE' },
  });
}

/**
 * Review a business continuity plan.
 */
export async function reviewContinuityPlan(id: string, reviewerId?: string) {
  const plan = await db.continuityPlan.findUnique({ where: { id } });
  if (!plan) throw new Error(`Continuity plan not found: ${id}`);

  const reviewed = await db.continuityPlan.update({
    where: { id },
    data: {
      lastReviewedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('CONTINUITY_REVIEWED'),
      eventType: 'CONTINUITY_REVIEWED',
      message: `Continuity plan ${plan.planCode} reviewed successfully`,
      metadataJson: JSON.stringify(sanitizeForAudit({ planCode: plan.planCode, reviewerId })),
    },
  });

  return reviewed;
}

/**
 * Retire a business continuity plan.
 */
export async function retireContinuityPlan(id: string) {
  return db.continuityPlan.update({
    where: { id },
    data: { status: 'RETIRED' },
  });
}

/**
 * Add a procedure to a business continuity plan.
 */
export async function addContinuityProcedure(input: CreateContinuityProcedureInput) {
  return db.continuityProcedure.create({
    data: {
      continuityPlanId: input.continuityPlanId,
      procedureCode: input.procedureCode,
      name: input.name,
      sequence: input.sequence,
      description: input.description,
      responsibleRole: input.responsibleRole,
      dependencyJson: input.dependencyJson,
      fallbackAction: input.fallbackAction,
      isRequired: input.isRequired ?? true,
    },
  });
}

/**
 * List continuity plans with optional status filtering.
 */
export async function listContinuityPlans(options?: { status?: ContinuityPlanStatus }) {
  const where: any = {};
  if (options?.status) where.status = options.status;

  return db.continuityPlan.findMany({
    where,
    include: {
      procedures: { orderBy: { sequence: 'asc' } },
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get continuity plan details by ID.
 */
export async function getContinuityPlan(id: string) {
  return db.continuityPlan.findUnique({
    where: { id },
    include: {
      procedures: { orderBy: { sequence: 'asc' } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}
