import { inject, Injectable } from '@angular/core';

import { AuthPort } from './auth.port';
import { FirebaseAuthService } from '../../../firebase/infra/firebase-auth.service';

/**
 * Application-layer authentication facade.
 * Features call this API; underlying infra details (Firebase/@delon/auth) stay hidden in core.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade implements AuthPort {
  private readonly impl = inject(FirebaseAuthService);

  readonly user$ = this.impl.user$;
  readonly loading = this.impl.loading;
  readonly isAuthenticated = this.impl.isAuthenticated;
  get currentUser() {
    return this.impl.currentUser;
  }

  signIn(email: string, password: string) {
    return this.impl.signIn(email, password);
  }

  // Backward-compatible alias
  signInWithEmailAndPassword(email: string, password: string) {
    return this.impl.signIn(email, password);
  }

  signUp(email: string, password: string) {
    return this.impl.signUp(email, password);
  }

  // Backward-compatible alias
  signUpWithEmailAndPassword(email: string, password: string) {
    return this.impl.signUp(email, password);
  }

  signOut() {
    return this.impl.signOut();
  }

  sendPasswordReset(email: string) {
    return this.impl.sendPasswordReset(email);
  }

  refreshUser() {
    return this.impl.refreshUser();
  }

  currentEmail() {
    return this.impl.currentEmail();
  }
}
