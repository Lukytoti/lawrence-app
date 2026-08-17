# Document Storage & Provider Abstraction (Module 21)

## 1. Storage Provider Design
The storage layer abstracts physical binary storage behind the uniform `StorageProvider` interface (`src/modules/documents/storage/interface.ts`).

```typescript
export interface StorageProvider {
  store(key: string, data: Buffer | string, metadata?: Record<string, any>): Promise<StorageMetadata>;
  retrieve(storageReference: string): Promise<Buffer>;
  delete(storageReference: string): Promise<boolean>;
  getMetadata(storageReference: string): Promise<StorageMetadata>;
  generatePresignedUrl?(storageReference: string, expiresInSeconds: number): Promise<string>;
}
```

## 2. Storage Implementations

### 2.1 Local Storage Provider (`LocalStorageProvider`)
- **Root Directory**: `storage/documents` within the workspace.
- **Path Traversal Protection**: Validates that all resolved file paths reside strictly within the configured root directory using `path.resolve` and normalized prefix validation.
- **Checksum Calculation**: Generates SHA-256 hashes during write and verifies on read.

### 2.2 S3 Cloud Object Storage Provider (`S3StorageProvider`)
- **Bucket Architecture**: Encrypted at rest via AWS KMS (`aws:kms`).
- **Object Key Scheme**: `documents/{documentId}/{versionCode}_{filename}`.
- **Pre-signed Access**: Generates time-bounded pre-signed URLs for authenticated downloads without exposing backend storage credentials.

## 3. Storage Provider Factory
The `getStorageProvider()` factory dynamically initializes the configured provider based on the `DOCUMENT_STORAGE_PROVIDER` environment variable (defaults to `local`).
