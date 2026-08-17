export interface ProviderRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
  timeoutMs?: number;
}

export interface ProviderResponse {
  statusCode: number;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
}

export interface IntegrationProviderAdapter {
  providerName: string;
  authenticate(credentials: Record<string, any>): Promise<Record<string, string>>;
  testConnection(credentials: Record<string, any>): Promise<{ success: boolean; latencyMs?: number; error?: string }>;
  sendRequest(options: ProviderRequestOptions, credentials: Record<string, any>): Promise<ProviderResponse>;
  verifyWebhook(rawBody: string, headers: Record<string, string>, secret: string): Promise<boolean>;
  normalizeResponse(response: ProviderResponse): any;
  normalizeError(error: any): { code: string; message: string; isRetryable: boolean };
}
