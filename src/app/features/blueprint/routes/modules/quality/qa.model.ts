export type QaInspectionResult = 'pass' | 'fail' | 'pending';

export interface QaInspection {
  id: string;
  blueprintId: string;
  item: string;
  inspector: string;
  result: QaInspectionResult;
  inspectedAt: Date;
}

export interface QaStandard {
  id: string;
  blueprintId: string;
  name: string;
  description: string;
}

export interface QaStatistics {
  inspections: number;
  passRate: number;
  openIssues: number;
}
