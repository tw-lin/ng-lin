import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  DocumentData,
  Firestore,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where
} from '@angular/fire/firestore';

import { Agreement, AgreementDocument } from './agreement.model';

@Injectable({ providedIn: 'root' })
export class AgreementRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionPath = 'agreements';
  private readonly collectionRef = collection(this.firestore, this.collectionPath);

  async createAgreement(payload: Partial<Agreement> & { blueprintId: string }): Promise<Agreement> {
    const now = new Date();
    const data: AgreementDocument = {
      blueprintId: payload.blueprintId,
      title: payload.title || '新協議',
      counterparty: payload.counterparty || '',
      status: (payload.status as Agreement['status']) || 'draft',
      effectiveDate: payload.effectiveDate || now
    } as AgreementDocument;

    if (payload.value !== undefined && payload.value !== null) {
      (data as any).value = payload.value;
    }
    if ((payload as any).attachmentUrl) {
      (data as any).attachmentUrl = (payload as any).attachmentUrl;
    }
    if ((payload as any).attachmentPath) {
      (data as any).attachmentPath = (payload as any).attachmentPath;
    }
    if ((payload as any).parsedJsonUrl) {
      (data as any).parsedJsonUrl = (payload as any).parsedJsonUrl;
    }
    if ((payload as any).parsedJsonPath) {
      (data as any).parsedJsonPath = (payload as any).parsedJsonPath;
    }

    const docRef = await addDoc(this.collectionRef, data as any);
    return this.toEntity(data as DocumentData, docRef.id);
  }

  async findByBlueprintId(blueprintId: string): Promise<Agreement[]> {
    const q = query(this.collectionRef, where('blueprintId', '==', blueprintId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
    return items.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  async updateAgreement(agreementId: string, payload: Partial<Agreement>): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await setDoc(ref, payload, { merge: true });
  }

  async saveAttachmentUrl(agreementId: string, attachmentUrl: string, attachmentPath?: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await setDoc(ref, { attachmentUrl, attachmentPath }, { merge: true });
  }

  async saveParsedJsonUrl(agreementId: string, parsedJsonUrl: string, parsedJsonPath?: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    const payload: Partial<Agreement> = { parsedJsonUrl };
    if (parsedJsonPath) {
      payload.parsedJsonPath = parsedJsonPath;
    }
    await setDoc(ref, payload, { merge: true });
  }

  async deleteAgreement(agreementId: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionPath}/${agreementId}`);
    await deleteDoc(ref);
  }

  private toEntity(data: DocumentData, id: string): Agreement {
    const doc = data as AgreementDocument;
    const effectiveDateRaw = doc.effectiveDate ?? new Date();
    const effectiveDate = effectiveDateRaw instanceof Timestamp ? effectiveDateRaw.toDate() : new Date(effectiveDateRaw);
    const parsedJsonUrl = (doc as any).parsedJsonUrl;
    const parsedJsonPath = (doc as any).parsedJsonPath ?? (parsedJsonUrl ? `agreements/${id}/parsed.json` : undefined);

    return {
      id,
      blueprintId: doc.blueprintId,
      title: doc.title,
      counterparty: doc.counterparty,
      status: (doc.status as Agreement['status']) ?? 'draft',
      effectiveDate,
      value: doc.value,
      attachmentUrl: (doc as any).attachmentUrl,
      attachmentPath: (doc as any).attachmentPath,
      parsedJsonUrl,
      parsedJsonPath
    };
  }
}
