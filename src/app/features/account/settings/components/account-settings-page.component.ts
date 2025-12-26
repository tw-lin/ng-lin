import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AccountSettingsStore } from '../stores/settings.store';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="account-settings">
      <header>
        <h2>Account Settings</h2>
        <p>Settings are provided via the Firebase-provider DI slice.</p>
      </header>

      @if (loading()) {
        <p>Loading settings…</p>
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (settings(); as settingsValue) {
        <pre aria-label="settings-json">{{ settingsValue | json }}</pre>
      } @else {
        <p>No settings loaded yet.</p>
      }

      <div class="actions">
        <button type="button" (click)="reload()">Reload</button>
      </div>
    </section>
  `,
  styles: [
    `
      .account-settings {
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
export class AccountSettingsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AccountSettingsStore);

  readonly settings = this.store.settings;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    const defaultId = this.route.snapshot.data['defaultSettingsId'] ?? 'settings-default';
    const settingsId = this.route.snapshot.paramMap.get('settingsId') ?? defaultId;
    void this.store.load(settingsId);
  }

  reload(): void {
    const defaultId = this.route.snapshot.data['defaultSettingsId'] ?? 'settings-default';
    const settingsId = this.route.snapshot.paramMap.get('settingsId') ?? defaultId;
    void this.store.load(settingsId);
  }
}
