import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-partner-schedule',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'夥伴排程'"></page-header>
    <nz-card>
      <nz-result nzStatus="info" nzTitle="功能開發中" nzSubTitle="夥伴排程功能即將推出"></nz-result>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerScheduleComponent {}
