/**
 * Organization Store
 *
 * Three-Layer Architecture:
 * UI (Component) → State Management (Store) → Data Access (Repository)
 *
 * This store manages organization state and coordinates repository operations.
 */

import { Injectable, inject, signal } from '@angular/core';
import { Organization } from '@core/account/models';
import { OrganizationRepository } from '@core/account/repositories';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrganizationStore {
  private readonly repository = inject(OrganizationRepository);

  // Private writable signals
  private readonly _organizations = signal<Organization[]>([]);
  private readonly _currentOrganization = signal<Organization | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<Error | null>(null);

  // Public readonly signals
  readonly organizations = this._organizations.asReadonly();
  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Load organization by ID
   */
  async loadOrganization(organizationId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const organization = await firstValueFrom(this.repository.findById(organizationId));
      this._currentOrganization.set(organization);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to load organization');
      this._error.set(err);
      console.error('[OrganizationStore] Failed to load organization', error);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update organization settings
   */
  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<void> {
    this._saving.set(true);
    this._error.set(null);

    try {
      await this.repository.update(organizationId, updates);

      // Update local state
      const current = this._currentOrganization();
      if (current && current.id === organizationId) {
        this._currentOrganization.set({ ...current, ...updates });
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Failed to update organization');
      this._error.set(err);
      console.error('[OrganizationStore] Failed to update organization', error);
      throw err;
    } finally {
      this._saving.set(false);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._organizations.set([]);
    this._currentOrganization.set(null);
    this._loading.set(false);
    this._saving.set(false);
    this._error.set(null);
  }
}
