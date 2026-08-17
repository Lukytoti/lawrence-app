import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, StorageMetadata } from './interface';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.env.DOCUMENT_STORAGE_PATH || path.resolve(process.cwd(), '.storage/documents');
  }

  private resolvePath(storageRef: string): string {
    // Sanitize path to prevent path traversal
    const safeRef = storageRef.replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');
    const fullPath = path.resolve(this.baseDir, safeRef);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Path traversal detected');
    }
    return fullPath;
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
    const safePath = filePath.replace(/^[\\\/]+/, '');
    const targetPath = this.resolvePath(safePath);
    const targetDir = path.dirname(targetPath);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, buffer);

    const checksum = this.computeChecksum(buffer);

    return {
      storageReference: safePath.replace(/\\/g, '/'),
      fileSizeBytes: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
      checksum,
      lastModified: new Date(),
    };
  }

  async download(storageReference: string): Promise<Buffer> {
    const targetPath = this.resolvePath(storageReference);
    return await fs.readFile(targetPath);
  }

  async delete(storageReference: string): Promise<boolean> {
    try {
      const targetPath = this.resolvePath(storageReference);
      await fs.unlink(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageReference: string): Promise<boolean> {
    try {
      const targetPath = this.resolvePath(storageReference);
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceReference: string, destinationPath: string): Promise<StorageMetadata> {
    const src = this.resolvePath(sourceReference);
    const dest = this.resolvePath(destinationPath);
    const destDir = path.dirname(dest);

    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(src, dest);

    const buffer = await fs.readFile(dest);
    const checksum = this.computeChecksum(buffer);

    return {
      storageReference: destinationPath.replace(/\\/g, '/'),
      fileSizeBytes: buffer.length,
      checksum,
      lastModified: new Date(),
    };
  }

  async move(sourceReference: string, destinationPath: string): Promise<StorageMetadata> {
    const meta = await this.copy(sourceReference, destinationPath);
    await this.delete(sourceReference);
    return meta;
  }

  async getMetadata(storageReference: string): Promise<StorageMetadata | null> {
    try {
      const targetPath = this.resolvePath(storageReference);
      const stats = await fs.stat(targetPath);
      const buffer = await fs.readFile(targetPath);
      const checksum = this.computeChecksum(buffer);

      return {
        storageReference: storageReference.replace(/\\/g, '/'),
        fileSizeBytes: stats.size,
        checksum,
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  async getSignedUrl(storageReference: string, expiresInSeconds: number = 3600): Promise<string> {
    // Generate a secure HMAC-signed token for server-mediated download endpoint
    const secret = process.env.NEXTAUTH_SECRET || 'lawrence-doc-signing-secret';
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${storageReference}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return `/api/documents/download?ref=${encodeURIComponent(storageReference)}&exp=${expiresAt}&sig=${signature}`;
  }
}
