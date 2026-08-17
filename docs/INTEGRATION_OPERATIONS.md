# Integration Operational Controls & Monitoring

## 1. Workspaces & Navigation
- `/integrations`: Main Integration Engine & API Gateway dashboard.
- `/integrations/providers`: Provider catalog and registration.
- `/integrations/connections`: Active connections and environment auth.
- `/integrations/webhooks`: Inbound/outbound webhook list.
- `/integrations/mappings`: Data mapping rules.
- `/integrations/jobs`: Sync jobs & retry schedules.
- `/integrations/dead-letters`: DLQ management (inspect, retry, discard).
- `/integrations/logs`: Sanitized gateway execution logs.
- `/admin/integrations`: Super Admin Integration Gateway controls.

## 2. Telemetry & Health Checks
`IntegrationHealth` monitors connections with health statuses (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `UNKNOWN`), tracking latency in milliseconds, success rates, and error rates.
