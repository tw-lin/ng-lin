import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, addDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';

import { LoggerService } from '@core/services';
import { InvitationStatus } from '../types';

@Injectable({
  providedIn: 'root'
})
export class OrganizationInvitationRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'organization_invitations');

  findPendingInvitationsByUser(userId: string): Observable<Array<{ organization_id: string; status: InvitationStatus }>> {
    if (!userId) return of([]);
    const q = query(this.collectionRef, where('user_id', '==', userId), where('status', '==', InvitationStatus.PENDING));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Array<{ organization_id: string; status: InvitationStatus }>),
      catchError((error: unknown) => {
        this.logger.error('[OrganizationInvitationRepository] findPendingInvitationsByUser failed', error);
        return of([]);
      })
    );
  }

  async create(payload: {
    organization_id: string;
    user_id?: string;
    email?: string;
    invited_by?: string;
    status?: InvitationStatus;
  }): Promise<void> {
    await addDoc(this.collectionRef, { ...payload, status: payload.status ?? InvitationStatus.PENDING });
  }
}
