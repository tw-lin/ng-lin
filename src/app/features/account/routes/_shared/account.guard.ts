import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Minimal account guard.
 * Replace the simple allow/deny logic with real auth checks (e.g. inject an AuthService).
 */
export const accountGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);

  // TODO: replace with actual authentication check
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return router.parseUrl('/login');
  }

  return true;
};
