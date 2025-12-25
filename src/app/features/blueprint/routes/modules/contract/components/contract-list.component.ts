import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { ContractFacade } from '../services/contract.facade';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'合約 (Contract)'" />
    <nz-card>
      <p class="text-muted">Contract 模組雛形，使用 @angular/fire 透過 Repository 讀取資料。</p>
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (contracts().length === 0) {
        <nz-alert nzType="info" nzMessage="尚未有合約資料" />
      } @else {
        <nz-list [nzDataSource]="contracts()" [nzRenderItem]="item">
          <ng-template #item let-contract>
            <nz-list-item>
              <nz-list-item-meta [nzTitle]="contract.title || '未命名合約'" [nzDescription]="contract.status || '未設定狀態'" />
            </nz-list-item>
          </ng-template>
        </nz-list>
      }
    </nz-card>
  `
})
export class ContractListComponent {
  private readonly facade = inject(ContractFacade);
  readonly blueprintId = input.required<string>();

  readonly contracts = computed(() => this.facade.contractsState.data());
  readonly loading = computed(() => this.facade.contractsState.loading());

  constructor() {
    this.facade.ensureLoaded(this.blueprintId);
  }
}
