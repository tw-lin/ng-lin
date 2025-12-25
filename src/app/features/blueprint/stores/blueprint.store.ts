import { Injectable, computed, signal, inject } from '@angular/core';
import { Blueprint, OwnerType } from '@core/blueprint/domain/types/blueprint/blueprint.types';
import { firstValueFrom } from 'rxjs';

import { BlueprintFeatureService } from '../services/blueprint.service';

/**
 * Signal-based store for blueprint lists.
 * Keeps UI concerns decoupled from persistence and avoids direct Firebase SDK usage.
 */
@Injectable({ providedIn: 'root' })
export class BlueprintStore {
  private readonly service = inject(BlueprintFeatureService);

  private readonly items = signal<Blueprint[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal<Error | null>(null);

  readonly blueprints = this.items.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly hasError = computed(() => this.error() !== null);
  readonly errorMessage = computed(() => this.error()?.message ?? null);

  async loadByOwner(ownerType: OwnerType, ownerId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.service.getByOwner(ownerType, ownerId));
      this.items.set(data ?? []);
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error('Failed to load blueprints'));
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.items.set([]);
    this.error.set(null);
  }
}
