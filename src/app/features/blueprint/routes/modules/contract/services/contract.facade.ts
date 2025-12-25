import { effect, inject, Injectable, Signal, signal } from '@angular/core';

import { ContractModel } from '../data-access/models/contract.model';
import { ContractRepository } from '../data-access/repositories/contract.repository';

@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly repository = inject(ContractRepository);

  private readonly contracts = signal<ContractModel[]>([]);
  private readonly loading = signal(false);

  readonly contractsState = {
    data: this.contracts.asReadonly(),
    loading: this.loading.asReadonly()
  };

  ensureLoaded(blueprintId: Signal<string>): void {
    effect(
      () => {
        const id = blueprintId();
        void this.loadByBlueprint(id);
      },
      { allowSignalWrites: true }
    );
  }

  async loadByBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this.contracts.set(result);
    } finally {
      this.loading.set(false);
    }
  }
}
