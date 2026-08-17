# AI Usage Quota & Token Consumption Management

## Quota Policy
- **Default Limit**: 100 prompts per day per user.
- **Daily Reset**: Automatically resets at 00:00 UTC based on calendar day comparison (`lastResetDate`).
- **Token Tracking**: Cumulative token consumption recorded in `AiUsageQuota.totalTokensConsumed`.
- **Quota Exceeded Error**: Throws explicit exception when limit is hit to prevent API abuse.
