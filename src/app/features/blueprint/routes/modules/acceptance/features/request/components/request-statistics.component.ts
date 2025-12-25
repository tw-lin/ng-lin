/**
 * Request Statistics Component
 * 驗收申請統計卡片
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { AcceptanceRecord, AcceptanceStatus } from '../../../acceptance.model';

@Component({
  selector: 'app-request-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <nz-card nzTitle="驗收申請統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="totalCount()" nzTitle="總申請數" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="pendingCount()" nzTitle="待審核" [nzValueStyle]="{ color: '#faad14' }" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="inReviewCount()" nzTitle="審核中" [nzValueStyle]="{ color: '#1890ff' }" />
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="approvedCount()" nzTitle="已通過" [nzValueStyle]="{ color: '#52c41a' }" />
        </nz-col>
      </nz-row>
    </nz-card>
  `,
  styles: []
})
export class RequestStatisticsComponent {
  requests = input.required<AcceptanceRecord[]>();

  totalCount = () => this.requests().length;

  pendingCount = () => this.requests().filter(r => r.status === AcceptanceStatus.PENDING).length;

  inReviewCount = () => this.requests().filter(r => r.status === AcceptanceStatus.IN_REVIEW).length;

  approvedCount = () => this.requests().filter(r => r.status === AcceptanceStatus.APPROVED).length;
}
