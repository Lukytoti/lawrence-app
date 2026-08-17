import crypto from 'crypto';
import { NotificationProvider, ProviderSendInput, ProviderSendResult } from './interface';

export class WebhookNotificationProvider implements NotificationProvider {
  channel = 'WEBHOOK' as const;
  providerType = 'WEBHOOK_HTTP' as const;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    try {
      const webhookUrl = input.metadata?.webhookUrl;
      if (!webhookUrl) {
        return { success: false, error: 'Target webhookUrl metadata is required for Webhook notifications' };
      }

      const payload = JSON.stringify({
        subject: input.subject,
        bodyContent: input.bodyContent,
        metadata: input.metadata,
        timestamp: new Date().toISOString(),
      });

      const secret = input.metadata?.webhookSecret || 'default_webhook_secret';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const mockMessageId = `wh_http_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      return {
        success: true,
        providerMessageId: mockMessageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Webhook dispatch failed',
        errorTrace: error.stack,
      };
    }
  }
}
