# Document Security, Integrity & Sanitization (Module 21)

## 1. File Safety & MIME Verification
Every file processed by Module 21 passes through `validateFileSafety()`:
1. **Extension Blacklisting**: Prohibits `.exe`, `.dll`, `.bat`, `.cmd`, `.sh`, `.php`, `.jsp`, `.asp`, `.js`, `.vbs`, `.ps1`, `.scr`.
2. **MIME Whitelisting**: Prohibits executable MIME types such as `application/x-msdownload`, `application/x-sh`, `application/javascript`.
3. **Size Limit Enforcement**: Rejects any file payload exceeding 50 MB.
4. **Filename Sanitization**: Removes all relative path tokens (`../`, `..\`), special characters, and non-ASCII control characters via `sanitizeFilename()`.

## 2. Integrity Verification via SHA-256
Every document upload and sequential version calculates an immutable SHA-256 cryptographic checksum (`computeSha256Checksum()`). Checksums are stored in `DocumentVersion.checksum` and `Document.checksum` to detect tampering or silent data corruption.

## 3. Metadata & Audit Sanitization
Audit logs, error telemetry, and metadata dictionaries undergo recursive redaction via `sanitizeForAudit()`:
- Redacts keys matching `password`, `secret`, `token`, `key`, `credential`, `auth`, `card`, `private`, `pin`.
- Sanitizes connection strings in error logs via `sanitizeErrorMessage()`.
