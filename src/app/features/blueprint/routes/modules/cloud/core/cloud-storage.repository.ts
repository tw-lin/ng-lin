import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadMetadata
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface UploadResult {
  path: string;
  publicUrl: string;
  url: string;
}

/**
 * Cloud Storage Repository
 *
 * Self-contained storage implementation using @angular/fire/storage directly.
 * Replaces dependency on @core/infrastructure/storage.
 */
@Injectable({ providedIn: 'root' })
export class CloudStorageRepository {
  private readonly storage = inject(Storage);
  /**
   * Upload file with progress tracking
   */
  upload(path: string, file: File | Blob, onProgress?: (progress: number) => void): Observable<string> {
    return new Observable(observer => {
      try {
        const storageRef = ref(this.storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          error => {
            observer.error(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              observer.next(downloadURL);
              observer.complete();
            } catch (err) {
              observer.error(err);
            }
          }
        );
      } catch (err) {
        observer.error(err);
      }
    });
  }

  /**
   * Upload file with full result (path, URL, publicUrl)
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: {
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
      isPublic?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      const fullPath = `${bucket}/${path}`;
      const storageRef = ref(this.storage, fullPath);

      // Build upload metadata
      const uploadMetadata: UploadMetadata = {};
      if (options?.contentType) {
        uploadMetadata.contentType = options.contentType;
      }
      if (options?.cacheControl) {
        uploadMetadata.cacheControl = options.cacheControl;
      }
      if (options?.metadata) {
        uploadMetadata.customMetadata = options.metadata;
      }

      const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);
      return {
        path: fullPath,
        url: downloadURL,
        publicUrl: downloadURL // Firebase Storage URLs are public by default
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Download file (get download URL)
   */
  async downloadFile(bucket: string, path: string): Promise<string> {
    try {
      const fullPath = path.startsWith(bucket) ? path : `${bucket}/${path}`;
      const storageRef = ref(this.storage, fullPath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Delete a file
   */
  async delete(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Delete a file (with bucket parameter for consistency)
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const fullPath = path.startsWith(bucket) ? path : `${bucket}/${path}`;
      const storageRef = ref(this.storage, fullPath);
      await deleteObject(storageRef);
    } catch (err) {
      throw err;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    path: string
  ): Promise<Array<{ name: string; fullPath: string; url: string; size?: number; contentType?: string; timeCreated?: string }>> {
    try {
      const storageRef = ref(this.storage, path);
      const listResult = await listAll(storageRef);

      const files = await Promise.all(
        listResult.items.map(async itemRef => {
          try {
            const [url, metadata] = await Promise.all([getDownloadURL(itemRef), getMetadata(itemRef)]);

            return {
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url,
              size: metadata.size,
              contentType: metadata.contentType,
              timeCreated: metadata.timeCreated
            };
          } catch (err) {
            // Return basic info if metadata fetch fails
            const url = await getDownloadURL(itemRef);
            return {
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url
            };
          }
        })
      );
      return files;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const storageRef = ref(this.storage, path);
      await getMetadata(storageRef);
      return true;
    } catch (err: any) {
      if (err?.code === 'storage/object-not-found') {
        return false;
      }
      throw err;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<{
    size: number;
    contentType: string;
    timeCreated: string;
    updated: string;
  }> {
    try {
      const storageRef = ref(this.storage, path);
      const metadata = await getMetadata(storageRef);

      return {
        size: metadata.size,
        contentType: metadata.contentType || 'application/octet-stream',
        timeCreated: metadata.timeCreated,
        updated: metadata.updated
      };
    } catch (err) {
      throw err;
    }
  }
}
