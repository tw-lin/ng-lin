import { Injectable, inject, computed } from '@angular/core';

import type {
  CloudFile,
  CloudBackup,
  CloudUploadRequest,
  CloudDownloadRequest,
  CloudBackupRequest,
  CloudRestoreRequest,
  CloudStorageStats
} from './cloud.model';
import { CloudRepository } from './cloud.repository';

@Injectable({ providedIn: 'root' })
export class CloudService {
  private readonly repository = inject(CloudRepository);
  readonly files = this.repository.files;
  readonly backups = this.repository.backups;
  readonly loading = this.repository.loading;
  readonly error = this.repository.error;

  readonly stats = computed<CloudStorageStats>(() => {
    const files = this.files();
    const backups = this.backups();

    const totalFiles = files.length;
    const storageUsed = files.reduce((sum, file) => sum + file.size, 0);
    const storageLimit = 10737418240; // 10GB

    return {
      totalFiles,
      storageUsed,
      storageLimit,
      usagePercentage: (storageUsed / storageLimit) * 100,
      filesByType: this.calculateFilesByType(files),
      totalUploads: files.length,
      totalDownloads: 0,
      totalBackups: backups.length,
      lastSyncAt: files.length > 0 ? files[0].uploadedAt : undefined,
      lastBackupAt: backups.length > 0 ? backups[0].createdAt : undefined
    };
  });

  async loadFiles(blueprintId: string): Promise<void> {
    try {
      await this.repository.listFiles(blueprintId);
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(blueprintId: string, request: CloudUploadRequest): Promise<CloudFile> {
    try {
      const file = await this.repository.uploadFile(blueprintId, request);
      return file;
    } catch (error) {
      throw error;
    }
  }

  async downloadFile(blueprintId: string, request: CloudDownloadRequest): Promise<Blob> {
    try {
      return await this.repository.downloadFile(blueprintId, request.fileId);
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(blueprintId: string, fileId: string): Promise<void> {
    try {
      await this.repository.deleteFile(blueprintId, fileId);
    } catch (error) {
      throw error;
    }
  }

  async updateFilePath(blueprintId: string, fileId: string, newPath: string): Promise<void> {
    try {
      await this.repository.updateFilePath(blueprintId, fileId, newPath);
    } catch (error) {
      throw error;
    }
  }

  async createBackup(blueprintId: string, request: CloudBackupRequest): Promise<CloudBackup> {
    try {
      return await this.repository.createBackup(blueprintId, request);
    } catch (error) {
      throw error;
    }
  }

  async restoreBackup(blueprintId: string, request: CloudRestoreRequest): Promise<void> {
    // Placeholder: add actual restore logic when backend is ready
  }

  async loadBackups(blueprintId: string): Promise<void> {
    try {
      await this.repository.listBackups(blueprintId);
    } catch (error) {
      throw error;
    }
  }

  clearState(): void {
    this.repository.clearState();
  }

  private calculateFilesByType(files: CloudFile[]): Record<string, number> {
    const byType: Record<string, number> = {};
    files.forEach(file => {
      const type = file.mimeType.split('/')[0] || 'other';
      byType[type] = (byType[type] || 0) + 1;
    });
    return byType;
  }
}
