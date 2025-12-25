/**
 * File Utilities
 * 檔案工具函數
 *
 * Shared utilities for file operations
 * - File size formatting
 * - File icon detection
 * - File type utilities
 */

import type { CloudFile } from '../../cloud.model';

/**
 * Format file size from bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(file: CloudFile): string {
  const mimeType = file.mimeType.toLowerCase();

  if (mimeType.startsWith('image/')) return 'file-image';
  if (mimeType.startsWith('video/')) return 'video-camera';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'file-excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-ppt';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'file-zip';
  if (mimeType.includes('text')) return 'file-text';

  return 'file';
}

/**
 * Get file icon for tree node based on file extension
 */
export function getFileIconForTree(file: CloudFile): string {
  const ext = file.extension?.toLowerCase() || '';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return 'file-image';
  }

  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
    return 'video-camera';
  }

  // Documents
  if (ext === 'pdf') return 'file-pdf';
  if (['doc', 'docx'].includes(ext)) return 'file-word';
  if (['xls', 'xlsx'].includes(ext)) return 'file-excel';
  if (['ppt', 'pptx'].includes(ext)) return 'file-ppt';

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'file-zip';
  }

  // Text files
  if (['txt', 'md', 'csv'].includes(ext)) {
    return 'file-text';
  }

  // Default
  return 'file';
}

/**
 * Validate folder name
 */
export function isValidFolderName(name: string): boolean {
  return /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/.test(name);
}

/**
 * Extract folder path from file path
 */
export function getFolderFromPath(filePath: string): string {
  if (!filePath || !filePath.includes('/')) {
    return '';
  }
  return filePath.substring(0, filePath.lastIndexOf('/'));
}

/**
 * Build folder set from files
 */
export function buildFolderSet(files: CloudFile[]): Set<string> {
  const folders = new Set<string>();

  files.forEach(file => {
    const path = file.path || '';
    if (path.includes('/')) {
      const parts = path.split('/');
      parts.pop(); // Remove filename

      // Add all parent folders
      let currentPath = '';
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folders.add(currentPath);
      });
    }
  });

  return folders;
}
