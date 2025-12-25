import { Injectable, inject } from '@angular/core';

import type { FinanceData } from './finance.model';
import { FinanceRepository } from './finance.repository';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly repository = inject(FinanceRepository);

  async load(blueprintId: string): Promise<FinanceData> {
    return this.repository.loadFinanceData(blueprintId);
  }
}
