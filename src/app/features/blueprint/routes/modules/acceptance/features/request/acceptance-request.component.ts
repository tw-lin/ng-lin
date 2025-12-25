/**
 * Acceptance Request Feature Component
 * 驗收申請功能 - 自包含的功能模組
 *
 * 職責:
 * - 顯示驗收申請統計資訊
 * - 顯示驗收申請列表
 * - 處理申請的查看、編輯、刪除操作
 * - 透過事件與主協調器溝通
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { RequestListComponent, RequestStatisticsComponent } from './components';
import { AcceptanceRecord } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, RequestStatisticsComponent, RequestListComponent],
  template: `
    <!-- Statistics -->
    <app-request-statistics [requests]="requests()" />

    <!-- Actions Bar -->
    <nz-card class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="24">
          <button nz-button nzType="primary" (click)="create.emit()">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            新增申請
          </button>
          <button nz-button class="ml-sm" (click)="reload.emit()">
            <span nz-icon nzType="reload" nzTheme="outline"></span>
            重新載入
          </button>
        </nz-col>
      </nz-row>
    </nz-card>

    <!-- Request List -->
    <app-request-list
      [requests]="requests()"
      [loading]="loading()"
      (view)="view.emit($event)"
      (edit)="edit.emit($event)"
      (delete)="delete.emit($event)"
    />
  `,
  styles: []
})
export class AcceptanceRequestComponent {
  // Inputs
  requests = input.required<AcceptanceRecord[]>();
  loading = input<boolean>(false);

  // Outputs
  create = output<void>();
  view = output<AcceptanceRecord>();
  edit = output<AcceptanceRecord>();
  delete = output<AcceptanceRecord>();
  reload = output<void>();
}
