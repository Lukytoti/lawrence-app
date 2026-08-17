import { NotificationChannel, ProviderType } from '../types';

export interface ProviderSendInput {
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  bodyContent: string;
  metadata?: Record<string, any>;
}

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  errorTrace?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  providerType: ProviderType;
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
}
