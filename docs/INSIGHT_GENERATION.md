# Automated Strategic AI Insight Generation

## Insight Scanner Rules
1. **Financial Overdue Invoices**: Scans `Invoice` table for `OVERDUE` status and raises `HIGH` or `MEDIUM` severity financial insights.
2. **Client Retention Risks**: Scans `ClientRetentionCase` for `HIGH` risk level and raises `CRITICAL` retention insights.
3. **Automated Workflow Errors**: Scans `AutomationExecution` for `FAILED` status and raises `MEDIUM` project/automation insights.
4. **Normal Operations Baseline**: Generates low-severity organizational growth insights when all systems run within healthy thresholds.
