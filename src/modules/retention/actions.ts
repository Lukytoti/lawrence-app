'use server';

import { assertRetentionPermission } from './permissions';
import { calculateClientHealth } from './health';
import { createRetentionCase, updateRetentionCaseStatus } from './cases';
import { createManualRenewal, updateRenewalStatus } from './renewals';
import { createExpansionOpportunity, convertExpansionToCrmOpportunity } from './expansion';
import { createClientTouchpoint } from './touchpoints';
import { createSuccessPlan, updateSuccessPlanStatus } from './plans';
import {
  CreateRetentionCaseInput,
  CreateRenewalInput,
  CreateExpansionOpportunityInput,
  CreateTouchpointInput,
  CreateSuccessPlanInput,
  RetentionCaseStatus,
  RenewalStatus,
  SuccessPlanStatus,
} from './types';

export async function calculateClientHealthAction(actorUserId: string, clientId: string) {
  await assertRetentionPermission(actorUserId, 'retention:manage_health');
  return calculateClientHealth(clientId, actorUserId);
}

export async function createRetentionCaseAction(actorUserId: string, input: CreateRetentionCaseInput) {
  await assertRetentionPermission(actorUserId, 'retention:manage_cases');
  return createRetentionCase(input, actorUserId);
}

export async function updateRetentionCaseStatusAction(
  actorUserId: string,
  caseId: string,
  newStatus: RetentionCaseStatus,
  resolution?: string
) {
  await assertRetentionPermission(actorUserId, 'retention:manage_cases');
  return updateRetentionCaseStatus(caseId, newStatus, resolution, actorUserId);
}

export async function createManualRenewalAction(actorUserId: string, input: CreateRenewalInput) {
  await assertRetentionPermission(actorUserId, 'retention:manage_renewals');
  return createManualRenewal(input, actorUserId);
}

export async function updateRenewalStatusAction(
  actorUserId: string,
  renewalId: string,
  newStatus: RenewalStatus,
  notes?: string
) {
  await assertRetentionPermission(actorUserId, 'retention:manage_renewals');
  return updateRenewalStatus(renewalId, newStatus, notes, actorUserId);
}

export async function createExpansionOpportunityAction(
  actorUserId: string,
  input: CreateExpansionOpportunityInput
) {
  await assertRetentionPermission(actorUserId, 'retention:manage_expansion');
  return createExpansionOpportunity(input, actorUserId);
}

export async function convertExpansionToCrmOpportunityAction(
  actorUserId: string,
  expansionId: string,
  leadId: string
) {
  await assertRetentionPermission(actorUserId, 'retention:manage_expansion');
  return convertExpansionToCrmOpportunity(expansionId, leadId, actorUserId);
}

export async function createClientTouchpointAction(actorUserId: string, input: CreateTouchpointInput) {
  await assertRetentionPermission(actorUserId, 'retention:create');
  return createClientTouchpoint(input, actorUserId);
}

export async function createSuccessPlanAction(actorUserId: string, input: CreateSuccessPlanInput) {
  await assertRetentionPermission(actorUserId, 'retention:manage_success_plans');
  return createSuccessPlan(input, actorUserId);
}

export async function updateSuccessPlanStatusAction(
  actorUserId: string,
  planId: string,
  newStatus: SuccessPlanStatus
) {
  await assertRetentionPermission(actorUserId, 'retention:manage_success_plans');
  return updateSuccessPlanStatus(planId, newStatus, actorUserId);
}
