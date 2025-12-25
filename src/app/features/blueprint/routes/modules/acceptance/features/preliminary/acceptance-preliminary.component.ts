/**
 * Acceptance Preliminary Feature Component
 * 初驗功能 - 自包含的功能模組
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceRecord } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-preliminary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="初驗管理">
      <nz-empty nzNotFoundContent="初驗功能開發中" />
    </nz-card>
  `,
  styles: []
})
export class AcceptancePreliminaryComponent {
  preliminaries = input.required<AcceptanceRecord[]>();
  loading = input<boolean>(false);

  create = output<void>();
  edit = output<AcceptanceRecord>();
  generateReport = output<AcceptanceRecord>();
  reload = output<void>();
}
