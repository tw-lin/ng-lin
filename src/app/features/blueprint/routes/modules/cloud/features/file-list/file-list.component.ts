/**
 * File List Component
 * 檔案列表元件
 *
 * Purpose: Display file list table with actions
 * Features: File table, search, download, delete
 */

import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';

import type { CloudFile } from '../../cloud.model';

@Component({
  selector: 'app-file-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzEmptyModule, NzSpinModule, NzPopconfirmModule],
  template: `
    @if (loading() && files().length === 0) {
      <nz-spin nzSimple nzTip="載入中..." />
    } @else if (files().length === 0) {
      <nz-empty nzNotFoundContent="暫無檔案，請上傳第一個檔案" [nzNotFoundImage]="'simple'" />
    } @else {
      <nz-table #fileTable [nzData]="files()" [nzSize]="'small'" [nzLoading]="loading()" [nzPageSize]="20">
        <thead>
          <tr>
            <th>檔案名稱</th>
            <th>大小</th>
            <th>上傳時間</th>
            <th nzWidth="120px">操作</th>
          </tr>
        </thead>
        <tbody>
          @for (file of fileTable.data; track file.id) {
            <tr [class.selected-row]="selectedFileId() === file.id" (click)="fileSelect.emit(file)">
              <td>
                <span nz-icon [nzType]="getFileIcon(file)" class="mr-sm"></span>
                {{ file.name }}
              </td>
              <td>{{ formatFileSize(file.size) }}</td>
              <td>{{ file.uploadedAt | date: 'yyyy-MM-dd HH:mm' }}</td>
              <td>
                <button
                  nz-button
                  nzType="link"
                  nzSize="small"
                  (click)="fileDownload.emit(file); $event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="下載"
                >
                  <span nz-icon nzType="download"></span>
                </button>
                <button
                  nz-button
                  nzType="link"
                  nzSize="small"
                  nzDanger
                  nz-popconfirm
                  nzPopconfirmTitle="確定要刪除此檔案嗎？"
                  (nzOnConfirm)="fileDelete.emit(file)"
                  (click)="$event.stopPropagation()"
                  nz-tooltip
                  nzTooltipTitle="刪除"
                >
                  <span nz-icon nzType="delete"></span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    }
  `,
  styles: [
    `
      tr {
        cursor: pointer;
      }

      .selected-row {
        background-color: var(--ant-primary-color-deprecated-bg);
      }
    `
  ]
})
export class FileListComponent {
  // Inputs
  files = input.required<CloudFile[]>();
  loading = input.required<boolean>();
  selectedFileId = input<string | null>(null);

  // Outputs
  fileSelect = output<CloudFile>();
  fileDownload = output<CloudFile>();
  fileDelete = output<CloudFile>();

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(file: CloudFile): string {
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
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}
