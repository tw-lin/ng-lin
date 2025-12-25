/**
 * Acceptance Re-inspection Feature Component
 * 複驗功能 - 自包含的功能模組
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceRecord } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-re-inspection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="複驗管理">
      <nz-empty nzNotFoundContent="複驗功能開發中" />
    </nz-card>
  `,
  styles: []
})
export class AcceptanceReInspectionComponent {
  reInspections = input.required<AcceptanceRecord[]>();
  originalRecord = input<AcceptanceRecord | null>(null);
  loading = input<boolean>(false);

  create = output<void>();
  view = output<AcceptanceRecord>();
  compare = output<{ original: AcceptanceRecord; current: AcceptanceRecord }>();
  reload = output<void>();
}
