/**
 * Cloud Storage Domain Models
 * 雲端儲存域資料模型
 */

export interface CloudFile {
  id: string;
  blueprintId: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  url?: string;
  publicUrl?: string;
  status: 'uploading' | 'synced' | 'pending' | 'error';
  uploadProgress?: number;
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  metadata?: {
    originalName?: string;
    description?: string;
    tags?: string[];
    relatedTo?: string;
    relatedType?: string;
    custom?: Record<string, unknown>;
  };
  bucket?: string;
  checksum?: string;
  isPublic: boolean;
  expiresAt?: Date;
  version?: number;
  versionHistory?: CloudFileVersion[];
  parentVersionId?: string;
}

export interface CloudFileVersion {
  id: string;
  versionNumber: number;
  path: string;
  size: number;
  checksum?: string;
  createdBy: string;
  createdAt: Date;
  comment?: string;
  isCurrent: boolean;
}

export interface CloudBackup {
  id: string;
  blueprintId: string;
  name: string;
  description?: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'creating' | 'ready' | 'restoring' | 'error';
  size: number;
  fileCount: number;
  path: string;
  createdAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  metadata?: {
    includedFiles?: string[];
    trigger?: string;
    version?: string;
    custom?: Record<string, unknown>;
  };
  checksum?: string;
  isEncrypted: boolean;
}

export interface CloudStorageStats {
  totalFiles: number;
  storageUsed: number;
  storageLimit: number;
  usagePercentage: number;
  filesByType: Record<string, number>;
  totalUploads: number;
  totalDownloads: number;
  totalBackups: number;
  lastSyncAt?: Date;
  lastBackupAt?: Date;
}

export interface CloudUploadRequest {
  file: File;
  path?: string;
  metadata?: CloudFile['metadata'];
  isPublic?: boolean;
  options?: {
    overwrite?: boolean;
    compress?: boolean;
    thumbnail?: boolean;
  };
}

export interface CloudDownloadRequest {
  fileId: string;
  asAttachment?: boolean;
  filename?: string;
}

export interface CloudBackupRequest {
  name: string;
  description?: string;
  fileIds?: string[];
  options?: {
    compress?: boolean;
    encrypt?: boolean;
    retentionDays?: number;
  };
}

export interface CloudRestoreRequest {
  backupId: string;
  targetPath?: string;
  options?: {
    overwrite?: boolean;
    fileIds?: string[];
  };
}
