# Document Retention, Archival & Legal Holds (Module 21)

## 1. Record Retention Policies
Organizations configure compliance retention rules via `RecordRetentionPolicy`:
- **Matching Criteria**: Document type (e.g. `CONTRACT`, `FINANCIAL`, `REPORT`, `COMPLIANCE`).
- **Retention Duration**: Defined in days (`retentionDays`).
- **Action Triggers**: `autoArchive` (moves to `ARCHIVED` status) and `autoDelete` (purges expired records).

## 2. Legal Preservation Holds (`RecordLegalHold`)
Legal holds represent absolute preservation locks placed on sensitive or disputed documents.

### Inviolable Preservation Rules:
1. **Precedence Over Deletion**: A document under an active legal hold **cannot be deleted** by any user, including Super Admin.
2. **Precedence Over Retention Auto-Pruning**: The automated retention job strictly filters out documents with active legal holds (`where: { legalHolds: { none: { status: 'ACTIVE' } } }`).
3. **Audit Trail**: Placing or releasing a legal hold creates immutable records in `DocumentActivityLog` with correlation IDs.
