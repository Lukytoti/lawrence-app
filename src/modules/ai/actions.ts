'use server';

import { assertAiPermission } from './permissions';
import { executeAiPrompt } from './copilot';
import { generateStrategicAiInsights } from './insights';
import { getAiCoachingPrompts } from './coaching';
import { PromptExecutionInput } from './types';

export async function submitAiPromptAction(
  userId: string,
  input: PromptExecutionInput
) {
  await assertAiPermission(userId, 'ai:chat');
  return await executeAiPrompt(input, userId);
}

export async function triggerAiInsightsAction(userId: string) {
  await assertAiPermission(userId, 'ai:generate_insights');
  return await generateStrategicAiInsights(userId);
}

export async function fetchCoachingPromptsAction(userId: string, category?: any) {
  await assertAiPermission(userId, 'ai:coaching');
  return await getAiCoachingPrompts(category);
}
