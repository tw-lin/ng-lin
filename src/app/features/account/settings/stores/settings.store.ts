import { inject, Injectable, signal } from '@angular/core';

import { AccountSettings } from '../models/account-settings.model';
import { AccountSettingsService } from '../services/settings.service';

@Injectable({ providedIn: 'root' })
export class AccountSettingsStore {
  private readonly service = inject(AccountSettingsService);

  readonly settings = signal<AccountSettings | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(settingsId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.loadSettings(settingsId);
      this.settings.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      this.loading.set(false);
    }
  }

  async save(settings: AccountSettings): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.service.saveSettings(settings);
      this.settings.set(settings);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      this.loading.set(false);
    }
  }
}
