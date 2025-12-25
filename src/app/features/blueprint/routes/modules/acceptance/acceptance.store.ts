/**
 * Acceptance Store
 * 
 * Three-Layer Architecture:
 * UI (Component) → State Management (Store) → Data Access (Repository)
 * 
 * This store manages acceptance record state and coordinates repository operations.
 */

import { Injectable, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AcceptanceRepository } from '../acceptance.repository';
import { AcceptanceRecord } from '../acceptance.model';

@Injectable({
  providedIn: 'root'
})
export class AcceptanceStore {
  private readonly repository = inject(AcceptanceRepository);

  // Private writable signals
  private readonly _records = signal<AcceptanceRecord[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<Error | null>(null);

  // Public readonly signals
  readonly records = this._records.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Load acceptance records by blueprint ID
   */
  async loadRecords(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const records = await lastValueFrom(this.repository.findByBlueprintId(blueprintId));
      this._records.set(records);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load acceptance records');
      this._error.set(err);
      console.error('[AcceptanceStore] Failed to load records', error);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete acceptance record
   */
  async deleteRecord(blueprintId: string, recordId: string): Promise<void> {
    try {
      await this.repository.delete(blueprintId, recordId);
      
      // Update local state
      this._records.update(records => records.filter(r => r.id !== recordId));
    } catch (error) {
      console.error('[AcceptanceStore] Failed to delete record', error);
      throw error;
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
    this._records.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
