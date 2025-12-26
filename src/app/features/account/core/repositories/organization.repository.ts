import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, docData, query, updateDoc, where } from '@angular/fire/firestore';
import { LoggerService } from '@core/services';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';

import { Organization } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrganizationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'organizations');

  findById(id: string): Observable<Organization | null> {
    if (!id) return of(null);

    return docData(doc(this.collectionRef, id)).pipe(
      map(data => (data ? ({ ...(data as Organization), id } as Organization) : null)),
      catchError((error: unknown) => {
        this.logger.error('[OrganizationRepository] findById failed', error);
        return of(null);
      })
    );
  }

  findByCreator(userId: string): Observable<Organization[]> {
    if (!userId) return of([]);

    const createdByQuery = query(this.collectionRef, where('created_by', '==', userId));
    const legacyCreatorIdQuery = query(this.collectionRef, where('creator_id', '==', userId));

    return combineLatest([collectionData(createdByQuery, { idField: 'id' }), collectionData(legacyCreatorIdQuery, { idField: 'id' })]).pipe(
      map(([createdBy, legacy]) => {
        const merged = [...(createdBy as Organization[]), ...(legacy as Organization[])];
        const unique = new Map<string, Organization>();
        merged.forEach(item => {
          if (!unique.has(item.id)) unique.set(item.id, item);
        });
        return Array.from(unique.values());
      }),
      catchError((error: unknown) => {
        this.logger.error('[OrganizationRepository] findByCreator failed', error);
        return of<Organization[]>([]);
      })
    );
  }

  async create(payload: Omit<Organization, 'id'>): Promise<Organization> {
    const created_at = payload.created_at ?? new Date().toISOString();
    const docRef = await addDoc(this.collectionRef, {
      ...payload,
      created_at,
      creator_id: payload.creator_id ?? payload.created_by
    });
    return {
      ...payload,
      id: docRef.id,
      created_at,
      creator_id: payload.creator_id ?? payload.created_by
    };
  }

  async update(id: string, changes: Partial<Organization>): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), changes);
  }
}
