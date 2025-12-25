import { inject, Injectable, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from '@angular/fire/auth';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { Observable } from 'rxjs';

import { AuthState } from '../../core/data-access/auth/auth.state';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private readonly auth = inject(Auth);
  private readonly injector = inject(EnvironmentInjector);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly state = new AuthState();
  readonly user$: Observable<User | null> = authState(this.auth);
  readonly loading = this.state.loading.asReadonly();
  readonly isAuthenticated = this.state.isAuthenticated;

  constructor() {
    this.user$.subscribe(user => this.state.currentUser.set(user));
  }

  private runInCtx<T>(fn: () => Promise<T>): Promise<T> {
    return runInInjectionContext(this.injector, fn);
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async signIn(email: string, password: string): Promise<User> {
    return this.runInCtx(async () => {
      this.state.loading.set(true);
      try {
        const credential = await signInWithEmailAndPassword(this.auth, email, password);
        const idToken = await credential.user.getIdToken();
        this.tokenService.set({
          token: idToken,
          uid: credential.user.uid,
          email: credential.user.email ?? ''
        });
        this.state.currentUser.set(credential.user);
        return credential.user;
      } finally {
        this.state.loading.set(false);
      }
    });
  }

  async signUp(email: string, password: string): Promise<User> {
    return this.runInCtx(async () => {
      this.state.loading.set(true);
      try {
        const credential = await createUserWithEmailAndPassword(this.auth, email, password);
        const idToken = await credential.user.getIdToken();
        this.tokenService.set({
          token: idToken,
          uid: credential.user.uid,
          email: credential.user.email ?? ''
        });
        this.state.currentUser.set(credential.user);
        return credential.user;
      } finally {
        this.state.loading.set(false);
      }
    });
  }

  async signOut(): Promise<void> {
    return this.runInCtx(async () => {
      await firebaseSignOut(this.auth);
      this.tokenService.clear();
      this.state.currentUser.set(null);
    });
  }

  async refreshUser(): Promise<User | null> {
    return this.runInCtx(async () => {
      const current = this.auth.currentUser;
      if (!current) return null;
      await current.reload();
      const fresh = this.auth.currentUser;
      this.state.currentUser.set(fresh);
      if (fresh) {
        const idToken = await fresh.getIdToken();
        this.tokenService.set({
          token: idToken,
          uid: fresh.uid,
          email: fresh.email ?? ''
        });
      }
      return fresh ?? null;
    });
  }

  currentEmail(): string | null {
    return this.auth.currentUser?.email ?? null;
  }

  // Backward-compatible aliases
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    return this.signIn(email, password);
  }

  async signUpWithEmailAndPassword(email: string, password: string): Promise<User> {
    return this.signUp(email, password);
  }

  async sendPasswordReset(email: string): Promise<void> {
    return this.runInCtx(() => sendPasswordResetEmail(this.auth, email));
  }
}
