import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';

import { LoggerService } from '@core/services';
import { OrganizationMember } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrganizationMemberRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'organization_members');

  findByOrganization(organizationId: string): Observable<OrganizationMember[]> {
    if (!organizationId) return of([]);
    const q = query(this.collectionRef, where('organization_id', '==', organizationId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(items => items as OrganizationMember[]),
      catchError((error: unknown) => {
        this.logger.error('[OrganizationMemberRepository] findByOrganization failed', error);
        return of<OrganizationMember[]>([]);
      })
    );
  }
}
