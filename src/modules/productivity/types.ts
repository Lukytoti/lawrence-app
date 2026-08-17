export type MeasurementUnit = 'COUNT' | 'BOOLEAN' | 'DURATION' | 'CURRENCY' | 'PERCENTAGE' | 'REPORT';
export type ActivityCategory = 'NETWORK_MARKETING' | 'DIGITAL_MARKETING' | 'LEARNING' | 'PERSONAL';
export type GoalTimeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PrivacyLevel = 'PRIVATE' | 'LEADER_VISIBLE' | 'TEAM_VISIBLE' | 'PUBLIC';
export type FrequencyType = 'DAILY' | 'WEEKDAYS' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type ActivityInstanceStatus = 'PENDING' | 'REPORTED' | 'VERIFIED' | 'MISSED' | 'EXEMPT';
export type EvidenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export interface ActivityTypeSummary {
  id: string;
  code: string;
  name: string;
  category: ActivityCategory;
  measurementUnit: MeasurementUnit;
  defaultTarget?: number;
  requiresEvidence: boolean;
  weight: number;
  description?: string;
}

export interface GoalSummary {
  id: string;
  memberId: string;
  parentGoalId?: string | null;
  title: string;
  description?: string | null;
  timeframe: GoalTimeframe;
  category: ActivityCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  privacyLevel: PrivacyLevel;
  progressPercent: number;
}

export interface DailyActivityItemPayload {
  instanceId: string;
  templateId: string;
  activityTypeCode: string;
  activityTypeName: string;
  category: ActivityCategory;
  measurementUnit: MeasurementUnit;
  targetValue: number;
  completedValue: number;
  status: ActivityInstanceStatus;
  requiresEvidence: boolean;
  evidenceItems: {
    id: string;
    fileName: string;
    storageKey: string;
    publicUrl?: string | null;
    status: EvidenceStatus;
  }[];
  submittedAt?: Date | null;
  notes?: string | null;
}

export interface DailyMyDayPayload {
  memberId: string;
  dateStr: string; // YYYY-MM-DD
  timeZone: string;
  dailyScore: number;
  streakCount: number;
  activities: DailyActivityItemPayload[];
  goals: GoalSummary[];
  tasks: {
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: Date | null;
  }[];
  attentionItems: string[];
}
