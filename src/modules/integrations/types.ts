export type IntegrationStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ERROR';

export type IntegrationCategory =
  | 'CRM'
  | 'ACCOUNTING'
  | 'PAYMENTS'
  | 'COMMUNICATION'
  | 'MARKETING'
  | 'PROJECT_MANAGEMENT'
  | 'ANALYTICS'
  | 'AI'
  | 'STORAGE'
  | 'IDENTITY'
  | 'CUSTOM';

export type IntegrationEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export type AuthType = 'API_KEY' | 'OAUTH2' | 'BEARER' | 'BASIC' | 'HMAC' | 'CUSTOM';

export type EndpointDirection = 'INBOUND' | 'OUTBOUND';

export type EventStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'IGNORED'
  | 'RETRYING'
  | 'DEAD_LETTER';

export type JobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'DEAD_LETTER';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';

export interface RegisterIntegrationInput {
  integrationCode: string;
  name: string;
  description?: string;
  provider: string;
  category: IntegrationCategory;
  version?: string;
  documentationUrl?: string;
}

export interface CreateConnectionInput {
  integrationId: string;
  connectionCode: string;
  name: string;
  environment?: IntegrationEnvironment;
  authType: AuthType;
  credentials: Record<string, any>;
  configuration?: Record<string, any>;
}

export interface RegisterEndpointInput {
  integrationId: string;
  name: string;
  method: string;
  path: string;
  purpose: string;
  direction: EndpointDirection;
  timeoutMs?: number;
  retryPolicy?: Record<string, any>;
}

export interface RegisterWebhookInput {
  integrationId: string;
  webhookCode: string;
  name: string;
  endpointPath: string;
  secret: string;
  signatureAlgorithm?: string;
  eventType: string;
}

export interface CreateMappingInput {
  integrationId: string;
  mappingCode: string;
  sourceSystem: string;
  targetSystem: string;
  sourceEntity: string;
  targetEntity: string;
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    transformer?: string;
    defaultValue?: any;
  }>;
}

export interface InboundWebhookPayload {
  webhookCode: string;
  headers: Record<string, string>;
  rawBody: string;
  parsedBody: any;
  externalEventId?: string;
  idempotencyKey?: string;
}

export interface IntegrationDashboardDto {
  totalIntegrations: number;
  activeIntegrationsCount: number;
  activeConnectionsCount: number;
  pendingJobsCount: number;
  deadLetterEventsCount: number;
  overallHealthStatus: HealthStatus;
  recentLogs: any[];
  activeHealths: any[];
}
