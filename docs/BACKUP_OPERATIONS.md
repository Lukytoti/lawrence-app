# Backup Operations & Storage Verification Protocol

## 1. Overview
The Backup Governance Engine (`src/modules/resilience/backups.ts`) manages automated backup scheduling, cryptographic checksum verification, storage reference tracking, and retention expiration.

## 2. Core Operational Principles
- **Created vs. Verified Distinction**: A backup returning process exit 0 is marked `status: COMPLETED` with `verificationStatus: PENDING`. It is NOT certified as recoverable until `verifyBackup()` confirms SHA-256 checksum and size validity.
- **Credential Protection**: Storage references (`storageReference`) store S3/vault URI identifiers only; credentials, tokens, or access keys are strictly prohibited from database persistence.
- **Retention Lifecycle**: `checkBackupRetention()` evaluates retention windows against `plan.retentionDays` and flags expired backups for lifecycle cleanup.

## 3. Supported Backup Types
- `FULL`: Complete snapshot of PostgreSQL cluster data and schema.
- `INCREMENTAL`: WAL (Write-Ahead Logging) sequence segments.
- `DIFFERENTIAL`: Changes since last full baseline.
- `SNAPSHOT`: Cloud block storage point-in-time snapshot.
- `CONFIGURATION`: Application configuration, environment metadata, and rules.
- `DOCUMENT`: Storage vault documents and compliance evidence archives.

## 4. Verification Checkpoint Matrix
1. **Size Validation**: Payload size > 0 bytes.
2. **Cryptographic Checksum**: 64-character hex SHA-256 hash calculated at ingestion and re-verified.
3. **Metadata Completeness**: Correlated `BackupExecution` record linked to authoritative `BackupPlan`.
4. **Audit Trail**: Emission of `BACKUP_VERIFIED` event in `RecoveryAuditLog`.
