import { executeAiPrompt } from '@/modules/ai/copilot';
import { PromptExecutionResult } from '@/modules/ai/types';

export async function processAiCommand(
  prompt: string,
  actorUserId: string,
  conversationId?: string
): Promise<PromptExecutionResult> {
  // Delegate directly to Prompt 15 Executive AI Co-Pilot Engine
  return executeAiPrompt(
    {
      prompt,
      conversationId,
      contextDomain: 'GENERAL',
    },
    actorUserId
  );
}
