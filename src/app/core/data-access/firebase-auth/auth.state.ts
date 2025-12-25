import { computed, signal } from '@angular/core';
import { User } from '@angular/fire/auth';

/**
 * Minimal state holder for auth; used by the infra service to expose signals.
 */
export class AuthState {
  readonly loading = signal(false);
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
}
