import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ContractListComponent } from './components/contract-list.component';

@Component({
  selector: 'app-contract-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContractListComponent],
  template: ` <app-contract-list [blueprintId]="blueprintId()" /> `
})
export class ContractModuleViewComponent {
  readonly blueprintId = input.required<string>();
}
