# Automation Engine Operational Guide

## 1. Retry Engine
Workflows support configurable retries (`maxRetries = 3`). Retries update status to `RETRYING` and log step error tracebacks.

## 2. Scheduled Workflows
`processDueAutomationSchedules()` executes recurring workflows deterministically using cron expressions and timezone settings. Idempotency keys prevent duplicate execution runs.
