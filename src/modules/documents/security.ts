import crypto from 'crypto';
import path from 'path';

// Max file size: 50MB
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.dll',
  '.scr', '.msi', '.php', '.phtml', '.com', '.ps1', '.jar'
]);

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/zip',
  'application/octet-stream',
]);

const SENSITIVE_PATTERNS = [
  /password/i, /apiKey/i, /accessToken/i, /refreshToken/i,
  /clientSecret/i, /webhookSecret/i, /authorization/i,
  /privateKey/i, /cvv/i, /creditCard/i, /secret/i, /token/i,
  /databaseUrl/i, /connectionString/i,
];

/**
 * Sanitize filename to prevent directory traversal and injection.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return `file_${Date.now()}`;
  // Remove path traversal and illegal characters
  let clean = filename
    .replace(/^.*[\\\/]/, '') // remove directory paths
    .replace(/(\.\.[\/\\])+/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim();

  if (!clean || clean === '.' || clean === '..') {
    clean = `file_${Date.now()}`;
  }
  return clean;
}

/**
 * Validate that a file does not contain blocked extensions or path traversal patterns.
 */
export function validateFileSafety(filename: string, fileSizeBytes?: number, mimeType?: string): void {
  const cleanName = sanitizeFilename(filename);
  const ext = path.extname(cleanName).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error(`Upload rejected: File extension '${ext}' is prohibited for security reasons`);
  }

  if (cleanName.includes('..') || cleanName.startsWith('/') || cleanName.startsWith('\\')) {
    throw new Error('Upload rejected: Invalid filename path traversal attempt detected');
  }

  if (fileSizeBytes !== undefined && fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Upload rejected: File size ${fileSizeBytes} bytes exceeds limit of ${MAX_FILE_SIZE_BYTES} bytes`);
  }

  if (mimeType && mimeType.includes('javascript') || mimeType?.startsWith('text/javascript')) {
    throw new Error('Upload rejected: Executable MIME types are forbidden');
  }
}

/**
 * Compute SHA-256 Checksum of buffer or string.
 */
export function computeSha256Checksum(content: Buffer | string): string {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sanitize sensitive credentials from metadata, logs, and responses.
 */
export function sanitizeForAudit<T = any>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item =>
      typeof item === 'object' && item !== null ? sanitizeForAudit(item) : item
    ) as unknown as T;
  }

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
 * Sanitize error message to prevent database connection string or credential leakage.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return 'An unexpected error occurred';
  return message
    .replace(/postgres(ql)?:\/\/[^@\s]+@[^\s]+/gi, 'postgres://[REDACTED]')
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/key=[a-zA-Z0-9_\-\.]+/gi, 'key=[REDACTED]');
}

/**
 * Generate a unique correlation ID for tracking operations.
 */
export function generateCorrelationId(prefix: string = 'DOC'): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
}
