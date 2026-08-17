# API Gateway & HTTP Request Specification

## 1. Overview
The API Gateway layer standardizes outbound HTTP requests to external third-party REST services (e.g. Stripe, HubSpot, GoHighLevel, QuickBooks, Twilio).

## 2. Technical Features
- **Correlation ID Propagation**: Generates unique `INT-CORR-<uuid>` tracking headers for cross-system request tracing.
- **Request Timeout Guards**: Standard default timeout of 30,000ms per request.
- **Sanitized Audit Logging**: Automatically scrubs authorization headers, bearer tokens, API keys, and sensitive payload fields before writing to `IntegrationLog`.
- **SSRF Validation**: Pre-validates destination URLs before socket connection.
