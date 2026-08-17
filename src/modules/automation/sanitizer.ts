const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'auth',
  'authorization',
  'cvv',
  'creditcard',
  'cardnumber',
  'privatekey',
];

/**
 * Sanitizes object metadata recursively to mask sensitive keys before logging or outputting.
 */
export function sanitizeMetadata(input: any): any {
  if (!input) return input;

  if (typeof input === 'string') {
    // Check if it's JSON
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(sanitizeMetadata(parsed));
    } catch (err) {
      return input;
    }
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeMetadata);
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else {
        sanitized[key] = sanitizeMetadata(input[key]);
      }
    }
    return sanitized;
  }

  return input;
}
