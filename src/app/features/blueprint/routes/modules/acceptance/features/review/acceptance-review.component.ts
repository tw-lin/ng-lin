/**
 * Acceptance Review Feature Component
 * 驗收審核功能 - 自包含的功能模組
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceRecord } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="驗收審核">
      <nz-empty nzNotFoundContent="審核功能開發中" />
    </nz-card>
  `,
  styles: []
})
export class AcceptanceReviewComponent {
  reviews = input.required<AcceptanceRecord[]>();
  loading = input<boolean>(false);

  approve = output<{ record: AcceptanceRecord; notes: string }>();
  reject = output<{ record: AcceptanceRecord; reason: string }>();
  view = output<AcceptanceRecord>();
  reload = output<void>();
}
