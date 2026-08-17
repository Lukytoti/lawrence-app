import crypto from 'crypto';

const SENSITIVE_PATTERNS = [
  /password/i, /apiKey/i, /accessToken/i, /refreshToken/i,
  /clientSecret/i, /webhookSecret/i, /authorization/i,
  /privateKey/i, /cvv/i, /creditCard/i, /secret/i, /token/i,
];

/**
 * Sanitize an object by removing sensitive fields.
 * Credentials, API keys, tokens, secrets MUST NEVER enter resilience records.
 */
export function sanitizeForAudit<T = any>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(p => p.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForAudit(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'object' && v !== null ? sanitizeForAudit(v) : v
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as unknown as T;
}

/**
 * Generate a unique correlation ID for tracking operations across systems.
 */
export function generateCorrelationId(): string {
  return `res_${crypto.randomUUID()}`;
}

/**
 * Generate a unique event code for recovery audit logs.
 */
export function generateEventCode(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
}

/**
 * Validate that an operation requiring elevated permissions is explicitly confirmed.
 * Dangerous operations (restore, failover, rollback, delete backups) MUST require confirmation.
 */
export function validateDangerousOperationConfirmation(confirmation: string | undefined, expectedConfirmation: string): boolean {
  if (!confirmation) return false;
  return confirmation === expectedConfirmation;
}

/**
 * Check if the operation is dangerous (requires elevated confirmation).
 */
export function isDangerousOperation(operationType: string): boolean {
  const dangerousOps = [
    'RESTORE_PRODUCTION',
    'FAILOVER_PRODUCTION',
    'ROLLBACK_PRODUCTION',
    'DELETE_BACKUP',
    'REPLACE_CONFIGURATION',
    'EXECUTE_RECOVERY',
    'CANCEL_RECOVERY',
  ];
  return dangerousOps.includes(operationType);
}

/**
 * Sanitize error messages to prevent credential leakage.
 */
export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Strip potential credential fragments from error messages
  return message
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]')
    .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=[REDACTED]')
    .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
    .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]')
    .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]');
}
