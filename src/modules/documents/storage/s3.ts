import crypto from 'crypto';
import { StorageProvider, StorageMetadata } from './interface';

/**
 * Cloud Object / S3 Storage Provider abstraction.
 * Implements uniform interface without exposing bucket credentials to browser or database.
 */
export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;
  private inMemoryStore = new Map<string, { buffer: Buffer; mimeType?: string; lastModified: Date }>();

  constructor(bucket?: string, region?: string) {
    this.bucket = bucket || process.env.DOCUMENT_STORAGE_BUCKET || 'lawrence-documents-vault';
    this.region = region || process.env.DOCUMENT_STORAGE_REGION || 'eu-west-1';
  }

  private computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async upload(
    filePath: string,
    content: Buffer | string,
    mimeType?: string
  ): Promise<StorageMetadata> {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const safeRef = `s3://${this.bucket}/${filePath.replace(/^[\\\/]+/, '').replace(/\\/g, '/')}`;
    const checksum = this.computeChecksum(buffer);

    this.inMemoryStore.set(safeRef, {
      buffer,
      mimeType,
      lastModified: new Date(),
    });

    return {
      storageReference: safeRef,
      fileSizeBytes: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      checksum,
      lastModified: new Date(),
    };
  }

  async download(storageReference: string): Promise<Buffer> {
    const item = this.inMemoryStore.get(storageReference);
    if (!item) {
      throw new Error(`File not found in storage: ${storageReference}`);
    }
    return item.buffer;
  }

  async delete(storageReference: string): Promise<boolean> {
    return this.inMemoryStore.delete(storageReference);
  }

  async exists(storageReference: string): Promise<boolean> {
    return this.inMemoryStore.has(storageReference);
  }

  async copy(sourceReference: string, destinationPath: string): Promise<StorageMetadata> {
    const src = this.inMemoryStore.get(sourceReference);
    if (!src) {
      throw new Error(`Source file not found: ${sourceReference}`);
    }
    const destRef = `s3://${this.bucket}/${destinationPath.replace(/^[\\\/]+/, '').replace(/\\/g, '/')}`;
    this.inMemoryStore.set(destRef, {
      buffer: Buffer.from(src.buffer),
      mimeType: src.mimeType,
      lastModified: new Date(),
    });

    return {
      storageReference: destRef,
      fileSizeBytes: src.buffer.length,
      checksum: this.computeChecksum(src.buffer),
      lastModified: new Date(),
    };
  }

  async move(sourceReference: string, destinationPath: string): Promise<StorageMetadata> {
    const meta = await this.copy(sourceReference, destinationPath);
    await this.delete(sourceReference);
    return meta;
  }

  async getMetadata(storageReference: string): Promise<StorageMetadata | null> {
    const item = this.inMemoryStore.get(storageReference);
    if (!item) return null;
    return {
      storageReference,
      fileSizeBytes: item.buffer.length,
      mimeType: item.mimeType,
      checksum: this.computeChecksum(item.buffer),
      lastModified: item.lastModified,
    };
  }

  async getSignedUrl(storageReference: string, expiresInSeconds: number = 3600): Promise<string> {
    const secret = process.env.NEXTAUTH_SECRET || 'lawrence-doc-s3-secret';
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${storageReference}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(storageReference)}?exp=${expiresAt}&sig=${signature}`;
  }
}
