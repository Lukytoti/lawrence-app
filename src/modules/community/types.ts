export type PostType =
  | 'ANNOUNCEMENT'
  | 'GENERAL'
  | 'TRAINING'
  | 'MOTIVATION'
  | 'TESTIMONY'
  | 'ACHIEVEMENT'
  | 'POLL'
  | 'QUESTION'
  | 'RESOURCE';

export type PostVisibility = 'PUBLIC_COMMUNITY' | 'TEAM' | 'LEADERS_ONLY';

export type ReactionTargetType = 'POST' | 'COMMENT' | 'MESSAGE';

export type ReactionType = 'LIKE' | 'LOVE' | 'CELEBRATE' | 'SUPPORT' | 'PRAY';

export type MentionTargetType = 'POST' | 'COMMENT';

export type ConversationType = 'DIRECT' | 'GROUP' | 'TEAM';

export type TrainingCategory =
  | 'GENERAL'
  | 'LEADERSHIP'
  | 'PRODUCT'
  | 'SALES'
  | 'NETWORK'
  | 'ONBOARDING';

export type TrainingAssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TrainingAssignmentStatus =
  | 'ASSIGNED'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';

export type TrainingProgressStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REVISION_REQUIRED';

export type LeadershipAttentionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type LeadershipAttentionAlertType =
  | 'OVERDUE_TRAINING'
  | 'INACTIVITY'
  | 'UNANSWERED_MESSAGE'
  | 'PRODUCTIVITY_DROP'
  | 'RECENT_EXIT_WARNING';

export interface EngagementFactor {
  factor: string;
  points: number;
  maxPoints: number;
  description: string;
}

export interface EngagementScoreResult {
  score: number; // 0-100
  factors: EngagementFactor[];
}

export interface LeadershipAttentionSignal {
  alertType: LeadershipAttentionAlertType;
  riskLevel: LeadershipAttentionRiskLevel;
  reasons: string[];
}
