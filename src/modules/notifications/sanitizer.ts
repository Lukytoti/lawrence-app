/**
 * Sensitive credential & PCI/PII sanitization utility for Module 14 Notifications
 */
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'authorization',
  'cvv',
  'creditcard',
  'cardnumber',
  'ssn',
  'privatekey',
];

export function sanitizeNotificationMetadata(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(sanitizeObject(parsed));
      }
    } catch {
      // Return plain string
    }
    return data;
  }

  if (typeof data === 'object') {
    return sanitizeObject(data);
  }

  return data;
}

function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}
