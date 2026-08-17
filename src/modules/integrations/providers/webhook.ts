import { IntegrationProviderAdapter, ProviderRequestOptions, ProviderResponse } from './interface';
import { verifyWebhookSignature } from '../security';

export class WebhookProviderAdapter implements IntegrationProviderAdapter {
  providerName = 'WEBHOOK';

  async authenticate(): Promise<Record<string, string>> {
    return { 'Content-Type': 'application/json' };
  }

  async testConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    return { success: true, latencyMs: 5 };
  }

  async sendRequest(options: ProviderRequestOptions): Promise<ProviderResponse> {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      data: { status: 'webhook_sent', path: options.endpoint },
      durationMs: 10,
    };
  }

  async verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): Promise<boolean> {
    const sig = headers['x-webhook-signature'] || headers['signature'] || headers['x-signature'];
    return verifyWebhookSignature(rawBody, sig, secret);
  }

  normalizeResponse(response: ProviderResponse): any {
    return response.data;
  }

  normalizeError(error: any): { code: string; message: string; isRetryable: boolean } {
    return {
      code: 'WEBHOOK_ERROR',
      message: error.message || 'Webhook verification error',
      isRetryable: true,
    };
  }
}
