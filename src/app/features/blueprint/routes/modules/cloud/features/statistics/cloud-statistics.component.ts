/**
 * Cloud Statistics Component
 * 雲端儲存統計元件
 *
 * Feature: Statistics
 * Responsibility: Display storage usage statistics
 * Coupling: Low - only requires statistics input
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import type { CloudStorageStats } from '../../cloud.model';

@Component({
  selector: 'app-cloud-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <nz-card nzTitle="雲端儲存" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="(stats().storageUsed / 1024 / 1024).toFixed(2)" nzTitle="已用容量 (MB)">
            <ng-template #nzPrefix>
              <span nz-icon nzType="cloud"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="stats().totalFiles" nzTitle="檔案數量">
            <ng-template #nzPrefix>
              <span nz-icon nzType="file"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="stats().usagePercentage.toFixed(1) + '%'" nzTitle="使用率">
            <ng-template #nzPrefix>
              <span nz-icon nzType="pie-chart"></span>
            </ng-template>
          </nz-statistic>
        </nz-col>
      </nz-row>
    </nz-card>
  `
})
export class CloudStatisticsComponent {
  stats = input.required<CloudStorageStats>();
}
