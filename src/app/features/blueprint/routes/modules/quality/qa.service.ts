import { Injectable, inject } from '@angular/core';

import { QaInspection, QaStandard, QaStatistics } from './qa.model';
import { QaRepository } from './qa.repository';

@Injectable({ providedIn: 'root' })
export class QaService {
  private readonly repository = inject(QaRepository);
  listInspections(blueprintId: string): Promise<QaInspection[]> {
    return this.repository.listInspections(blueprintId);
  }

  listStandards(blueprintId: string): Promise<QaStandard[]> {
    return this.repository.listStandards(blueprintId);
  }

  async getStatistics(blueprintId: string): Promise<QaStatistics> {
    return await this.repository.getStatistics(blueprintId);
  }
}
