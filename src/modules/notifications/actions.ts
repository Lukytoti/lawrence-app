'use server';

import { createNotificationTemplate, updateNotificationTemplate } from './templates';
import { dispatchNotification } from './dispatcher';
import { createNotificationCampaign, executeNotificationCampaign } from './campaigns';
import { updateUserNotificationPreferences, getUserNotificationPreferences } from './preferences';
import { CreateTemplateInput, DispatchMessageInput, CreateCampaignInput, PreferenceUpdateInput } from './types';
import { assertNotificationPermission } from './permissions';

export async function createTemplateAction(input: CreateTemplateInput, actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:manage_templates');
  return createNotificationTemplate(input, actorUserId);
}

export async function updateTemplateAction(templateId: string, updates: Partial<CreateTemplateInput>, actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:manage_templates');
  return updateNotificationTemplate(templateId, updates, actorUserId);
}

export async function dispatchNotificationAction(input: DispatchMessageInput, actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:send');
  return dispatchNotification(input, actorUserId);
}

export async function createCampaignAction(input: CreateCampaignInput, actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:manage_campaigns');
  return createNotificationCampaign(input, actorUserId);
}

export async function executeCampaignAction(campaignId: string, actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:manage_campaigns');
  return executeNotificationCampaign(campaignId, actorUserId);
}

export async function updatePreferencesAction(userId: string, input: PreferenceUpdateInput, actorUserId: string) {
  if (userId !== actorUserId) {
    await assertNotificationPermission(actorUserId, 'notifications:manage_preferences');
  }
  return updateUserNotificationPreferences(userId, input);
}

export async function getPreferencesAction(userId: string) {
  return getUserNotificationPreferences(userId);
}
