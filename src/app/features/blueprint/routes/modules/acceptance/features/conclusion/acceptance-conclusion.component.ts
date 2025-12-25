/**
 * Acceptance Conclusion Feature Component
 * 驗收結論功能 - 自包含的功能模組
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceRecord } from '../../acceptance.model';

@Component({
  selector: 'app-acceptance-conclusion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="驗收結論">
      <nz-empty nzNotFoundContent="結論功能開發中" />
    </nz-card>
  `,
  styles: []
})
export class AcceptanceConclusionComponent {
  conclusions = input.required<AcceptanceRecord[]>();
  loading = input<boolean>(false);

  finalize = output<AcceptanceRecord>();
  view = output<AcceptanceRecord>();
  export = output<AcceptanceRecord>();
  reload = output<void>();
}
