import { inject, Injectable } from '@angular/core';

import { AccountSettingsFirestoreRepository } from './settings-firestore.repository';
import { AccountSettings } from '../models/account-settings.model';

@Injectable({ providedIn: 'root' })
export class AccountSettingsService {
  private readonly repository = inject(AccountSettingsFirestoreRepository);

  async loadSettings(settingsId: string): Promise<AccountSettings | null> {
    if (!settingsId) return null;
    return this.repository.getById(settingsId);
  }

  async saveSettings(settings: AccountSettings): Promise<void> {
    await this.repository.upsert(settings);
  }
}
