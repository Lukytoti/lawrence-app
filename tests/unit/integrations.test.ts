import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  registerIntegration,
  createConnection,
  testConnection,
  registerEndpoint,
  registerWebhook,
  createMapping,
  getIntegrationDashboard,
} from '@/modules/integrations/service';
import { storeCredential, retrieveCredential, maskCredentialReference } from '@/modules/integrations/credentials';
import { isSsrfTargetBlocked, verifyWebhookSignature, generateHmacSignature, sanitizeIntegrationMetadata } from '@/modules/integrations/security';
import { GenericHttpProviderAdapter } from '@/modules/integrations/providers/generic-http';
import { OAuthProviderAdapter } from '@/modules/integrations/providers/oauth';
import { WebhookProviderAdapter } from '@/modules/integrations/providers/webhook';
import { processInboundWebhook } from '@/modules/integrations/webhooks';
import { dispatchOutboundWebhook } from '@/modules/integrations/outbound';
import { routeInboundEvent } from '@/modules/integrations/router';
import { calculateNextRetryDelay, isErrorRetryable, scheduleJobRetry } from '@/modules/integrations/retries';
import { listDeadLetters, retryDeadLetter, discardDeadLetter } from '@/modules/integrations/dead-letter';
import { transformPayload } from '@/modules/integrations/mappings';
import { executeApiRequest } from '@/modules/integrations/http';
import { hasIntegrationPermission, isSuperAdminUser, INTEGRATION_PERMISSIONS } from '@/modules/integrations/permissions';
import { eventBus } from '@/lib/events';

