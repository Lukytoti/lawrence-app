# Synchronization Retries & Dead-Letter Queue (DLQ)

## 1. Retry Strategy
- **Max Attempt Limit**: Default 5 execution attempts per job.
- **Exponential Backoff Schedule**:
  - Attempt 1: Immediate (0s)
  - Attempt 2: 30 seconds
  - Attempt 3: 2 minutes (120s)
  - Attempt 4: 10 minutes (600s)
  - Attempt 5: 30 minutes (1800s)
- **Jitter Protection**: Adds ±10% randomized jitter to prevent thundering herd spikes.

## 2. Error Classification
- **Retryable Errors**: HTTP 500, 502, 503, 504, rate limits (HTTP 429), network timeouts.
- **Non-Retryable Errors**: HTTP 401 Unauthorized, HTTP 403 Forbidden, SSRF policy blocks, invalid signature verification failures. Non-retryable errors transition directly to `DEAD_LETTER`.
