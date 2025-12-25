/**
 * Diary Module View Component
 * 日誌模組視圖元件
 *
 * Main orchestrator for diary module
 * Coordinates list, create, edit, and delete features
 *
 * ✅ Follows feature-based architecture
 * ✅ High cohesion, low coupling
 * ✅ Thin orchestration layer
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, OnInit, inject, input, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { Diary } from './diary.model';
import { DiaryService } from './diary.service';
import { DiaryEditModalComponent } from './features/edit';
import { DiaryListComponent } from './features/list';

@Component({
  selector: 'app-diary-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS, DiaryListComponent],
  template: `
    <app-diary-list
      [diaries]="diaries()"
      [statistics]="statistics()"
      [loading]="loading()"
      [error]="error()"
      (create)="handleCreate()"
      (refresh)="handleRefresh()"
      (viewDiary)="handleView($event)"
      (editDiary)="handleEdit($event)"
      (deleteDiary)="handleDelete($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class DiaryModuleViewComponent implements OnInit {
  // Input from parent (Blueprint Detail)
  blueprintId = input.required<string>();

  // Injected services
  private diaryService = inject(DiaryService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // State from store
  diaries = this.diaryService.diaries;
  loading = this.diaryService.loading;
  error = this.diaryService.error;

  // Computed statistics
  statistics = computed(() => ({
    total: this.diaryService.totalCount(),
    thisMonth: this.diaryService.thisMonthCount(),
    today: this.diaryService.todayCount(),
    totalPhotos: this.diaryService.totalPhotos()
  }));

  ngOnInit(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadDiaries(id);
    }
  }

  private loadDiaries(blueprintId: string): void {
    this.diaryService.loadDiaries(blueprintId);
  }

  handleRefresh(): void {
    const id = this.blueprintId();
    if (id) {
      this.loadDiaries(id);
      this.message.success('重新整理完成');
    }
  }

  handleCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: '新增工地施工日誌',
      nzContent: DiaryEditModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        mode: 'create'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        this.message.success('日誌新增成功');
      }
    });
  }

  handleView(diary: Diary): void {
    this.modal.create({
      nzTitle: '查看工地施工日誌',
      nzContent: DiaryEditModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        diary,
        mode: 'view'
      },
      nzWidth: 800,
      nzFooter: null
    });
  }

  handleEdit(diary: Diary): void {
    const modalRef = this.modal.create({
      nzTitle: '編輯工地施工日誌',
      nzContent: DiaryEditModalComponent,
      nzData: {
        blueprintId: this.blueprintId(),
        diary,
        mode: 'edit'
      },
      nzWidth: 800,
      nzFooter: null,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        this.message.success('日誌更新成功');
      }
    });
  }

  async handleDelete(diary: Diary): Promise<void> {
    const blueprintId = this.blueprintId();
    if (!blueprintId || !diary.id) return;

    try {
      await this.diaryService.delete(blueprintId, diary.id);
      this.message.success('日誌刪除成功');
    } catch (error) {
      this.message.error('日誌刪除失敗');
    }
  }
}
