import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-partner-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'夥伴設定'"></page-header>
    <nz-card>
      <nz-result nzStatus="info" nzTitle="功能開發中" nzSubTitle="夥伴設定功能即將推出"></nz-result>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnerSettingsComponent {}
