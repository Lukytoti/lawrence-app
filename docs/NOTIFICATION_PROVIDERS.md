# Notification Provider Abstraction Layer

## Supported Adapters
- `SMTP` / `SENDGRID`: Transmits transactional emails with recipient fallback.
- `TWILIO`: Transmits SMS mobile messages.
- `WHATSAPP_CLOUD`: Transmits WhatsApp API messages.
- `IN_APP`: Instantiates persistent system `Notification` records.
- `WEBHOOK_HTTP`: Signs HTTP POST payloads using HMAC SHA-256 signatures.
