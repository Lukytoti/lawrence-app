import { StorageProvider } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

let activeProvider: StorageProvider | null = null;

export interface StorageConfigurationStatus {
  driver: 'local' | 's3';
  isCloud: boolean;
  isConfigured: boolean;
  bucket?: string;
  region?: string;
  localPath?: string;
  statusMessage: string;
}

export function getStorageConfigurationStatus(): StorageConfigurationStatus {
  const driver = (process.env.DOCUMENT_STORAGE_DRIVER || 'local') as 'local' | 's3';

  if (driver === 's3') {
    const bucket = process.env.DOCUMENT_STORAGE_BUCKET;
    const region = process.env.DOCUMENT_STORAGE_REGION || 'eu-west-1';
    const isConfigured = !!bucket;

    return {
      driver: 's3',
      isCloud: true,
      isConfigured,
      bucket: bucket || 'lawrence-documents-vault',
      region,
      statusMessage: isConfigured
        ? `S3 Cloud Storage configured on bucket '${bucket}' (${region})`
        : `S3 Cloud Storage driver selected but DOCUMENT_STORAGE_BUCKET is not explicitly set in environment`,
    };
  }

  const localPath = process.env.DOCUMENT_STORAGE_LOCAL_PATH || 'storage/documents';
  return {
    driver: 'local',
    isCloud: false,
    isConfigured: true,
    localPath,
    statusMessage: `Local Filesystem Storage active at '${localPath}'`,
  };
}

export function getStorageProvider(): StorageProvider {
  if (!activeProvider) {
    const driver = process.env.DOCUMENT_STORAGE_DRIVER || 'local';
    if (driver === 's3') {
      activeProvider = new S3StorageProvider();
    } else {
      activeProvider = new LocalStorageProvider();
    }
  }
  return activeProvider;
}

export function setStorageProvider(provider: StorageProvider): void {
  activeProvider = provider;
}
