/**
 * Issue Statistics Component
 * 問題統計元件
 *
 * Purpose: Display issue statistics with status breakdown
 * Features: Reactive statistics display using Angular Signals
 *
 * Architecture: Feature Component (High Cohesion)
 * - Self-contained statistics display
 * - Accepts statistics via input signal
 * - No external dependencies except data models
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import type { IssueStatistics } from '../../issues.model';

@Component({
  selector: 'app-issue-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <nz-card nzTitle="問題統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().total" nzTitle="總計" />
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().open" nzTitle="待處理" [nzPrefix]="pendingIcon" />
          <ng-template #pendingIcon>
            <span nz-icon nzType="exclamation-circle" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().inProgress" nzTitle="處理中" [nzPrefix]="processingIcon" />
          <ng-template #processingIcon>
            <span nz-icon nzType="clock-circle" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().resolved" nzTitle="已解決" [nzPrefix]="resolvedIcon" />
          <ng-template #resolvedIcon>
            <span nz-icon nzType="check-circle" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().verified" nzTitle="已驗證" [nzPrefix]="verifiedIcon" />
          <ng-template #verifiedIcon>
            <span nz-icon nzType="safety-certificate" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="4">
          <nz-statistic [nzValue]="stats().closed" nzTitle="已關閉" [nzPrefix]="closedIcon" />
          <ng-template #closedIcon>
            <span nz-icon nzType="check-square" style="color: #8c8c8c;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class IssueStatisticsComponent {
  /**
   * Statistics data input
   * Uses required input signal for type safety
   */
  stats = input.required<IssueStatistics>();
}
