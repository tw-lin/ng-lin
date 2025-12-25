import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, doc, addDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';

import { LoggerService } from '@core/services';
import { NotificationPayload } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'notifications');

  watchByUser(userId: string): Observable<NotificationPayload[]> {
    if (!userId) return of([]);
    const q = query(this.collectionRef, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as NotificationPayload[]),
      catchError((error: unknown) => {
        this.logger.error('[NotificationRepository] watchByUser failed', error);
        return of<NotificationPayload[]>([]);
      })
    );
  }

  async markAsRead(id: string): Promise<void> {
    // placeholder; real impl should update doc
    void doc(this.collectionRef, id);
  }

  async create(payload: NotificationPayload): Promise<NotificationPayload> {
    const created = { ...payload, datetime: payload.datetime ?? new Date().toISOString() };
    const docRef = await addDoc(this.collectionRef, created);
    return { ...created, id: docRef.id };
  }
}
