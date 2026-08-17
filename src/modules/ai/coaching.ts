import { db } from '@/lib/db';
import { AiCoachingPromptDto, AiCoachingCategory } from './types';

/**
 * Default AI Leadership Coaching Templates
 */
const DEFAULT_COACHING_PROMPTS = [
  {
    promptCode: 'PRM-LEADERSHIP-01',
    category: 'LEADERSHIP',
    title: '1-on-1 Downline Performance Coaching',
    promptTemplate:
      'How can I coach member {{memberName}} who has achieved {{currentPPV}} PPV this month to reach {{targetPPV}} PPV before month end?',
    variablesJson: JSON.stringify(['memberName', 'currentPPV', 'targetPPV']),
  },
  {
    promptCode: 'PRM-RECRUITING-01',
    category: 'RECRUITING',
    title: 'High-Ticket Prospect Conversion Script',
    promptTemplate:
      'Generate a personalized follow-up pitch for CRM lead {{leadName}} interested in {{interestCategory}}.',
    variablesJson: JSON.stringify(['leadName', 'interestCategory']),
  },
  {
    promptCode: 'PRM-RETENTION-01',
    category: 'RETENTION',
    title: 'Digital Client Retention Save Plan',
    promptTemplate:
      'Draft a value-recovery proposal for client {{clientName}} with health score {{healthScore}} and contract renewal in {{daysRemaining}} days.',
    variablesJson: JSON.stringify(['clientName', 'healthScore', 'daysRemaining']),
  },
  {
    promptCode: 'PRM-FINANCIAL-01',
    category: 'FINANCIAL_DISCIPLINE',
    title: 'Double-Entry Accounting & Margin Review',
    promptTemplate:
      'Review net earnings distribution and tax reserve strategy for monthly compensation run of {{amount}} NGN.',
    variablesJson: JSON.stringify(['amount']),
  },
];

export async function getAiCoachingPrompts(
  category?: AiCoachingCategory
): Promise<AiCoachingPromptDto[]> {
  const where: any = { isActive: true };
  if (category) where.category = category;

  let prompts = await db.aiCoachingPrompt.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  // Seed default coaching prompts if empty
  if (prompts.length === 0) {
    const admin = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });

    if (admin) {
      for (const item of DEFAULT_COACHING_PROMPTS) {
        await db.aiCoachingPrompt.upsert({
          where: { promptCode: item.promptCode },
          update: {},
          create: {
            promptCode: item.promptCode,
            category: item.category,
            title: item.title,
            promptTemplate: item.promptTemplate,
            variablesJson: item.variablesJson,
            isActive: true,
            createdById: admin.id,
          },
        });
      }

      prompts = await db.aiCoachingPrompt.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });
    }
  }

  return prompts.map((p) => ({
    id: p.id,
    promptCode: p.promptCode,
    category: p.category as AiCoachingCategory,
    title: p.title,
    promptTemplate: p.promptTemplate,
    variables: JSON.parse(p.variablesJson || '[]'),
    isActive: p.isActive,
  }));
}
