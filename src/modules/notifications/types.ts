export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'WEBHOOK';

export type NotificationCategory = 'SYSTEM' | 'BILLING' | 'RETENTION' | 'MARKETING' | 'SECURITY';

export type MessageStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'CANCELLED';

export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

export type ProviderType =
  | 'SMTP'
  | 'SENDGRID'
  | 'TWILIO'
  | 'WHATSAPP_CLOUD'
  | 'IN_APP'
  | 'WEBHOOK_HTTP';

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';

export type SuppressionReason =
  | 'BOUNCE'
  | 'SPAM_COMPLAINT'
  | 'UNSUBSCRIBE'
  | 'MANUAL_BLOCK';

export type LogEventType =
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'SUPPRESSED';

export interface CreateTemplateInput {
  templateCode?: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  bodyTemplate: string;
  variablesJson?: string[];
  category?: NotificationCategory;
  isActive?: boolean;
}

export interface DispatchMessageInput {
  templateId?: string;
  channel: NotificationChannel;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  bodyContent?: string;
  templateVariables?: Record<string, any>;
  category?: NotificationCategory;
  metadataJson?: Record<string, any>;
  scheduledAt?: Date;
  idempotencyKey?: string;
}

export interface DispatchResult {
  messageId: string;
  status: MessageStatus;
  deliveryId?: string;
  provider: ProviderType;
  newlyDispatched: boolean;
  suppressed?: boolean;
  suppressionReason?: string;
  error?: string;
}

export interface PreferenceUpdateInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  inAppEnabled?: boolean;
  marketingOptIn?: boolean;
  billingOptIn?: boolean;
  retentionOptIn?: boolean;
  systemOptIn?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export interface CreateCampaignInput {
  campaignCode?: string;
  name: string;
  description?: string;
  templateId: string;
  targetSegment: string;
  scheduledAt?: Date;
}
