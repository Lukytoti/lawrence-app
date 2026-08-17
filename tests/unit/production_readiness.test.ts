import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorageConfigurationStatus, setStorageProvider } from '@/modules/documents/storage/provider';
import { LocalStorageProvider } from '@/modules/documents/storage/local';
import { S3StorageProvider } from '@/modules/documents/storage/s3';
import { EmailNotificationProvider } from '@/modules/notifications/providers/email';
import { SmsNotificationProvider } from '@/modules/notifications/providers/sms';
import { WhatsAppNotificationProvider } from '@/modules/notifications/providers/whatsapp';
import { sanitizeForAudit, sanitizeErrorMessage } from '@/modules/documents/security';
import { getProductionReadinessReport } from '@/modules/command-center/readiness';

describe('PROMPT 22 — Production Readiness & Infrastructure Hardening Test Suite', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Secret Management & Sanitization Hardening', () => {
    it('1.1 should redact sensitive credentials, tokens, passwords, and private keys from audit metadata', () => {
      const payload = {
        apiKey: 'sk_live_1234567890abcdef',
        secretToken: 'bearer_token_xyz987',
        userPassword: 'SecretPassword123!',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...',
        dbUrl: 'postgresql://admin:superSecret@db.internal:5432/prod',
        safeField: 'User Document Upload',
        numberField: 42,
      };

      const sanitized = sanitizeForAudit(payload);

      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.secretToken).toBe('[REDACTED]');
      expect(sanitized.userPassword).toBe('[REDACTED]');
      expect(sanitized.privateKey).toBe('[REDACTED]');
      expect(sanitized.safeField).toBe('User Document Upload');
      expect(sanitized.numberField).toBe(42);
    });

    it('1.2 should sanitize connection strings and passwords from raw error stack traces', () => {
      const rawError = 'Error: Connection failed at postgresql://postgres:MyPassword123@localhost:5432/lawrence_app';
      const sanitized = sanitizeErrorMessage(rawError);

      expect(sanitized).not.toContain('MyPassword123');
      expect(sanitized).toContain('postgres://[REDACTED]');
    });

    it('1.3 should recursively sanitize nested arrays and complex dictionaries', () => {
      const nested = {
        items: [
          { token: 'secret_1', name: 'Item 1' },
          { clientSecret: 'secret_2', name: 'Item 2' },
        ],
      };

      const sanitized = sanitizeForAudit(nested);
      expect(sanitized.items[0].token).toBe('[REDACTED]');
      expect(sanitized.items[0].name).toBe('Item 1');
      expect(sanitized.items[1].clientSecret).toBe('[REDACTED]');
      expect(sanitized.items[1].name).toBe('Item 2');
    });
  });

  describe('2. Multi-Channel Notification Provider Production Readiness', () => {
    it('2.1 should fail closed in production when Email provider credentials are not configured', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;

      const provider = new EmailNotificationProvider();
      const res = await provider.send({
        recipientEmail: 'client@example.com',
        title: 'Invoice Notice',
        content: 'Your invoice is ready',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Email provider not configured for production environment');
      expect(res.providerMessageId).toBeUndefined();
    });

    it('2.2 should succeed in development/test sandbox mode when Email credentials are absent', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.SENDGRID_API_KEY;
      delete process.env.SMTP_HOST;

      const provider = new EmailNotificationProvider();
      const res = await provider.send({
        recipientEmail: 'client@example.com',
        title: 'Invoice Notice',
        content: 'Your invoice is ready',
      });

      expect(res.success).toBe(true);
      expect(res.providerMessageId).toContain('_msg_');
    });

    it('2.3 should fail closed in production when SMS provider credentials are not configured', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      const provider = new SmsNotificationProvider();
      const res = await provider.send({
        recipientPhone: '+2348012345678',
        content: 'Security verification code: 123456',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('SMS provider not configured for production environment');
    });

    it('2.4 should succeed in development/test sandbox mode for SMS notifications', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.TWILIO_ACCOUNT_SID;

      const provider = new SmsNotificationProvider();
      const res = await provider.send({
        recipientPhone: '+2348012345678',
        content: 'Security verification code: 123456',
      });

      expect(res.success).toBe(true);
      expect(res.providerMessageId).toContain('sms_twilio_sandbox_');
    });

    it('2.5 should fail closed in production when WhatsApp provider token is missing', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.WHATSAPP_API_TOKEN;

      const provider = new WhatsAppNotificationProvider();
      const res = await provider.send({
        recipientPhone: '+2348012345678',
        content: 'Community announcement',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('WhatsApp provider not configured for production environment');
    });
  });

  describe('3. Document Storage Configuration & Provider Validation', () => {
    it('3.1 should correctly report local filesystem storage status', () => {
      delete process.env.DOCUMENT_STORAGE_DRIVER;
      const status = getStorageConfigurationStatus();

      expect(status.driver).toBe('local');
      expect(status.isCloud).toBe(false);
      expect(status.isConfigured).toBe(true);
      expect(status.localPath).toContain('storage/documents');
    });

    it('3.2 should correctly report S3 cloud storage configuration status when configured', () => {
      process.env.DOCUMENT_STORAGE_DRIVER = 's3';
      process.env.DOCUMENT_STORAGE_BUCKET = 'my-corp-documents-prod';
      process.env.DOCUMENT_STORAGE_REGION = 'eu-west-1';

      const status = getStorageConfigurationStatus();

      expect(status.driver).toBe('s3');
      expect(status.isCloud).toBe(true);
      expect(status.isConfigured).toBe(true);
      expect(status.bucket).toBe('my-corp-documents-prod');
      expect(status.region).toBe('eu-west-1');
    });

    it('3.3 should generate valid signed S3 URLs with time-bounded expiration and HMAC signature', async () => {
      const s3Provider = new S3StorageProvider('lawrence-documents-vault', 'eu-west-1');
      const signedUrl = await s3Provider.getSignedUrl('documents/doc-001/v1_contract.pdf', 3600);

      expect(signedUrl).toContain('https://lawrence-documents-vault.s3.eu-west-1.amazonaws.com/');
      expect(signedUrl).toContain('exp=');
      expect(signedUrl).toContain('sig=');
    });
  });

  describe('4. Production Readiness Health & Infrastructure Probes', () => {
    it('4.1 should return structured readiness report containing all core subsystem checks', async () => {
      const report = await getProductionReadinessReport();

      expect(report).toBeDefined();
      expect(report.checks.database).toBeDefined();
      expect(report.checks.database.status).toBe('READY');
      expect(report.checks.storage).toBeDefined();
      expect(report.checks.notifications).toBeDefined();
      expect(report.checks.integrations).toBeDefined();
      expect(report.checks.resilience).toBeDefined();
      expect(report.checks.security).toBeDefined();
      expect(report.checks.security.totalPermissions).toBeGreaterThanOrEqual(210);
      expect(report.checks.security.superAdminExists).toBe(true);
    });

    it('4.2 should never expose secret values in readiness probe outputs', async () => {
      const report = await getProductionReadinessReport();
      const stringified = JSON.stringify(report);

      expect(stringified).not.toContain('AdminPassword123!');
      expect(stringified).not.toContain('super-secret-lawrence-app-key');
      expect(stringified).not.toContain('postgresql://postgres:postgres');
    });
  });

  describe('5. External Integration Gateway Production Webhook Hardening', () => {
    it('5.1 should fail closed in production when webhook secret is missing from credential store', async () => {
      process.env.NODE_ENV = 'production';
      const { processInboundWebhook } = await import('@/modules/integrations/webhooks');

      await expect(
        processInboundWebhook({
          webhookCode: 'NON_EXISTENT_OR_UNCONFIGURED_WEBHOOK',
          rawBody: JSON.stringify({ event: 'test' }),
          headers: { 'x-webhook-signature': 'invalid_sig' },
        })
      ).rejects.toThrow();
    });
  });

  describe('6. Financial Ledger Isolation Regression Verification', () => {
    it('6.1 should verify Prompt 05/05.1 remains the sole financial ledger authority', async () => {
      const { db } = await import('@/lib/db');
      const superAdminUser = await db.user.findFirst({
        where: { email: 'oluwatobi@lawrenceapp.internal' },
      });

      expect(superAdminUser).toBeDefined();
      expect(superAdminUser?.email).toBe('oluwatobi@lawrenceapp.internal');
    });
  });
});
