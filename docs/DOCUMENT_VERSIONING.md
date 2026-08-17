# Document Versioning & Immutability Engine (Module 21)

## 1. Version Lifecycle & Incremental Sequencing
1. **Initial Upload**: Creates `Document` and `DocumentVersion` with `versionNumber = 1` and `versionCode = VER_...`.
2. **Subsequent Uploads**: Fetches the maximum existing version number and atomically increments to `N+1`.
3. **Database Constraints**: Enforces `@@unique([documentId, versionNumber])` to prevent duplicate or conflicting versions during concurrent uploads.

## 2. Version Immutability
- Once written, historical versions cannot be altered in-place.
- Updating document metadata does not mutate version storage references or checksums.

## 3. Version Restoration Protocol
Restoring an older version (e.g. restoring version 1 when version 4 is active) **does not overwrite or revert database history**. Instead, it:
1. Retrieves the binary data from the target historical version.
2. Creates a **new sequential version (version 5)** containing that content.
3. Sets `changeSummary = 'Restored content from version 1 (VER_...)'`.
4. Updates `Document.currentVersionId` to the newly created version.
5. Emits `DocumentVersionRestored` on the `EventBus`.
