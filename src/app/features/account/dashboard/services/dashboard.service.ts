import { inject, Injectable } from '@angular/core';

import { AccountDashboardFirestoreRepository } from './dashboard-firestore.repository';
import { AccountDashboard } from '../models/account-dashboard.model';

@Injectable({ providedIn: 'root' })
export class AccountDashboardService {
  private readonly repository = inject(AccountDashboardFirestoreRepository);

  async loadDashboard(dashboardId: string): Promise<AccountDashboard | null> {
    if (!dashboardId) return null;
    return this.repository.getById(dashboardId);
  }

  async saveDashboard(dashboard: AccountDashboard): Promise<void> {
    await this.repository.upsert(dashboard);
  }
}
