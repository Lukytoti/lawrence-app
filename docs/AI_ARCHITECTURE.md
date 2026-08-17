# Module 15 — AI Leadership Assistant & Executive Co-Pilot Architecture

## Overview
Module 15 serves as the natural language intelligence, RAG context synthesis, automated strategic insight generation, and 1-on-1 coaching authority for the Business Productivity & Leadership Operating System.

## Primary Principles
1. **Unified AI Authority**: Manages conversations (`AiConversation`), message streams (`AiMessage`), strategic insights (`AiInsight`), coaching templates (`AiCoachingPrompt`), system recommendations (`AiRecommendation`), knowledge vector indices (`AiKnowledgeIndex`), user daily quotas (`AiUsageQuota`), and cost tracking (`AiAuditLog`).
2. **Read-Only RAG Synthesis**: Aggregates real-time domain context across all 14 previously completed business engines (Qualification, CRM, Productivity, Double-Entry Ledger, Compensation, Projects, Billing, Retention, Automation, Notifications) without direct financial table mutations.
3. **Financial Ledger Isolation**: Zero direct mutations on `FinancialAccount`, `JournalTransaction`, or `JournalEntry`.
4. **Sensitive Data Masking**: All LLM input streams are processed by `sanitizer.ts` to redact passwords, API keys, bearer tokens, credit card numbers, and PII/PCI before context injection.
5. **Usage Quota Protection**: Enforces daily prompt limits (default: 100 prompts/day) and tracks cumulative token consumption.
