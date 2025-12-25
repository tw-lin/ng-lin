import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs, DocumentData, Timestamp } from '@angular/fire/firestore';

import { ContractModel } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'contracts';

  async findByBlueprintId(blueprintId: string): Promise<ContractModel[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('blueprint_id', '==', blueprintId),
      orderBy('effective_date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }

  private toEntity(data: DocumentData, id: string): ContractModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? data['blueprintId'] ?? '',
      title: data['title'] ?? '',
      status: data['status'],
      effectiveDate: this.toDate(data['effective_date']),
      updatedAt: this.toDate(data['updated_at'])
    };
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }
}
