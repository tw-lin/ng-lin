import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, setDoc, Firestore } from '@angular/fire/firestore';

import { COLLECTION_NAMES } from '../../../../firebase/constants/collection-names.const';
import { buildConverter } from '../../../../firebase/utils/firestore-converter.util';
import { toDateOrNull } from '../../../../firebase/utils/timestamp.util';
import { AccountSettings } from '../models/account-settings.model';

@Injectable({ providedIn: 'root' })
export class AccountSettingsFirestoreRepository {
  private readonly firestore = inject(Firestore);

  private readonly collectionRef = collection(this.firestore, COLLECTION_NAMES.ACCOUNT_SETTINGS).withConverter(
    buildConverter<AccountSettingsFirestore>(
      data => ({
        id: data['id'] as string,
        namespacePath: data['namespacePath'] as string,
        emailNotifications: Boolean(data['emailNotifications']),
        language: (data['language'] as string) ?? 'en',
        theme: (data['theme'] as 'light' | 'dark' | undefined) ?? undefined,
        updatedAt: toDateOrNull(data['updatedAt'])
      }),
      value => ({
        id: value.id,
        namespacePath: value.namespacePath,
        emailNotifications: value.emailNotifications,
        language: value.language,
        theme: value.theme ?? null,
        updatedAt: value.updatedAt ?? null
      })
    )
  );

  async getById(settingsId: string): Promise<AccountSettings | null> {
    const snapshot = await getDoc(doc(this.collectionRef, settingsId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: data.id,
      namespacePath: data.namespacePath,
      emailNotifications: data.emailNotifications,
      language: data.language,
      theme: data.theme ?? undefined,
      updatedAt: data.updatedAt ?? undefined
    };
  }

  async upsert(settings: AccountSettings): Promise<void> {
    await setDoc(doc(this.collectionRef, settings.id), {
      ...settings,
      updatedAt: new Date()
    });
  }
}

type AccountSettingsFirestore = AccountSettings & {
  updatedAt: Date | null;
};
