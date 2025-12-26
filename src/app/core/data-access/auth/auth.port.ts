import { Signal } from '@angular/core';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

/**
 * Public contract for authentication capabilities exposed to features.
 * Features must depend on this port instead of concrete Firebase/Delon implementations.
 */
export interface AuthPort {
  readonly user$: Observable<User | null>;
  readonly loading: Signal<boolean>;
  readonly isAuthenticated: Signal<boolean>;
  readonly currentUser: User | null;

  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  refreshUser(): Promise<User | null>;
  currentEmail(): string | null;
}
