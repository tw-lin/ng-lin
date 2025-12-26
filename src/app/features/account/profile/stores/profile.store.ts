import { inject, Injectable, signal } from '@angular/core';

import { AccountProfile } from '../../models/account-profile.model';
import { AccountProfileService } from '../services/profile.service';

@Injectable({ providedIn: 'root' })
export class AccountProfileStore {
  private readonly service = inject(AccountProfileService);

  readonly profile = signal<AccountProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(profileId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.loadProfile(profileId);
      this.profile.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      this.loading.set(false);
    }
  }

  async save(profile: AccountProfile): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.service.saveProfile(profile);
      this.profile.set(profile);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      this.loading.set(false);
    }
  }
}
