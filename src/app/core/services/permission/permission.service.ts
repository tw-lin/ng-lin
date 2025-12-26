import { Injectable, computed, signal } from '@angular/core';

/**
 * Minimal permission service (signals) for cross-feature reuse.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly permissions = signal<Set<string>>(new Set());

  readonly permissionList = computed(() => Array.from(this.permissions()));

  setPermissions(perms: string[]): void {
    this.permissions.set(new Set(perms));
  }

  add(permission: string): void {
    this.permissions.update(set => {
      const next = new Set(set);
      next.add(permission);
      return next;
    });
  }

  remove(permission: string): void {
    this.permissions.update(set => {
      const next = new Set(set);
      next.delete(permission);
      return next;
    });
  }

  has(permission: string): boolean {
    return this.permissions().has(permission);
  }
}
