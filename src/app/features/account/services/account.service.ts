import { inject, Injectable } from '@angular/core';

import { AccountDashboard } from '../dashboard/models/account-dashboard.model';
import { AccountDashboardService } from '../dashboard/services/dashboard.service';
import { AccountProfile } from '../models/account-profile.model';
import { AccountProfileService } from '../profile/services/profile.service';
import { AccountSettings } from '../settings/models/account-settings.model';
import { AccountSettingsService } from '../settings/services/settings.service';

/**
 * Account facade orchestrating profile, dashboard, and settings through slice services.
 * Uses @angular/fire-injected repositories (no direct Firebase SDK usage).
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly profileService = inject(AccountProfileService);
  private readonly dashboardService = inject(AccountDashboardService);
  private readonly settingsService = inject(AccountSettingsService);

  async loadProfile(profileId: string): Promise<AccountProfile | null> {
    return this.profileService.loadProfile(profileId);
  }

  async saveProfile(profile: AccountProfile): Promise<void> {
    return this.profileService.saveProfile(profile);
  }

  async loadDashboard(dashboardId: string): Promise<AccountDashboard | null> {
    return this.dashboardService.loadDashboard(dashboardId);
  }

  async saveDashboard(dashboard: AccountDashboard): Promise<void> {
    return this.dashboardService.saveDashboard(dashboard);
  }

  async loadSettings(settingsId: string): Promise<AccountSettings | null> {
    return this.settingsService.loadSettings(settingsId);
  }

  async saveSettings(settings: AccountSettings): Promise<void> {
    return this.settingsService.saveSettings(settings);
  }
}
