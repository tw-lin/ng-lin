/**
 * Acceptance Status Badge Component
 * 驗收狀態標籤 - 顯示驗收狀態的標籤元件
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceStatus } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: ` <nz-badge [nzStatus]="statusConfig().status" [nzText]="statusConfig().text" /> `,
  styles: []
})
export class AcceptanceStatusBadgeComponent {
  status = input.required<AcceptanceStatus>();

  statusConfig = () => {
    const statusValue = this.status();
    const configs: Record<AcceptanceStatus, { status: string; text: string }> = {
      [AcceptanceStatus.PENDING]: { status: 'default', text: '待審核' },
      [AcceptanceStatus.IN_REVIEW]: { status: 'processing', text: '審核中' },
      [AcceptanceStatus.APPROVED]: { status: 'success', text: '已通過' },
      [AcceptanceStatus.REJECTED]: { status: 'error', text: '已拒絕' }
    };
    return configs[statusValue] || { status: 'default', text: '未知' };
  };
}
