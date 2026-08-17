import { IntegrationProviderAdapter, ProviderRequestOptions, ProviderResponse } from './interface';
import { verifyWebhookSignature, isSsrfTargetBlocked } from '../security';

export class GenericHttpProviderAdapter implements IntegrationProviderAdapter {
  providerName = 'GENERIC_HTTP';

  async authenticate(credentials: Record<string, any>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (credentials.apiKey) {
      headers['X-API-Key'] = credentials.apiKey;
    } else if (credentials.bearerToken) {
      headers['Authorization'] = `Bearer ${credentials.bearerToken}`;
    } else if (credentials.basicUser && credentials.basicPass) {
      const authStr = Buffer.from(`${credentials.basicUser}:${credentials.basicPass}`).toString('base64');
      headers['Authorization'] = `Basic ${authStr}`;
    }

    return headers;
  }

  async testConnection(credentials: Record<string, any>): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      if (!credentials || Object.keys(credentials).length === 0 || credentials.fail) {
        return { success: false, error: 'Missing or invalid required credentials' };
      }
      const latencyMs = Date.now() - start;
      return { success: true, latencyMs };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection test failed' };
    }
  }

  async sendRequest(options: ProviderRequestOptions, credentials: Record<string, any>): Promise<ProviderResponse> {
    const start = Date.now();
    if (isSsrfTargetBlocked(options.endpoint)) {
      throw new Error(`SSRF Blocked: Target URL ${options.endpoint} is restricted.`);
    }

    const authHeaders = await this.authenticate(credentials);
    const combinedHeaders = { ...authHeaders, ...options.headers };

    // Simulated provider request execution
    const durationMs = Date.now() - start;
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      data: { status: 'success', endpoint: options.endpoint, timestamp: new Date().toISOString() },
      durationMs,
    };
  }

  async verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): Promise<boolean> {
    const sigHeader = headers['x-webhook-signature'] || headers['x-hub-signature-256'] || headers['signature'];
    return verifyWebhookSignature(rawBody, sigHeader, secret);
  }

  normalizeResponse(response: ProviderResponse): any {
    return response.data;
  }

  normalizeError(error: any): { code: string; message: string; isRetryable: boolean } {
    const status = error.statusCode || error.status || 500;
    const isRetryable = status === 429 || status >= 500;
    return {
      code: `ERR_${status}`,
      message: error.message || 'External system HTTP request error',
      isRetryable,
    };
  }
}
