import { Timestamp } from '@angular/fire/firestore';

export type AgreementStatus = 'draft' | 'active' | 'expired';

export interface Agreement {
  id: string;
  blueprintId: string;
  title: string;
  counterparty: string;
  status: AgreementStatus;
  effectiveDate: Date;
  value?: number;
  attachmentUrl?: string;
  attachmentPath?: string;
  parsedJsonUrl?: string;
  parsedJsonPath?: string;
}

export type AgreementDocument = Omit<Agreement, 'effectiveDate'> & {
  effectiveDate: Date | Timestamp;
};
