# AI Engine Security & Privacy Controls

## Security Protections
1. **Server-Side Authorization**: All Server Actions and App Router routes enforce `assertAiPermission(userId, code)`.
2. **Super Admin Isolation**: Super Admin (`oluwatobi@lawrenceapp.internal`) possesses global governance over AI prompts, quotas, and audit logs.
3. **PCI/PII & Credential Masking**: Regex sanitizers scrub passwords, bearer tokens, API keys, and credit card numbers before LLM processing.
4. **Financial Ledger Isolation**: Module 15 has zero direct table access to mutate `FinancialAccount`, `JournalTransaction`, or `JournalEntry`.
