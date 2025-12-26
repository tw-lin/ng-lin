import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AccountProfileStore } from '../stores/profile.store';

@Component({
  selector: 'app-account-profile-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="account-profile">
      <header>
        <h2>Account Profile</h2>
        <p>Profile data is loaded through the Firebase-provider DI slice (no direct SDK access).</p>
      </header>

      @if (loading()) {
        <p>Loading profile…</p>
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (profile(); as profileValue) {
        <pre aria-label="profile-json">{{ profileValue | json }}</pre>
      } @else {
        <p>No profile loaded yet.</p>
      }

      <div class="actions">
        <button type="button" (click)="reload()">Reload</button>
      </div>
    </section>
  `,
  styles: [
    `
      .account-profile {
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
export class AccountProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(AccountProfileStore);

  readonly profile = this.store.profile;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  constructor() {
    const defaultId = this.route.snapshot.data['defaultProfileId'] ?? 'profile-default';
    const profileId = this.route.snapshot.paramMap.get('profileId') ?? defaultId;
    void this.store.load(profileId);
  }

  reload(): void {
    const defaultId = this.route.snapshot.data['defaultProfileId'] ?? 'profile-default';
    const profileId = this.route.snapshot.paramMap.get('profileId') ?? defaultId;
    void this.store.load(profileId);
  }
}
