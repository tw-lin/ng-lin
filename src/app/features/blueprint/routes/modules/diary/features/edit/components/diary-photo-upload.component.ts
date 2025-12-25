/**
 * Diary Photo Upload Component
 * 日誌照片上傳元件
 *
 * Component for uploading and managing diary photos
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzUploadFile } from 'ng-zorro-antd/upload';

import { Diary } from '../../../diary.model';

@Component({
  selector: 'app-diary-photo-upload',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <!-- Upload Area -->
    @if (!isView()) {
      <nz-form-item>
        <nz-form-label [nzSpan]="6">照片</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-upload
            nzType="drag"
            [nzMultiple]="true"
            [nzAccept]="'image/*'"
            [nzBeforeUpload]="beforeUpload"
            [nzFileList]="uploadFileList()"
            [nzShowUploadList]="{ showPreviewIcon: true, showRemoveIcon: true }"
            [nzRemove]="handleRemove"
          >
            <p class="ant-upload-drag-icon">
              <span nz-icon nzType="inbox"></span>
            </p>
            <p class="ant-upload-text">點擊或拖曳照片到此區域上傳</p>
            <p class="ant-upload-hint">支援單個或批量上傳，建議照片大小小於 5MB</p>
          </nz-upload>
        </nz-form-control>
      </nz-form-item>
    }

    <!-- Existing Photos -->
    @if (diary()?.photos && (diary()?.photos?.length ?? 0) > 0) {
      <nz-form-item>
        <nz-form-label [nzSpan]="6">現有照片</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-row [nzGutter]="[8, 8]">
            @for (photo of diary()?.photos; track photo.id) {
              <nz-col [nzSpan]="8">
                <div class="photo-item">
                  <img [src]="photo.publicUrl" [alt]="photo.caption || '照片'" style="width: 100%; height: 100px; object-fit: cover;" />
                  @if (!isView()) {
                    <button
                      nz-button
                      nzType="link"
                      nzDanger
                      nzSize="small"
                      (click)="deletePhoto.emit(photo.id)"
                      style="position: absolute; top: 0; right: 0;"
                    >
                      <span nz-icon nzType="delete"></span>
                    </button>
                  }
                </div>
              </nz-col>
            }
          </nz-row>
        </nz-form-control>
      </nz-form-item>
    }
  `,
  styles: [
    `
      .photo-item {
        position: relative;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        overflow: hidden;
      }
    `
  ]
})
export class DiaryPhotoUploadComponent implements OnDestroy {
  // Inputs
  diary = input<Diary | null>(null);
  isView = input<boolean>(false);

  // Outputs
  filesChanged = output<File[]>();
  deletePhoto = output<string>();

  // State
  fileList = signal<File[]>([]);
  uploadFileList = signal<NzUploadFile[]>([]);

  ngOnDestroy(): void {
    // Cleanup object URLs
    this.uploadFileList().forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    // Validate file type and size
    if (!file.type?.startsWith('image/')) {
      return false;
    }

    if (file.size! / 1024 / 1024 >= 5) {
      return false;
    }

    // Add to file lists
    this.fileList.update(list => {
      const newList = [...list, file as any];
      this.filesChanged.emit(newList);
      return newList;
    });

    // Add to upload file list for display
    const uploadFile: NzUploadFile = {
      uid: `${Date.now()}-${file.name}`,
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file as any),
      originFileObj: file as any
    };
    this.uploadFileList.update(list => [...list, uploadFile]);

    return false; // Prevent automatic upload
  };

  handleRemove = (file: NzUploadFile): boolean => {
    // Remove from file list
    this.fileList.update(list => {
      const newList = list.filter(f => f.name !== file.name);
      this.filesChanged.emit(newList);
      return newList;
    });

    // Remove from upload file list
    this.uploadFileList.update(list => list.filter(f => f.uid !== file.uid));

    // Revoke object URL to free memory
    if (file.url) {
      URL.revokeObjectURL(file.url);
    }

    return true;
  };
}
