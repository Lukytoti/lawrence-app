# Notification Security & Credential Sanitization

## Secret Redaction Policy
All notification metadata, template variables, log messages, and error tracebacks pass through `sanitizeNotificationMetadata()` before database persistence.
Keys containing `password`, `secret`, `token`, `apiKey`, `authorization`, `cvv`, `creditCard` are replaced with `[REDACTED_SENSITIVE_DATA]`.
