/**
 * Storage Provider Interface for Document Management.
 * All storage backends (Local filesystem, S3, Memory) must implement this uniform interface.
 */

export interface StorageMetadata {
  storageReference: string;
  fileSizeBytes: number;
  mimeType?: string;
  checksum?: string;
  lastModified?: Date;
}

export interface StorageProvider {
  /**
   * Upload file buffer or string content and return storage metadata.
   */
  upload(
    path: string,
    content: Buffer | string,
    mimeType?: string
  ): Promise<StorageMetadata>;

  /**
   * Download file content as Buffer.
   */
  download(storageReference: string): Promise<Buffer>;

  /**
   * Delete file at storage reference.
   */
  delete(storageReference: string): Promise<boolean>;

  /**
   * Check if file exists at storage reference.
   */
  exists(storageReference: string): Promise<boolean>;

  /**
   * Copy file from source reference to destination path.
   */
  copy(sourceReference: string, destinationPath: string): Promise<StorageMetadata>;

  /**
   * Move/rename file from source reference to destination path.
   */
  move(sourceReference: string, destinationPath: string): Promise<StorageMetadata>;

  /**
   * Get metadata for file at storage reference.
   */
  getMetadata(storageReference: string): Promise<StorageMetadata | null>;

  /**
   * Generate short-lived signed access URL or token.
   */
  getSignedUrl(storageReference: string, expiresInSeconds?: number): Promise<string>;
}
