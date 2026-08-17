import { NotificationProvider, ProviderSendInput, ProviderSendResult } from './interface';
import { db } from '@/lib/db';

export class InAppNotificationProvider implements NotificationProvider {
  channel = 'IN_APP' as const;
  providerType = 'IN_APP' as const;

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    try {
      if (!input.recipientId) {
        return { success: false, error: 'Recipient ID is required for In-App notifications' };
      }

      const mockMessageId = `inapp_msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      return {
        success: true,
        providerMessageId: mockMessageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'In-App notification delivery failed',
        errorTrace: error.stack,
      };
    }
  }
}
