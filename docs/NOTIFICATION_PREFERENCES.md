# Recipient Preferences & Quiet Hours Policy

## Quiet Hours Calculation
Non-critical notifications scheduled during a recipient's quiet hours window (e.g., `22:00` to `08:00`) are automatically suppressed or deferred, setting status to `CANCELLED` and recording a `SUPPRESSED` event in `NotificationLog`.

## Global Suppression List
If a recipient's email address or phone number exists in `NotificationSuppression` under `BOUNCE`, `SPAM_COMPLAINT`, `UNSUBSCRIBE`, or `MANUAL_BLOCK`, dispatch is rejected instantly.
