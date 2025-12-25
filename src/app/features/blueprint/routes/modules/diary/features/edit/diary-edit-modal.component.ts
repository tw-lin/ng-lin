import { Component, OnInit, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormGroup } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { Diary, CreateDiaryRequest, UpdateDiaryRequest } from '../../diary.model';
import { DiaryService } from '../../diary.service';
import { DiaryFormComponent } from './components/diary-form.component';
import { DiaryPhotoUploadComponent } from './components/diary-photo-upload.component';

interface ModalData {
  blueprintId: string;
  diary?: Diary;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-diary-edit-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, DiaryFormComponent, DiaryPhotoUploadComponent],
  template: `
    <app-diary-form [diary]="modalData.diary || null" [isView]="modalData.mode === 'view'" (formReady)="onFormReady($event)" />

    <app-diary-photo-upload
      [diary]="modalData.diary || null"
      [isView]="modalData.mode === 'view'"
      (filesChanged)="onFilesChanged($event)"
      (deletePhoto)="handleDeletePhoto($event)"
    />

    <!-- Form Actions -->
    <nz-form-item>
      <nz-form-control [nzSpan]="14" [nzOffset]="6">
        <button nz-button nzType="default" (click)="cancel()" style="margin-right: 8px;">取消</button>
        @if (modalData.mode !== 'view') {
          <button nz-button nzType="primary" (click)="submit()" [nzLoading]="submitting()" [disabled]="!isFormValid()">
            {{ modalData.mode === 'create' ? '新增' : '更新' }}
          </button>
        }
      </nz-form-control>
    </nz-form-item>
  `
})
export class DiaryEditModalComponent implements OnInit {
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private diaryService = inject(DiaryService);
  private auth = inject(Auth);
  // Modal data injected
  modalData: ModalData = inject(NZ_MODAL_DATA);

  // State
  submitting = signal(false);
  form: FormGroup | null = null;
  fileList: File[] = [];

  ngOnInit(): void {
    // Form is initialized by DiaryFormComponent
  }

  onFormReady(form: FormGroup): void {
    this.form = form;
  }

  onFilesChanged(files: File[]): void {
    this.fileList = files;
  }

  isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  async handleDeletePhoto(photoId: string): Promise<void> {
    const diaryId = this.modalData.diary?.id;
    if (!diaryId) return;

    try {
      await this.diaryService.deletePhoto(this.modalData.blueprintId, diaryId, photoId);
      this.message.success('照片刪除成功');

      if (this.modalData.diary) {
        this.modalData.diary.photos = this.modalData.diary.photos.filter(p => p.id !== photoId);
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      this.message.error('照片刪除失敗');
    }
  }

  async submit(): Promise<void> {
    if (!this.form || !this.form.valid) {
      Object.values(this.form?.controls || {}).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;
      const isCreate = this.modalData.mode === 'create';

      // Create or update diary
      const diary = isCreate ? await this.createDiary(formValue) : await this.updateDiary(formValue);

      // Upload photos if any
      if (this.fileList.length > 0) {
        await this.uploadPhotos(diary.id);
      }

      this.modalRef.close({ success: true, diary });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失敗';
      console.error('[DiaryEditModal] Submit error:', error);
      this.message.error(errorMessage);
    } finally {
      this.submitting.set(false);
    }
  }

  private async createDiary(formValue: any): Promise<Diary> {
    if (!formValue.date) {
      throw new Error('請選擇日期');
    }

    const currentUserId = this.auth.currentUser?.uid;
    if (!currentUserId) {
      throw new Error('無法取得使用者資訊，請重新登入');
    }

    const request: CreateDiaryRequest = {
      blueprintId: this.modalData.blueprintId,
      date: formValue.date,
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature,
      creatorId: currentUserId
    };

    return this.diaryService.create(request);
  }

  private async updateDiary(formValue: any): Promise<Diary> {
    const diaryId = this.modalData.diary?.id;
    if (!diaryId) {
      throw new Error('無法取得日誌 ID');
    }

    if (!formValue.date) {
      throw new Error('請選擇日期');
    }

    const request: UpdateDiaryRequest = {
      date: formValue.date,
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature
    };

    return this.diaryService.update(this.modalData.blueprintId, diaryId, request);
  }

  private async uploadPhotos(diaryId: string): Promise<void> {
    await Promise.all(this.fileList.map(file => this.diaryService.uploadPhoto(this.modalData.blueprintId, diaryId, file)));
  }

  cancel(): void {
    this.modalRef.close({ success: false });
  }
}
