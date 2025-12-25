/**
 * Diary Status Badge Component
 * 日誌狀態標籤元件
 *
 * Reusable component for displaying diary entry status
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-diary-status-badge',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (status()) {
      <nz-tag [nzColor]="getColor()">
        {{ getLabel() }}
      </nz-tag>
    }
  `
})
export class DiaryStatusBadgeComponent {
  status = input<string>();

  getColor(): string {
    switch (this.status()) {
      case 'draft':
        return 'default';
      case 'published':
        return 'success';
      case 'archived':
        return 'warning';
      default:
        return 'default';
    }
  }

  getLabel(): string {
    switch (this.status()) {
      case 'draft':
        return '草稿';
      case 'published':
        return '已發布';
      case 'archived':
        return '已封存';
      default:
        return this.status() || '';
    }
  }
}
