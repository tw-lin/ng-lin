import { Injectable, inject } from '@angular/core';
import {
  CollectionReference,
  Firestore,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  QueryConstraint
} from '@angular/fire/firestore';
import { Observable, catchError, from, map, of } from 'rxjs';

import { AcceptanceQueryOptions, AcceptanceRecord, AcceptanceStatus, CreateAcceptanceData, UpdateAcceptanceData } from './acceptance.model';

@Injectable({ providedIn: 'root' })
export class AcceptanceRepository {
  private readonly firestore = inject(Firestore);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'acceptance_records';

  private getCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  findByBlueprintId(blueprintId: string, options?: AcceptanceQueryOptions): Observable<AcceptanceRecord[]> {
    const constraints: QueryConstraint[] = [];
    if (options?.status) constraints.push(where('status', '==', options.status));
    if (options?.reviewerId) constraints.push(where('reviewerId', '==', options.reviewerId));
    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limit) constraints.push(limit(options.limit));

    const q = query(this.getCollection(blueprintId), ...constraints);
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toEntity(docSnap.data(), docSnap.id))),
      catchError(() => of([]))
    );
  }

  async create(blueprintId: string, data: CreateAcceptanceData): Promise<AcceptanceRecord> {
    const now = Timestamp.now();
    const docData = {
      blueprintId,
      title: data.title,
      description: data.description ?? '',
      status: AcceptanceStatus.PENDING,
      reviewerId: data.reviewerId ?? null,
      reviewerName: null,
      notes: null,
      attachments: [],
      metadata: {},
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.getCollection(blueprintId), docData);
    return this.toEntity(docData, docRef.id);
  }

  async update(blueprintId: string, recordId: string, data: UpdateAcceptanceData): Promise<void> {
    const docRef = doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId);
    const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    if (data.reviewDate) payload['reviewDate'] = Timestamp.fromDate(data.reviewDate);

    await updateDoc(docRef, payload);
  }

  async delete(blueprintId: string, recordId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, recordId));
  }

  private toEntity(data: Record<string, unknown>, id: string): AcceptanceRecord {
    return {
      id,
      blueprintId: (data['blueprintId'] as string) || '',
      title: data['title'] as string,
      description: (data['description'] as string) || undefined,
      status: (data['status'] as AcceptanceStatus) ?? AcceptanceStatus.PENDING,
      reviewerId: data['reviewerId'] as string | undefined,
      reviewerName: data['reviewerName'] as string | undefined,
      reviewDate: this.toDate(data['reviewDate']),
      notes: data['notes'] as string | undefined,
      attachments: (data['attachments'] as string[]) || undefined,
      metadata: (data['metadata'] as Record<string, unknown>) || {},
      createdBy: (data['createdBy'] as string) || '',
      createdAt: this.toDate(data['createdAt']) ?? new Date(),
      updatedAt: this.toDate(data['updatedAt']) ?? new Date()
    };
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe?.toDate === 'function') return maybe.toDate();
    if (value instanceof Date) return value;
    return new Date(value as string);
  }
}
