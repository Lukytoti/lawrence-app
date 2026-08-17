# Automation Events & EventBus Coordination

## Registered AppEvent Types
- `AutomationTriggered`
- `AutomationStarted`
- `AutomationStepCompleted`
- `AutomationCompleted`
- `AutomationFailed`
- `AutomationRetryScheduled`
- `AutomationApprovalRequired`

Events are published strictly after successful database transactions.
