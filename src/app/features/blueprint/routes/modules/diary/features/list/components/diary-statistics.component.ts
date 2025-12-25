/**
 * Diary Statistics Component
 * 日誌統計元件
 *
 * Displays diary entry statistics with cards
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

export interface DiaryStatistics {
  total: number;
  thisMonth: number;
  today: number;
  totalPhotos: number;
}

@Component({
  selector: 'app-diary-statistics',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-row [nzGutter]="16" class="mb-md">
      <nz-col [nzSpan]="6">
        <nz-statistic [nzValue]="statistics().total" [nzTitle]="'總日誌數'" [nzPrefix]="totalIconTpl" />
        <ng-template #totalIconTpl>
          <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
        </ng-template>
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-statistic [nzValue]="statistics().thisMonth" [nzTitle]="'本月日誌'" [nzValueStyle]="{ color: '#52c41a' }" />
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-statistic [nzValue]="statistics().today" [nzTitle]="'今日日誌'" [nzValueStyle]="{ color: '#faad14' }" />
      </nz-col>
      <nz-col [nzSpan]="6">
        <nz-statistic [nzValue]="statistics().totalPhotos" [nzTitle]="'總照片數'" [nzPrefix]="photoIconTpl" />
        <ng-template #photoIconTpl>
          <span nz-icon nzType="picture" style="color: #722ed1;"></span>
        </ng-template>
      </nz-col>
    </nz-row>
  `,
  styles: [
    `
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class DiaryStatisticsComponent {
  statistics = input.required<DiaryStatistics>();
}
