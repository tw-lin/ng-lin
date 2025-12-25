import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AccountDashboardStore } from '../stores/dashboard.store';

@Component({
  selector: 'app-account-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="account-dashboard">
      <header>
        <h2>Account Dashboard</h2>
        <p>Dashboard data flows through the Firebase-provider DI slice.</p>
      </header>

      @if (loading()) {
        <p>Loading dashboard…</p>
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (dashboard(); as dashboardValue) {
        <pre aria-label="dashboard-json">{{ dashboardValue | json }}</pre>
      } @else {
        <p>No dashboard loaded yet.</p>
      }

      <div class="actions">
        <button type="button" (click)="reload()">Reload</button>
      </div>
    </section>
  `,
  styles: [
    `
      .account-dashboard {
        display: grid;
        gap: 12px;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .error {
        color: #b00020;
      }
    `
  ]
})
export class AccountDashboardPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AccountDashboardStore);

  readonly dashboard = this.store.dashboard;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    const defaultId = this.route.snapshot.data['defaultDashboardId'] ?? 'dashboard-default';
    const dashboardId = this.route.snapshot.paramMap.get('dashboardId') ?? defaultId;
    void this.store.load(dashboardId);
  }

  reload(): void {
    const defaultId = this.route.snapshot.data['defaultDashboardId'] ?? 'dashboard-default';
    const dashboardId = this.route.snapshot.paramMap.get('dashboardId') ?? defaultId;
    void this.store.load(dashboardId);
  }
}
