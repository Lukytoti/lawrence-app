export type AiContextDomain =
  | 'GENERAL'
  | 'ORGANIZATION'
  | 'FINANCIAL'
  | 'CRM'
  | 'PROJECTS'
  | 'RETENTION'
  | 'PRODUCTIVITY';

export type AiMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

export type AiInsightDomain =
  | 'ORGANIZATION'
  | 'RETENTION'
  | 'FINANCIAL'
  | 'PRODUCTIVITY'
  | 'PROJECTS';

export type AiInsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AiInsightStatus = 'NEW' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';

export type AiCoachingCategory =
  | 'LEADERSHIP'
  | 'RECRUITING'
  | 'RETENTION'
  | 'FINANCIAL_DISCIPLINE'
  | 'PRODUCTIVITY';

export type AiRecommendationStatus = 'PENDING' | 'APPLIED' | 'REJECTED';

export interface AiCitation {
  title: string;
  url: string;
  domain: string;
  entityId?: string;
  entityType?: string;
}

export interface PromptExecutionInput {
  conversationId?: string;
  prompt: string;
  contextDomain?: AiContextDomain;
  modelName?: string;
  targetEntityId?: string;
  idempotencyKey?: string;
}

export interface PromptExecutionResult {
  conversationId: string;
  messageId: string;
  response: string;
  citations: AiCitation[];
  tokensUsed: number;
  modelName: string;
}

export interface AiQuotaDto {
  userId: string;
  dailyPromptLimit: number;
  promptsUsedToday: number;
  lastResetDate: Date;
  totalTokensConsumed: number;
  isLimitReached: boolean;
}

export interface AiInsightDto {
  id: string;
  insightCode: string;
  userId: string;
  domain: AiInsightDomain;
  title: string;
  summary: string;
  actionableRecommendation: string;
  severity: AiInsightSeverity;
  status: AiInsightStatus;
  createdAt: Date;
}

export interface AiCoachingPromptDto {
  id: string;
  promptCode: string;
  category: AiCoachingCategory;
  title: string;
  promptTemplate: string;
  variables: string[];
  isActive: boolean;
}

export interface AiExecutiveSummary {
  activeConversations: number;
  newInsightsCount: number;
  criticalInsightsCount: number;
  pendingRecommendations: number;
  promptsUsedToday: number;
  dailyQuotaLimit: number;
  tokensConsumedThisMonth: number;
}
