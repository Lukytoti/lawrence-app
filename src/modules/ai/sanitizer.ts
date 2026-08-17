/**
 * Sanitizes sensitive fields (passwords, secrets, tokens, API keys, PCI/PII)
 * before passing data to LLM processing engines or storing in message logs.
 */
export function sanitizeAiInput(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Mask passwords/secrets/tokens in key-value pairs or JSON strings
  sanitized = sanitized.replace(
    /"(password|secret|token|apiKey|creditCard|cvv|ssn)":\s*"[^"]+"/gi,
    '"$1": "[REDACTED_SENSITIVE_DATA]"'
  );

  // Mask credit card numbers (13-19 digits)
  sanitized = sanitized.replace(
    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
    '[REDACTED_CARD_NUMBER]'
  );

  // Mask Bearer tokens
  sanitized = sanitized.replace(
    /Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi,
    'Bearer [REDACTED_TOKEN]'
  );

  return sanitized;
}
