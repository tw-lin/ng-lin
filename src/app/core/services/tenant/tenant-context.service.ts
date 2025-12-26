import { Injectable, computed, signal } from '@angular/core';

export type TenantType = 'organization' | 'user' | 'partner' | 'team' | null;

/**
 * Shared tenant context for guards/services (signals).
 */
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly tenantId = signal<string | null>(null);
  private readonly tenantType = signal<TenantType>(null);

  readonly currentTenantId = this.tenantId.asReadonly();
  readonly currentTenantType = this.tenantType.asReadonly();
  readonly hasTenant = computed(() => !!this.tenantId());

  setTenant(id: string, type: TenantType): void {
    this.tenantId.set(id);
    this.tenantType.set(type);
  }

  clear(): void {
    this.tenantId.set(null);
    this.tenantType.set(null);
  }
}
