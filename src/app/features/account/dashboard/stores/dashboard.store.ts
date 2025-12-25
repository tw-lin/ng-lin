import { inject, Injectable, signal } from '@angular/core';

import { AccountDashboard } from '../models/account-dashboard.model';
import { AccountDashboardService } from '../services/dashboard.service';

@Injectable({ providedIn: 'root' })
export class AccountDashboardStore {
  private readonly service = inject(AccountDashboardService);

  readonly dashboard = signal<AccountDashboard | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(dashboardId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.loadDashboard(dashboardId);
      this.dashboard.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      this.loading.set(false);
    }
  }

  async save(dashboard: AccountDashboard): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.service.saveDashboard(dashboard);
      this.dashboard.set(dashboard);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to save dashboard');
    } finally {
      this.loading.set(false);
    }
  }
}
