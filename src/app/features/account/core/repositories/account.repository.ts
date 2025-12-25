import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData, collection, collectionData, query, where, updateDoc, setDoc } from '@angular/fire/firestore';
import { firstValueFrom, Observable, catchError, map, of } from 'rxjs';

import { LoggerService } from '@core/services';
import { Account } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AccountRepository {
  private readonly firestore = inject(Firestore);
  private readonly logger = inject(LoggerService);
  private readonly collectionRef = collection(this.firestore, 'accounts');

  findById(id: string): Observable<Account | null> {
    if (!id) {
      return of(null);
    }

    return docData(doc(this.collectionRef, id)).pipe(
      map(account => ({ ...(account as Account), id })),
      catchError((error: unknown) => {
        this.logger.error('[AccountRepository] findById failed', error);
        return of(null);
      })
    );
  }

  async findByEmail(email: string): Promise<Account | null> {
    if (!email) return null;
    const q = query(this.collectionRef, where('email', '==', email));
    const result = await firstValueFrom(
      collectionData(q, { idField: 'id' }).pipe(
        catchError((error: unknown) => {
          this.logger.error('[AccountRepository] findByEmail failed', error);
          return of([]);
        })
      )
    );
    return (result[0] as Account | undefined) ?? null;
  }

  async update(id: string, data: Partial<Account>): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), data);
  }

  async upsert(account: Account): Promise<void> {
    await setDoc(doc(this.collectionRef, account.id), account, { merge: true });
  }
}
