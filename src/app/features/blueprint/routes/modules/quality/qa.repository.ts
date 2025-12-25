import { Injectable, inject } from '@angular/core';

import { QaInspection, QaStandard, QaStatistics } from './qa.model';

@Injectable({ providedIn: 'root' })
export class QaRepository {
  async listInspections(blueprintId: string): Promise<QaInspection[]> {
    // TODO: integrate Firestore collection `qa_inspections` with blueprint filter
    return [
      { id: '1', blueprintId, item: '混凝土強度測試', inspector: '品管員A', result: 'pass', inspectedAt: new Date() },
      { id: '2', blueprintId, item: '鋼筋保護層檢查', inspector: '品管員B', result: 'pass', inspectedAt: new Date() },
      { id: '3', blueprintId, item: '防水層檢驗', inspector: '品管員A', result: 'pending', inspectedAt: new Date() }
    ];
  }

  async listStandards(blueprintId: string): Promise<QaStandard[]> {
    // TODO: integrate Firestore collection `qa_standards`
    return [
      { id: '1', blueprintId, name: 'CNS 3090 混凝土標準', description: '混凝土強度與配比規範' },
      { id: '2', blueprintId, name: 'CNS 560 鋼筋標準', description: '鋼筋規格與品質要求' }
    ];
  }

  async getStatistics(blueprintId: string): Promise<QaStatistics> {
    // TODO: derive statistics from inspections/issues
    return {
      inspections: 25,
      passRate: 96.5,
      openIssues: 2
    };
  }
}
