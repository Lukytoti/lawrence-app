import { IntegrationProviderAdapter, ProviderRequestOptions, ProviderResponse } from './interface';
import { verifyWebhookSignature } from '../security';

export class OAuthProviderAdapter implements IntegrationProviderAdapter {
  providerName = 'OAUTH2';

  async authenticate(credentials: Record<string, any>): Promise<Record<string, string>> {
    const token = credentials.accessToken || credentials.bearerToken;
    if (!token) {
      throw new Error('OAuth authentication error: Access token missing');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(credentials: Record<string, any>): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();
    if (!credentials.accessToken && !credentials.clientSecret) {
      return { success: false, error: 'Invalid OAuth credentials' };
    }
    return { success: true, latencyMs: Date.now() - start };
  }

  async sendRequest(options: ProviderRequestOptions, credentials: Record<string, any>): Promise<ProviderResponse> {
    const start = Date.now();
    const headers = await this.authenticate(credentials);
    return {
      statusCode: 200,
      headers: { ...headers, 'content-type': 'application/json' },
      data: { status: 'oauth_success', endpoint: options.endpoint },
      durationMs: Date.now() - start,
    };
  }

  async verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): Promise<boolean> {
    const sig = headers['x-oauth-signature'] || headers['x-signature'];
    return verifyWebhookSignature(rawBody, sig, secret);
  }

  normalizeResponse(response: ProviderResponse): any {
    return response.data;
  }

  normalizeError(error: any): { code: string; message: string; isRetryable: boolean } {
    const status = error.statusCode || 500;
    return {
      code: `OAUTH_ERR_${status}`,
      message: error.message || 'OAuth token execution failure',
      isRetryable: status === 429 || status >= 500,
    };
  }
}
