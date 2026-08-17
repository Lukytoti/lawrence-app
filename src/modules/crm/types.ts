export type LeadType =
  | 'NETWORK_PROSPECT'
  | 'DIGITAL_MARKETING_PROSPECT'
  | 'CLIENT_PROSPECT'
  | 'PARTNER_PROSPECT'
  | 'GENERAL_LEAD';

export type LeadTemperature = 'COLD' | 'WARM' | 'HOT';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'ENGAGED'
  | 'QUALIFIED'
  | 'APPOINTMENT_BOOKED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'NURTURE'
  | 'DORMANT'
  | 'CONVERTED';

export type InteractionType =
  | 'CALL'
  | 'EMAIL'
  | 'SMS'
  | 'SOCIAL_DM'
  | 'WHATSAPP'
  | 'MEETING'
  | 'PRESENTATION'
  | 'FOLLOW_UP'
  | 'NOTE'
  | 'OTHER';

export type InteractionDirection = 'INBOUND' | 'OUTBOUND';

export type FollowUpStatus =
  | 'PENDING'
  | 'DUE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'OVERDUE';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface ScoreFactor {
  rule: string;
  points: number;
  description: string;
}

export interface LeadScoreResult {
  score: number;
  temperature: LeadTemperature;
  factors: ScoreFactor[];
}

export interface DuplicateMatch {
  leadId: string;
  leadCode: string;
  displayName: string;
  matchReason: 'EMAIL' | 'PHONE' | 'COMPANY_NAME';
}
