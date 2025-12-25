import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';

import type { CloudFile, CloudBackup, CloudUploadRequest, CloudBackupRequest } from './cloud.model';
import { CloudStorageRepository } from './core/cloud-storage.repository';

@Injectable({ providedIn: 'root' })
export class CloudRepository {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly storageRepo = inject(CloudStorageRepository);
  readonly files = signal<CloudFile[]>([]);
  readonly backups = signal<CloudBackup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private getBucketName(blueprintId: string): string {
    return `blueprint-${blueprintId}`;
  }

  async uploadFile(blueprintId: string, request: CloudUploadRequest): Promise<CloudFile> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const bucket = this.getBucketName(blueprintId);
      const fileName = `${Date.now()}-${request.file.name}`;
      const filePath = request.path || `files/${fileName}`;

      const uploadResult = await this.storageRepo.uploadFile(bucket, filePath, request.file, {
        contentType: request.file.type,
        metadata: request.metadata
          ? {
              originalName: request.metadata.originalName || request.file.name,
              description: request.metadata.description || '',
              tags: request.metadata.tags?.join(',') || ''
            }
          : {}
      });

      const currentUserId = this.auth.currentUser?.uid || 'anonymous';

      const file: CloudFile = {
        id: '',
        blueprintId,
        name: request.file.name,
        path: uploadResult.path,
        size: request.file.size,
        mimeType: request.file.type,
        extension: request.file.name.split('.').pop() || '',
        url: uploadResult.publicUrl,
        publicUrl: request.isPublic ? uploadResult.publicUrl : undefined,
        status: 'synced',
        uploadedBy: currentUserId,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        metadata: request.metadata,
        bucket,
        isPublic: request.isPublic ?? false,
        version: 1,
        versionHistory: []
      };

      const filesCollection = collection(this.firestore, 'cloud_files');
      const docData: Record<string, unknown> = {
        blueprint_id: file.blueprintId,
        name: file.name,
        path: file.path,
        size: file.size,
        mime_type: file.mimeType,
        extension: file.extension,
        url: file.url,
        status: file.status,
        uploaded_by: file.uploadedBy,
        uploaded_at: Timestamp.fromDate(file.uploadedAt),
        updated_at: Timestamp.fromDate(file.updatedAt),
        metadata: file.metadata || {},
        bucket: file.bucket,
        is_public: file.isPublic,
        version: file.version || 1,
        version_history: file.versionHistory || []
      };

      if (file.publicUrl !== undefined) {
        docData['public_url'] = file.publicUrl;
      }

      const docRef = await addDoc(filesCollection, docData);

      file.id = docRef.id;
      this.files.update(files => [...files, file]);
      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async downloadFile(blueprintId: string, fileId: string): Promise<Blob> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const file = this.files().find(f => f.id === fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      const bucket = this.getBucketName(blueprintId);
      const downloadUrl = await this.storageRepo.downloadFile(bucket, file.path);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteFile(blueprintId: string, fileId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const file = this.files().find(f => f.id === fileId);
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      const bucket = this.getBucketName(blueprintId);
      await this.storageRepo.deleteFile(bucket, file.path);

      const fileDoc = doc(this.firestore, 'cloud_files', fileId);
      await deleteDoc(fileDoc);

      this.files.update(files => files.filter(f => f.id !== fileId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async updateFilePath(blueprintId: string, fileId: string, newPath: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const fileDoc = doc(this.firestore, 'cloud_files', fileId);
      await updateDoc(fileDoc, {
        path: newPath,
        updated_at: new Date()
      });

      this.files.update(files => files.map(f => (f.id === fileId ? { ...f, path: newPath, updatedAt: new Date() } : f)));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update path failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async listFiles(blueprintId: string): Promise<CloudFile[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const filesCollection = collection(this.firestore, 'cloud_files');
      const q = query(filesCollection, where('blueprint_id', '==', blueprintId));
      const querySnapshot = await getDocs(q);

      const files: CloudFile[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          blueprintId: data['blueprint_id'],
          name: data['name'],
          path: data['path'],
          size: data['size'],
          mimeType: data['mime_type'],
          extension: data['extension'],
          url: data['url'],
          publicUrl: data['public_url'],
          status: data['status'],
          uploadedBy: data['uploaded_by'],
          uploadedAt: data['uploaded_at']?.toDate() || new Date(),
          updatedAt: data['updated_at']?.toDate() || new Date(),
          metadata: data['metadata'],
          bucket: data['bucket'],
          isPublic: data['is_public'],
          version: data['version'] || 1,
          versionHistory: data['version_history'] || []
        };
      });

      files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      this.files.set(files);
      return files;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List files failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async createBackup(blueprintId: string, request: CloudBackupRequest): Promise<CloudBackup> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUserId = this.auth.currentUser?.uid || 'anonymous';

      const backup: CloudBackup = {
        id: '',
        blueprintId,
        name: request.name,
        description: request.description,
        type: 'manual',
        status: 'ready',
        size: 0,
        fileCount: request.fileIds?.length || 0,
        path: `backups/${blueprintId}/${Date.now()}-${request.name}.zip`,
        createdAt: new Date(),
        createdBy: currentUserId,
        isEncrypted: request.options?.encrypt ?? false,
        metadata: {
          includedFiles: request.fileIds,
          version: '1.0',
          custom: {}
        }
      };

      const backupsCollection = collection(this.firestore, 'cloud_backups');
      const docRef = await addDoc(backupsCollection, {
        blueprint_id: backup.blueprintId,
        name: backup.name,
        description: backup.description,
        type: backup.type,
        status: backup.status,
        size: backup.size,
        file_count: backup.fileCount,
        path: backup.path,
        created_at: Timestamp.fromDate(backup.createdAt),
        created_by: backup.createdBy,
        is_encrypted: backup.isEncrypted,
        metadata: backup.metadata
      });

      backup.id = docRef.id;
      this.backups.update(backups => [...backups, backup]);
      return backup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Create backup failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async listBackups(blueprintId: string): Promise<CloudBackup[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const backupsCollection = collection(this.firestore, 'cloud_backups');
      const q = query(backupsCollection, where('blueprint_id', '==', blueprintId));
      const querySnapshot = await getDocs(q);

      const backups: CloudBackup[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          blueprintId: data['blueprint_id'],
          name: data['name'],
          description: data['description'],
          type: data['type'],
          status: data['status'],
          size: data['size'],
          fileCount: data['file_count'],
          path: data['path'],
          createdAt: data['created_at']?.toDate() || new Date(),
          createdBy: data['created_by'],
          isEncrypted: data['is_encrypted'],
          metadata: data['metadata']
        };
      });

      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.backups.set(backups);
      return backups;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'List backups failed';
      this.error.set(errorMessage);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  clearState(): void {
    this.files.set([]);
    this.backups.set([]);
    this.error.set(null);
  }
}
