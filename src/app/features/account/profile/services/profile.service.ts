import { inject, Injectable } from '@angular/core';

import { AccountProfileFirestoreRepository } from './profile-firestore.repository';
import { AccountProfile } from '../../models/account-profile.model';

/**
 * Account profile orchestration layer.
 * Keeps business rules separate from Firestore access and consumes only
 *
 * @angular/fire-injected repositories.
 */
@Injectable({ providedIn: 'root' })
export class AccountProfileService {
  private readonly repository = inject(AccountProfileFirestoreRepository);

  async loadProfile(profileId: string): Promise<AccountProfile | null> {
    if (!profileId) return null;
    return this.repository.getById(profileId);
  }

  async saveProfile(profile: AccountProfile): Promise<void> {
    await this.repository.upsert(profile);
  }
}
