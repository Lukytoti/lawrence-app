# Multi-Channel Message Dispatch Engine

## Dispatch Lifecycle
1. **Idempotency Guard**: Query `NotificationMessage` by `idempotencyKey` @unique constraint.
2. **Template Substitution**: Evaluate `{{placeholder}}` variables against input payload.
3. **Preference Evaluation**: Check channel opt-ins, category preferences, global suppression list, and quiet hours window (`08:00` to `22:00`).
4. **Provider Dispatch**: Route to concrete provider implementation (`InAppNotificationProvider`, `EmailNotificationProvider`, `SmsNotificationProvider`, `WhatsAppNotificationProvider`, `WebhookNotificationProvider`).
5. **Delivery Logging**: Record `NotificationDelivery` and `NotificationLog` entries with sanitized metadata.
