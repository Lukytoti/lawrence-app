# Anomaly Detection Methodology

## Principles
1. **Conservative Rule-Based Logic**: Uses deterministic thresholds based on historical baseline comparisons.
2. **Neutral Terminology**: Uses explainable, objective labels (`ANOMALY`, `ATTENTION_REQUIRED`, `UNUSUAL_CHANGE`). Never uses accusatory terminology.
3. **Read-Only Intelligence**: Anomaly detection emits alert signals for executive decision support without automatically altering financial balances or member statuses.

## Initial Anomaly Signals
- `qpv_drop`: Triggered when QPV volume drops >25% compared to previous period baseline.
- `crm_conversion_drop`: Triggered when CRM lead conversion drops >30% compared to previous baseline.
- `withdrawal_surge`: Triggered when requested withdrawal volume surges >200% compared to previous baseline.
