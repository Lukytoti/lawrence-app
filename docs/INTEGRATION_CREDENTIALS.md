# Credential Reference Isolation Specification

## 1. Zero Plaintext Secret Rule
Plaintext API keys, OAuth access tokens, refresh tokens, and webhook secrets MUST NEVER appear in:
- Database tables or Prisma JSON fields
- System logs (`IntegrationLog`, audit trail)
- AI assistant prompts or context payloads
- Browser responses or UI client state

## 2. Reference Architecture
Credentials are stored in a server-side secret vault returning opaque token references (`cred_ref_<uuid>`).
When credentials are required for provider authentication, `retrieveCredential(ref)` fetches secrets strictly in server-side memory.
`maskCredentialReference(ref)` masks reference strings for display in administrative UI views.
