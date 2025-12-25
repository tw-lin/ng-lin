import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, setDoc, Firestore } from '@angular/fire/firestore';

import { COLLECTION_NAMES } from '../../../../firebase/constants/collection-names.const';
import { buildConverter } from '../../../../firebase/utils/firestore-converter.util';
import { toDateOrNull } from '../../../../firebase/utils/timestamp.util';
import { AccountDashboard } from '../models/account-dashboard.model';

@Injectable({ providedIn: 'root' })
export class AccountDashboardFirestoreRepository {
  private readonly firestore = inject(Firestore);

  private readonly collectionRef = collection(this.firestore, COLLECTION_NAMES.ACCOUNT_DASHBOARDS).withConverter(
    buildConverter<AccountDashboardFirestore>(
      data => ({
        id: data['id'] as string,
        namespacePath: data['namespacePath'] as string,
        summary: data['summary'] as string | undefined,
        recentActivity: (data['recentActivity'] as string[] | undefined) ?? [],
        updatedAt: toDateOrNull(data['updatedAt'])
      }),
      value => ({
        id: value.id,
        namespacePath: value.namespacePath,
        summary: value.summary ?? null,
        recentActivity: value.recentActivity ?? [],
        updatedAt: value.updatedAt ?? null
      })
    )
  );

  async getById(dashboardId: string): Promise<AccountDashboard | null> {
    const snapshot = await getDoc(doc(this.collectionRef, dashboardId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: data.id,
      namespacePath: data.namespacePath,
      summary: data.summary ?? undefined,
      recentActivity: data.recentActivity ?? [],
      updatedAt: data.updatedAt ?? undefined
    };
  }

  async upsert(dashboard: AccountDashboard): Promise<void> {
    await setDoc(doc(this.collectionRef, dashboard.id), {
      ...dashboard,
      updatedAt: new Date()
    });
  }
}

type AccountDashboardFirestore = AccountDashboard & {
  updatedAt: Date | null;
};
