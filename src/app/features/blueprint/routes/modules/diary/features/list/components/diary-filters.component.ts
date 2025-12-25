/**
 * Diary Filters Component
 * 日誌篩選與操作元件
 *
 * Provides filtering and action buttons for diary list
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-diary-filters',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-space>
      <button *nzSpaceItem nz-button (click)="refresh.emit()">
        <span nz-icon nzType="reload"></span>
        重新整理
      </button>
      <button *nzSpaceItem nz-button nzType="primary" (click)="create.emit()">
        <span nz-icon nzType="plus"></span>
        新增日誌
      </button>
    </nz-space>
  `
})
export class DiaryFiltersComponent {
  refresh = output<void>();
  create = output<void>();
}