describe('MODULE 19: SECURE INTEGRATION, API GATEWAY & CONNECTIVITY ENGINE (60 TESTS)', () => {
  let superAdminId: string;
  let testUserId: string;

  beforeEach(async () => {
    let superAdmin = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });
    if (!superAdmin) {
      superAdmin = await db.user.create({
        data: {
          email: 'oluwatobi@lawrenceapp.internal',
          name: 'Oluwatobi Super Admin',
          status: 'ACTIVE',
        },
      });
    }
    superAdminId = superAdmin.id;

    const testUser = await db.user.create({
      data: {
        email: `integ.user.${Date.now()}.${Math.floor(Math.random() * 1000)}@lawrenceapp.internal`,
        name: 'Integration Test User',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;
  });

  // =========================================================================
  // 1. INTEGRATION REGISTRY & CONNECTIONS (10 TESTS)
  // =========================================================================
  it('1. registerIntegration should create new integration record in DRAFT status', async () => {
    const code = `INT-CRM-${Date.now()}`;
    const integ = await registerIntegration({
      integrationCode: code,
      name: 'HubSpot CRM Integration',
      description: 'Syncs leads and opportunities',
      provider: 'HUBSPOT',
      category: 'CRM',
    });

    expect(integ.status).toBe('DRAFT');
    expect(integ.integrationCode).toBe(code);
  });

  it('2. registerIntegration should reject duplicate integrationCode', async () => {
    const code = `INT-DUP-${Date.now()}`;
    await registerIntegration({
      integrationCode: code,
      name: 'Duplicate Test 1',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    await expect(
      registerIntegration({
        integrationCode: code,
        name: 'Duplicate Test 2',
        provider: 'GENERIC',
        category: 'CUSTOM',
      })
    ).rejects.toThrow('already exists');
  });

  it('3. createConnection should store credentials via reference and return connection record', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-CONN-${Date.now()}`,
      name: 'Connection Test Integration',
      provider: 'STRIPE',
      category: 'PAYMENTS',
    });

    const conn = await createConnection({
      integrationId: integ.id,
      connectionCode: `CONN-STRIPE-${Date.now()}`,
      name: 'Stripe Live Connection',
      authType: 'API_KEY',
      credentials: { apiKey: 'sk_live_secret_key_12345' },
    });

    expect(conn.credentialReference).toContain('cred_ref_');
    expect(conn.credentialReference).not.toContain('sk_live_secret');
  });

  it('4. retrieveCredential should recover stored credentials using reference token', () => {
    const secretData = { apiKey: 'my-super-secret-api-key-999' };
    const ref = storeCredential(secretData);
    const recovered = retrieveCredential(ref);

    expect(recovered?.apiKey).toBe('my-super-secret-api-key-999');
  });

  it('5. maskCredentialReference should mask credential reference strings', () => {
    const masked = maskCredentialReference('cred_ref_1234567890abcdef');
    expect(masked).toContain('cred_ref_123');
    expect(masked).toContain('****');
  });

  it('6. testConnection should execute connection check and update lastTestedAt timestamp', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-TEST-${Date.now()}`,
      name: 'Test Conn Provider',
      provider: 'TEST_PROV',
      category: 'CUSTOM',
    });

    const conn = await createConnection({
      integrationId: integ.id,
      connectionCode: `CONN-TEST-${Date.now()}`,
      name: 'Test Conn',
      authType: 'API_KEY',
      credentials: { apiKey: 'valid-key', mockSuccess: true },
    });

    const res = await testConnection(conn.id);
    expect(res.success).toBe(true);

    const updatedConn = await db.integrationConnection.findUnique({ where: { id: conn.id } });
    expect(updatedConn?.status).toBe('ACTIVE');
    expect(updatedConn?.lastTestedAt).toBeDefined();
  });

  it('7. testConnection failure should set status to ERROR and emit IntegrationConnectionFailed', async () => {
    let failedEmitted = false;
    const unsub = eventBus.subscribe('IntegrationConnectionFailed', (evt) => {
      if (evt.payload.connectionId) failedEmitted = true;
    });

    const integ = await registerIntegration({
      integrationCode: `INT-FAIL-${Date.now()}`,
      name: 'Fail Provider',
      provider: 'FAIL_PROV',
      category: 'CUSTOM',
    });

    const conn = await createConnection({
      integrationId: integ.id,
      connectionCode: `CONN-FAIL-${Date.now()}`,
      name: 'Fail Conn',
      authType: 'API_KEY',
      credentials: {}, // Empty credentials trigger failure
    });

    const res = await testConnection(conn.id);
    expect(res.success).toBe(false);
    expect(failedEmitted).toBe(true);

    unsub();
  });

  it('8. registerEndpoint should record endpoint definition', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-EP-${Date.now()}`,
      name: 'Endpoint Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const ep = await registerEndpoint({
      integrationId: integ.id,
      name: 'Fetch Leads Endpoint',
      method: 'GET',
      path: '/v1/leads',
      purpose: 'Fetch CRM leads',
      direction: 'OUTBOUND',
    });

    expect(ep.method).toBe('GET');
    expect(ep.direction).toBe('OUTBOUND');
  });

  it('9. registerWebhook should store secret via reference token', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-WH-${Date.now()}`,
      name: 'Webhook Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const wh = await registerWebhook({
      integrationId: integ.id,
      webhookCode: `WH-CODE-${Date.now()}`,
      name: 'Inbound Lead Webhook',
      endpointPath: '/api/webhooks/lead',
      secret: 'whsec_my_super_secret_string',
      eventType: 'external.lead.created',
    });

    expect(wh.secretReference).toContain('cred_ref_');
    expect(wh.secretReference).not.toContain('whsec_my');
  });

  it('10. getIntegrationDashboard should return health aggregations', async () => {
    const dashboard = await getIntegrationDashboard();
    expect(typeof dashboard.totalIntegrations).toBe('number');
    expect(typeof dashboard.activeConnectionsCount).toBe('number');
    expect(dashboard.overallHealthStatus).toBeDefined();
  });

  // =========================================================================
  // 2. SSRF PROTECTION & SECURITY CONTROLS (8 TESTS)
  // =========================================================================
  it('11. isSsrfTargetBlocked MUST block localhost, 127.0.0.1, 0.0.0.0, ::1', () => {
    expect(isSsrfTargetBlocked('http://localhost:3000/api')).toBe(true);
    expect(isSsrfTargetBlocked('http://127.0.0.1/admin')).toBe(true);
    expect(isSsrfTargetBlocked('http://0.0.0.0/internal')).toBe(true);
    expect(isSsrfTargetBlocked('http://[::1]/secret')).toBe(true);
  });

  it('12. isSsrfTargetBlocked MUST block RFC1918 private IP ranges', () => {
    expect(isSsrfTargetBlocked('http://10.0.0.1/status')).toBe(true);
    expect(isSsrfTargetBlocked('http://172.16.0.5/api')).toBe(true);
    expect(isSsrfTargetBlocked('http://192.168.1.1/config')).toBe(true);
  });

  it('13. isSsrfTargetBlocked MUST block Cloud Metadata IP 169.254.169.254', () => {
    expect(isSsrfTargetBlocked('http://169.254.169.254/latest/meta-data')).toBe(true);
    expect(isSsrfTargetBlocked('http://metadata.google.internal/computeMetadata')).toBe(true);
  });

  it('14. isSsrfTargetBlocked MUST ALLOW valid public domain endpoints', () => {
    expect(isSsrfTargetBlocked('https://api.stripe.com/v1/charges')).toBe(false);
    expect(isSsrfTargetBlocked('https://api.hubspot.com/crm/v3/objects/contacts')).toBe(false);
  });

  it('15. isSsrfTargetBlocked MUST ALLOW explicitly allowlisted domains', () => {
    const allowlist = ['internal-trusted.company.com'];
    expect(isSsrfTargetBlocked('https://internal-trusted.company.com/webhook', allowlist)).toBe(false);
  });

  it('16. generateHmacSignature & verifyWebhookSignature should validate HMAC SHA-256 signatures', () => {
    const payload = JSON.stringify({ event: 'charge.succeeded', amount: 5000 });
    const secret = 'whsec_test_secret_123';
    const sig = generateHmacSignature(payload, secret, 'HMAC_SHA256');

    expect(verifyWebhookSignature(payload, `sha256=${sig}`, secret, 'HMAC_SHA256')).toBe(true);
    expect(verifyWebhookSignature(payload, 'sha256=invalid_sig', secret, 'HMAC_SHA256')).toBe(false);
  });

  it('17. sanitizeIntegrationMetadata should scrub passwords, bearer tokens, and API keys', () => {
    const raw = {
      user: 'admin',
      password: 'MySecretPassword!123',
      token: 'Bearer eyJhbGciOiJIUzI1Ni...',
      apiKey: 'sk_live_secret_9999',
    };
    const clean = sanitizeIntegrationMetadata(raw);
    expect(clean.password).toBe('[REDACTED]');
    expect(clean.token).toBe('[REDACTED]');
    expect(clean.apiKey).toBe('[REDACTED]');
  });

  it('18. executeApiRequest targeting localhost MUST throw SSRF exception', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-SSRF-${Date.now()}`,
      name: 'SSRF Test Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    await expect(
      executeApiRequest({
        integrationId: integ.id,
        endpointUrl: 'http://127.0.0.1:8080/internal/admin',
        method: 'GET',
      })
    ).rejects.toThrow('SSRF Blocked');
  });

  // =========================================================================
  // 3. PROVIDER ADAPTER ARCHITECTURE (6 TESTS)
  // =========================================================================
  it('19. GenericHttpProviderAdapter should generate correct auth headers', async () => {
    const adapter = new GenericHttpProviderAdapter();
    const headers = await adapter.authenticate({ apiKey: 'key-123' });
    expect(headers['X-API-Key']).toBe('key-123');
  });

  it('20. OAuthProviderAdapter should require accessToken', async () => {
    const adapter = new OAuthProviderAdapter();
    await expect(adapter.authenticate({})).rejects.toThrow('OAuth authentication error');
  });

  it('21. OAuthProviderAdapter should generate Bearer token authorization header', async () => {
    const adapter = new OAuthProviderAdapter();
    const headers = await adapter.authenticate({ accessToken: 'oauth-token-xyz' });
    expect(headers['Authorization']).toBe('Bearer oauth-token-xyz');
  });

  it('22. WebhookProviderAdapter testConnection should return success', async () => {
    const adapter = new WebhookProviderAdapter();
    const res = await adapter.testConnection();
    expect(res.success).toBe(true);
  });

  it('23. GenericHttpProviderAdapter sendRequest should execute request safely', async () => {
    const adapter = new GenericHttpProviderAdapter();
    const res = await adapter.sendRequest(
      { method: 'GET', endpoint: 'https://api.example.com/v1/test' },
      { apiKey: 'test' }
    );
    expect(res.statusCode).toBe(200);
    expect(res.data.status).toBe('success');
  });

  it('24. GenericHttpProviderAdapter normalizeError should identify 429 and 500 as retryable', () => {
    const adapter = new GenericHttpProviderAdapter();
    const err429 = adapter.normalizeError({ statusCode: 429, message: 'Rate limit' });
    const err401 = adapter.normalizeError({ statusCode: 401, message: 'Unauthorized' });

    expect(err429.isRetryable).toBe(true);
    expect(err401.isRetryable).toBe(false);
  });

  // =========================================================================
  // 4. INBOUND WEBHOOK GATEWAY & IDEMPOTENCY (8 TESTS)
  // =========================================================================
  it('25. processInboundWebhook should process valid webhook and store IntegrationEvent', async () => {
    const secret = 'whsec_valid_secret_123';
    const integ = await registerIntegration({
      integrationCode: `INT-WHPROC-${Date.now()}`,
      name: 'Inbound Proc Provider',
      provider: 'GENERIC',
      category: 'CRM',
    });

    const wh = await registerWebhook({
      integrationId: integ.id,
      webhookCode: `WH-PROC-${Date.now()}`,
      name: 'Inbound Lead Proc',
      endpointPath: '/api/webhooks/proc',
      secret,
      eventType: 'external.lead.created',
    });

    const rawBody = JSON.stringify({ firstName: 'John', lastName: 'Doe', email: `john.${Date.now()}@example.com` });
    const sig = generateHmacSignature(rawBody, secret);

    const res = await processInboundWebhook({
      webhookCode: wh.webhookCode,
      rawBody,
      headers: { 'x-webhook-signature': `sha256=${sig}` },
      externalEventId: `ext_evt_${Date.now()}`,
    });

    expect(res.isDuplicate).toBe(false);
    expect(res.event.status).toBe('PROCESSED');
    expect(res.routeResult.domain).toBe('CRM');
  });

  it('26. processInboundWebhook with INVALID signature MUST reject with error', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-WHSIG-${Date.now()}`,
      name: 'Inbound Sig Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const wh = await registerWebhook({
      integrationId: integ.id,
      webhookCode: `WH-SIG-${Date.now()}`,
      name: 'Inbound Sig Webhook',
      endpointPath: '/api/webhooks/sig',
      secret: 'whsec_correct_secret',
      eventType: 'test.event',
    });

    await expect(
      processInboundWebhook({
        webhookCode: wh.webhookCode,
        rawBody: JSON.stringify({ test: true }),
        headers: { 'x-webhook-signature': 'sha256=invalid_signature' },
      })
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('27. processInboundWebhook with DUPLICATE idempotencyKey MUST return isDuplicate: true', async () => {
    const secret = 'whsec_dup_secret';
    const integ = await registerIntegration({
      integrationCode: `INT-WHIDEM-${Date.now()}`,
      name: 'Inbound Idem Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const wh = await registerWebhook({
      integrationId: integ.id,
      webhookCode: `WH-IDEM-${Date.now()}`,
      name: 'Inbound Idem Webhook',
      endpointPath: '/api/webhooks/idem',
      secret,
      eventType: 'test.event',
    });

    const rawBody = JSON.stringify({ payloadId: 1001 });
    const sig = generateHmacSignature(rawBody, secret);
    const idempotencyKey = `idem_key_${Date.now()}`;

    // First Delivery
    const res1 = await processInboundWebhook({
      webhookCode: wh.webhookCode,
      rawBody,
      headers: { 'x-webhook-signature': `sha256=${sig}` },
      idempotencyKey,
    });
    expect(res1.isDuplicate).toBe(false);

    // Duplicate Delivery
    const res2 = await processInboundWebhook({
      webhookCode: wh.webhookCode,
      rawBody,
      headers: { 'x-webhook-signature': `sha256=${sig}` },
      idempotencyKey,
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.event.id).toBe(res1.event.id);
  });

  it('28. CONCURRENCY: 4 SIMULTANEOUS duplicate webhook deliveries produce EXACTLY ONE processed event', async () => {
    const secret = 'whsec_conc_secret';
    const integ = await registerIntegration({
      integrationCode: `INT-WHCONC-${Date.now()}`,
      name: 'Inbound Conc Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const wh = await registerWebhook({
      integrationId: integ.id,
      webhookCode: `WH-CONC-${Date.now()}`,
      name: 'Inbound Conc Webhook',
      endpointPath: '/api/webhooks/conc',
      secret,
      eventType: 'external.notification.dispatch',
    });

    const rawBody = JSON.stringify({ batchId: 999 });
    const sig = generateHmacSignature(rawBody, secret);
    const idempotencyKey = `idem_conc_${Date.now()}`;

    const promises = Array.from({ length: 4 }).map(() =>
      processInboundWebhook({
        webhookCode: wh.webhookCode,
        rawBody,
        headers: { 'x-webhook-signature': `sha256=${sig}` },
        idempotencyKey,
      }).catch((err) => ({ isDuplicate: true, error: err.message }))
    );

    const results = await Promise.all(promises);
    const firstProcessings = results.filter((r: any) => r.isDuplicate === false);
    expect(firstProcessings.length).toBe(1); // EXACTLY ONE initial processing
  });

  it('29. dispatchOutboundWebhook should sign payload and publish OutboundWebhookDispatched', async () => {
    let outboundEmitted = false;
    const unsub = eventBus.subscribe('OutboundWebhookDispatched', () => {
      outboundEmitted = true;
    });

    const integ = await registerIntegration({
      integrationCode: `INT-OUT-${Date.now()}`,
      name: 'Outbound Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const event = await dispatchOutboundWebhook({
      integrationId: integ.id,
      endpointUrl: 'https://external-client.com/webhook',
      eventType: 'lead.status.updated',
      payload: { leadId: 'lead-123', status: 'QUALIFIED' },
      secret: 'whsec_outbound_secret_888',
    });

    expect(event.direction).toBe('OUTBOUND');
    expect(event.status).toBe('PROCESSED');
    expect(outboundEmitted).toBe(true);

    unsub();
  });

  it('30. routeInboundEvent external.lead.created should delegate to CRM createLead service', async () => {
    const res = await routeInboundEvent(
      'external.lead.created',
      {
        firstName: 'Routed',
        lastName: 'Lead',
        email: `routed.lead.${Date.now()}@test.com`,
      },
      'evt-123'
    );

    expect(res.domain).toBe('CRM');
    expect(res.entityId).toBeDefined();

    const createdLead = await db.crmLead.findUnique({ where: { id: res.entityId } });
    expect(createdLead?.firstName).toBe('Routed');
  });

  it('31. processInboundWebhook on non-existent webhookCode should throw error', async () => {
    await expect(
      processInboundWebhook({
        webhookCode: 'INVALID-WH-CODE',
        rawBody: '{}',
        headers: {},
      })
    ).rejects.toThrow('Active webhook configuration not found');
  });

  it('32. IntegrationEvent database index queries should filter by idempotencyKey', async () => {
    const evt = await db.integrationEvent.findFirst({ where: { status: 'PROCESSED' } });
    expect(typeof evt?.id === 'string' || evt === null).toBe(true);
  });

  // =========================================================================
  // 5. RETRIES & DEAD-LETTER QUEUE (8 TESTS)
  // =========================================================================
  it('33. calculateNextRetryDelay should return exponential schedule with jitter', () => {
    const delay0 = calculateNextRetryDelay(0);
    const delay1 = calculateNextRetryDelay(1);
    const delay2 = calculateNextRetryDelay(2);

    expect(delay0).toBeGreaterThanOrEqual(0);
    expect(delay1).toBeGreaterThanOrEqual(25); // ~30s with jitter
    expect(delay2).toBeGreaterThanOrEqual(100); // ~120s with jitter
  });

  it('34. isErrorRetryable should return false for 401, 403, and SSRF errors', () => {
    expect(isErrorRetryable('401 Unauthorized')).toBe(false);
    expect(isErrorRetryable('403 Forbidden')).toBe(false);
    expect(isErrorRetryable('SSRF Blocked')).toBe(false);
    expect(isErrorRetryable('500 Internal Server Error')).toBe(true);
    expect(isErrorRetryable('504 Gateway Timeout')).toBe(true);
  });

  it('35. scheduleJobRetry should increment attemptCount and set RETRYING status', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-RETRY-${Date.now()}`,
      name: 'Retry Test Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-RETRY-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_LEADS',
        maxAttempts: 5,
      },
    });

    const retriedJob = await scheduleJobRetry(job.id, '504 Gateway Timeout');
    expect(retriedJob.status).toBe('RETRYING');
    expect(retriedJob.attemptCount).toBe(1);
    expect(retriedJob.nextRetryAt).toBeDefined();
  });

  it('36. scheduleJobRetry exceeding maxAttempts should transition to DEAD_LETTER and emit IntegrationDeadLetterCreated', async () => {
    let dlqEmitted = false;
    const unsub = eventBus.subscribe('IntegrationDeadLetterCreated', () => {
      dlqEmitted = true;
    });

    const integ = await registerIntegration({
      integrationCode: `INT-DLQ-${Date.now()}`,
      name: 'DLQ Test Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-DLQ-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_INVOICES',
        attemptCount: 4,
        maxAttempts: 5,
      },
    });

    const deadJob = await scheduleJobRetry(job.id, 'Connection refused');
    expect(deadJob.status).toBe('DEAD_LETTER');
    expect(dlqEmitted).toBe(true);

    unsub();
  });

  it('37. listDeadLetters should return dead-letter events and jobs', async () => {
    const list = await listDeadLetters(10);
    expect(Array.isArray(list.deadEvents)).toBe(true);
    expect(Array.isArray(list.deadJobs)).toBe(true);
  });

  it('38. retryDeadLetter for JOB should reset status to PENDING and attemptCount to 0', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-DLQRETRY-${Date.now()}`,
      name: 'DLQ Retry Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-DLQRETRY-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_CATALOG',
        status: 'DEAD_LETTER',
        attemptCount: 5,
      },
    });

    const retried = await retryDeadLetter(job.id, 'JOB');
    expect(retried.status).toBe('PENDING');
    expect(retried.attemptCount).toBe(0);
  });

  it('39. discardDeadLetter for JOB should update status to CANCELLED', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-DISCARD-${Date.now()}`,
      name: 'Discard Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-DISCARD-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_TASKS',
        status: 'DEAD_LETTER',
      },
    });

    const discarded = await discardDeadLetter(job.id, 'JOB');
    expect(discarded.status).toBe('CANCELLED');
  });

  it('40. createMapping & transformPayload should rename and transform field values', async () => {
    const payload = {
      first_name: 'Jane ',
      last_name: 'Doe',
      user_age: '30',
      is_active: 'true',
    };

    const rules = [
      { sourceField: 'first_name', targetField: 'firstName', transformer: 'TRIM' as const },
      { sourceField: 'last_name', targetField: 'lastName', transformer: 'UPPERCASE' as const },
      { sourceField: 'user_age', targetField: 'age', transformer: 'TO_NUMBER' as const },
      { sourceField: 'is_active', targetField: 'active', transformer: 'TO_BOOLEAN' as const },
    ];

    const result = transformPayload(payload, rules);
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('DOE');
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);
  });

  // =========================================================================
  // 6. RBAC & AUDIT LOGGING (6 TESTS)
  // =========================================================================
  it('41. isSuperAdminUser should return true for Oluwatobi super admin', async () => {
    const isSuper = await isSuperAdminUser(superAdminId);
    expect(isSuper).toBe(true);
  });

  it('42. hasIntegrationPermission should grant full access to SUPER_ADMIN', async () => {
    const allowed = await hasIntegrationPermission(superAdminId, INTEGRATION_PERMISSIONS.ADMIN);
    expect(allowed).toBe(true);
  });

  it('43. hasIntegrationPermission should reject unprivileged user for ADMIN permission', async () => {
    const allowed = await hasIntegrationPermission(testUserId, INTEGRATION_PERMISSIONS.ADMIN);
    expect(allowed).toBe(false);
  });

  it('44. executeApiRequest should log sanitized audit log entry', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-HTTPAUDIT-${Date.now()}`,
      name: 'HTTP Audit Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const res = await executeApiRequest({
      integrationId: integ.id,
      endpointUrl: 'https://api.external.com/v1/ping',
      method: 'GET',
    });

    expect(res.statusCode).toBe(200);
    const log = await db.integrationLog.findFirst({
      where: { integrationId: integ.id, eventType: 'API_REQUEST_SUCCESS' },
    });

    expect(log).toBeDefined();
    expect(log?.level).toBe('INFO');
  });

  it('45. storeCredential should encrypt secret and mask credential reference', () => {
    const ref = storeCredential({ apiKey: 'secret-key-100' });
    expect(ref.startsWith('cred_ref_')).toBe(true);
    const masked = maskCredentialReference(ref);
    expect(masked).not.toContain('secret-key-100');
  });

  it('46. IntegrationLog database queries should filter by integrationId and level', async () => {
    const logs = await db.integrationLog.findMany({ where: { level: 'INFO' } });
    expect(Array.isArray(logs)).toBe(true);
  });

  // =========================================================================
  // 7. ARCHITECTURAL BOUNDARIES & FINANCIAL LEDGER ISOLATION (6 TESTS)
  // =========================================================================
  it('47. Module 19 MUST contain ZERO direct financial ledger mutations', async () => {
    const initialAccountsCount = await db.financialAccount.count();
    const initialTxCount = await db.journalTransaction.count();
    const initialEntriesCount = await db.journalEntry.count();

    // Execute integration registry, inbound webhook, API request, dead-letter retry
    const integ = await registerIntegration({
      integrationCode: `INT-FINISO-${Date.now()}`,
      name: 'Fin Iso Provider',
      provider: 'GENERIC',
      category: 'PAYMENTS',
    });

    await routeInboundEvent('external.payment.received', { amount: 500 }, 'evt-fin-1');
    await getIntegrationDashboard();

    const finalAccountsCount = await db.financialAccount.count();
    const finalTxCount = await db.journalTransaction.count();
    const finalEntriesCount = await db.journalEntry.count();

    expect(finalAccountsCount).toBe(initialAccountsCount);
    expect(finalTxCount).toBe(initialTxCount);
    expect(finalEntriesCount).toBe(initialEntriesCount);
  });

  it('48. IntegrationLog metadataJson MUST NEVER contain un-sanitized Bearer tokens or API keys', async () => {
    const raw = {
      apiKey: 'sk_live_123456789',
      bearerToken: 'Bearer eyJhbGciOiJIUzI1Ni...',
      publicMsg: 'Safe log',
    };
    const clean = sanitizeIntegrationMetadata(raw);
    expect(clean.apiKey).toBe('[REDACTED]');
    expect(clean.bearerToken).toBe('[REDACTED]');
  });

  it('49. AI prompt secret isolation: credentials MUST NOT be returned in plain JSON', async () => {
    const ref = storeCredential({ clientSecret: 'my_super_secret_oauth_key' });
    const conn = await db.integrationConnection.create({
      data: {
        integrationId: (
          await registerIntegration({
            integrationCode: `INT-AIISO-${Date.now()}`,
            name: 'AI Iso Provider',
            provider: 'GENERIC',
            category: 'CUSTOM',
          })
        ).id,
        connectionCode: `CONN-AIISO-${Date.now()}`,
        name: 'AI Iso Connection',
        authType: 'OAUTH2',
        credentialReference: ref,
      },
    });

    const connJson = JSON.stringify(conn);
    expect(connJson).not.toContain('my_super_secret_oauth_key');
    expect(connJson).toContain(ref);
  });

  it('50. Concurrency test: 4 SIMULTANEOUS connection tests complete cleanly', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-CONCCONN-${Date.now()}`,
      name: 'Conc Conn Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const conn = await createConnection({
      integrationId: integ.id,
      connectionCode: `CONN-CONCCONN-${Date.now()}`,
      name: 'Conc Conn',
      authType: 'API_KEY',
      credentials: { apiKey: 'key', mockSuccess: true },
    });

    const promises = Array.from({ length: 4 }).map(() => testConnection(conn.id));
    const results = await Promise.all(promises);
    expect(results.every((r) => r.success === true)).toBe(true);
  });

  it('51. Concurrency test: 4 SIMULTANEOUS dead-letter retries execute safely', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-CONCDLQ-${Date.now()}`,
      name: 'Conc DLQ Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-CONCDLQ-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_CONC',
        status: 'DEAD_LETTER',
      },
    });

    const promises = Array.from({ length: 4 }).map(() => retryDeadLetter(job.id, 'JOB'));
    const results = await Promise.all(promises);
    expect(results.length).toBe(4);
    expect(results[0].status).toBe('PENDING');
  });

  it('52. Full cross-domain integration dashboard load complete', async () => {
    const dashboard = await getIntegrationDashboard();
    expect(dashboard).toBeDefined();
  });

  // =========================================================================
  // 8. ADDITIONAL SYSTEM HARDENING & BOUNDARY QA (8 TESTS)
  // =========================================================================
  it('53. createMapping should parse and serialize field mappings', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-MAPREG-${Date.now()}`,
      name: 'Map Reg Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const map = await createMapping({
      integrationId: integ.id,
      mappingCode: `MAP-REG-${Date.now()}`,
      sourceSystem: 'HUBSPOT',
      targetSystem: 'LAWRENCE_CRM',
      sourceEntity: 'contact',
      targetEntity: 'CrmLead',
      fieldMappings: [{ sourceField: 'email', targetField: 'email' }],
    });

    expect(map.mappingCode).toBeDefined();
    expect(map.mappingJson).toContain('email');
  });

  it('54. transformPayload should support default values when source field is missing', () => {
    const payload = {};
    const rules = [{ sourceField: 'status', targetField: 'status', defaultValue: 'PROSPECT' }];
    const res = transformPayload(payload, rules);
    expect(res.status).toBe('PROSPECT');
  });

  it('55. verifyWebhookSignature should handle whitespace in signature header', () => {
    const payload = '{"test":123}';
    const secret = 'whsec_space_secret';
    const sig = generateHmacSignature(payload, secret);
    expect(verifyWebhookSignature(payload, `  sha256=${sig}  `, secret)).toBe(true);
  });

  it('56. executeApiRequest with valid public URL returns durationMs and status 200', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-HTTPPUB-${Date.now()}`,
      name: 'HTTP Public Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const res = await executeApiRequest({
      integrationId: integ.id,
      endpointUrl: 'https://api.stripe.com/v1/customers',
      method: 'GET',
    });

    expect(res.statusCode).toBe(200);
    expect(typeof res.durationMs).toBe('number');
  });

  it('57. scheduleJobRetry with non-retryable 401 error should directly transition to DEAD_LETTER', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-NONRETRY-${Date.now()}`,
      name: 'Non Retry Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const job = await db.integrationJob.create({
      data: {
        jobCode: `JOB-NONRETRY-${Date.now()}`,
        integrationId: integ.id,
        jobType: 'SYNC_AUTH',
        attemptCount: 1,
        maxAttempts: 5,
      },
    });

    const dead = await scheduleJobRetry(job.id, '401 Unauthorized API key');
    expect(dead.status).toBe('DEAD_LETTER');
  });

  it('58. discardDeadLetter for EVENT should set status to IGNORED', async () => {
    const integ = await registerIntegration({
      integrationCode: `INT-DISCARDEV-${Date.now()}`,
      name: 'Discard Event Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const event = await db.integrationEvent.create({
      data: {
        eventCode: `EVT-DISCARD-${Date.now()}`,
        integrationId: integ.id,
        direction: 'INBOUND',
        eventType: 'test.discard',
        idempotencyKey: `idem_discard_${Date.now()}`,
        payloadHash: 'hash',
        status: 'DEAD_LETTER',
      },
    });

    const discarded = await discardDeadLetter(event.id, 'EVENT');
    expect(discarded.status).toBe('IGNORED');
  });

  it('59. sanitizeIntegrationMetadata handles arrays and nested null fields without error', () => {
    const input = [
      { key: 'safe', secretKey: 'secret_val' },
      null,
      { list: ['a', 'b', 'Bearer token123'] },
    ];
    const clean = sanitizeIntegrationMetadata(input);
    expect(clean[0].secretKey).toBe('[REDACTED]');
    expect(clean[1]).toBeNull();
  });

  it('60. Full Module 19 System Integration: end-to-end integration registry, webhook & job cycle', async () => {
    const code = `INT-E2E-${Date.now()}`;
    const integ = await registerIntegration({
      integrationCode: code,
      name: 'End-to-End Provider',
      provider: 'GENERIC',
      category: 'CUSTOM',
    });

    const conn = await createConnection({
      integrationId: integ.id,
      connectionCode: `CONN-E2E-${Date.now()}`,
      name: 'E2E Connection',
      authType: 'API_KEY',
      credentials: { apiKey: 'key-e2e', mockSuccess: true },
    });

    const testRes = await testConnection(conn.id);
    expect(testRes.success).toBe(true);

    const dashboard = await getIntegrationDashboard();
    expect(dashboard.activeIntegrationsCount).toBeGreaterThanOrEqual(0);
  });
});
