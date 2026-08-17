# Deterministic Churn Detection

## 1. Explainable Rules
Churn risk is evaluated using deterministic, explainable thresholds rather than opaque ML models:
- Combined active risk signals (overdue invoices + project blockages + expiring contract + low touchpoints).
- Critical health score (< 40).
- Open critical retention case.

## 2. Signal Logging
Every risk signal is saved in `ClientRiskSignal` with source domain (`BILLING`, `PROJECT`, `CRM`, `CONTRACT`, `ENGAGEMENT`) and severity.
