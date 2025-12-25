import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';

import { LoggerService } from '@core/services';
import { Team } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TeamRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'teams');

  findByOrganization(organizationId: string): Observable<Team[]> {
    if (!organizationId) return of([]);
    const q = query(this.collectionRef, where('organization_id', '==', organizationId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as Team[]),
      catchError((error: unknown) => {
        this.logger.error('[TeamRepository] findByOrganization failed', error);
        return of<Team[]>([]);
      })
    );
  }
}
