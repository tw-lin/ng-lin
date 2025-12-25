/**
 * Upload Area Component
 * 上傳區域元件
 *
 * Purpose: Handle file uploads via button click and drag-drop
 * Features: Upload button, drag-drop zone, multi-file support
 */

import { Component, ChangeDetectionStrategy, input, output, ViewChild, ElementRef, signal, HostListener } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-upload-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="mb-md">
      <button nz-button nzType="primary" (click)="triggerFileUpload()" [nzLoading]="loading()">
        <span nz-icon nzType="upload"></span>
        上傳檔案
      </button>
      <button nz-button (click)="createFolderClick.emit()" class="ml-sm">
        <span nz-icon nzType="folder-add"></span>
        新增資料夾
      </button>
      <input #fileInput type="file" style="display: none" (change)="onFileSelected($event)" multiple />
    </div>

    <!-- Drag-drop overlay -->
    @if (isDraggingOver()) {
      <div class="drop-zone-overlay">
        <div class="drop-zone-content">
          <span nz-icon nzType="cloud-upload" style="font-size: 48px;"></span>
          <p style="margin-top: 16px; font-size: 16px;">拖放檔案到此處上傳</p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .drop-zone-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(var(--ant-primary-color-rgb), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: none;
      }

      .drop-zone-content {
        text-align: center;
        color: var(--ant-primary-color);
      }
    `
  ]
})
export class UploadAreaComponent {
  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  // Inputs
  loading = input.required<boolean>();

  // Outputs
  filesSelected = output<File[]>();
  createFolderClick = output<void>();

  // State
  isDraggingOver = signal<boolean>(false);

  /**
   * Trigger file input click
   */
  triggerFileUpload(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    this.filesSelected.emit(Array.from(input.files));

    // Clear input
    input.value = '';
  }

  /**
   * Handle drag over event
   */
  @HostListener('document:dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  @HostListener('document:dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Only hide if leaving the document
    if (event.target === document) {
      this.isDraggingOver.set(false);
    }
  }

  /**
   * Handle drop event
   */
  @HostListener('document:drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    this.filesSelected.emit(Array.from(files));
  }
}
