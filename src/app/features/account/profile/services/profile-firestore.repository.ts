import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, setDoc, Firestore } from '@angular/fire/firestore';

import { COLLECTION_NAMES } from '../../../../firebase/constants/collection-names.const';
import { buildConverter } from '../../../../firebase/utils/firestore-converter.util';
import { toDateOrNull } from '../../../../firebase/utils/timestamp.util';
import { AccountProfile } from '../../models/account-profile.model';

/**
 * Firestore data access for account profile documents.
 * Uses @angular/fire providers (initialized via firebase.providers.ts) and
 * must not call Firebase SDK directly. App Check is initialized upstream.
 */
@Injectable({ providedIn: 'root' })
export class AccountProfileFirestoreRepository {
  private readonly firestore = inject(Firestore);

  private readonly collectionRef = collection(this.firestore, COLLECTION_NAMES.ACCOUNT_PROFILES).withConverter(
    buildConverter<AccountProfileFirestore>(
      data => ({
        id: data['id'] as string,
        displayName: data['displayName'] as string,
        namespacePath: data['namespacePath'] as string,
        avatarUrl: data['avatarUrl'] as string | undefined,
        bio: data['bio'] as string | undefined,
        updatedAt: toDateOrNull(data['updatedAt'])
      }),
      value => ({
        id: value.id,
        displayName: value.displayName,
        namespacePath: value.namespacePath,
        avatarUrl: value.avatarUrl ?? null,
        bio: value.bio ?? null,
        updatedAt: value.updatedAt ?? null
      })
    )
  );

  async getById(profileId: string): Promise<AccountProfile | null> {
    const snapshot = await getDoc(doc(this.collectionRef, profileId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: data.id,
      displayName: data.displayName,
      namespacePath: data.namespacePath,
      avatarUrl: data.avatarUrl ?? undefined,
      bio: data.bio ?? undefined
    };
  }

  async upsert(profile: AccountProfile): Promise<void> {
    await setDoc(doc(this.collectionRef, profile.id), {
      ...profile,
      updatedAt: new Date()
    });
  }
}

type AccountProfileFirestore = AccountProfile & {
  updatedAt: Date | null;
};
