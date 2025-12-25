import { Injectable, inject } from '@angular/core';
import { Blueprint, CreateBlueprintRequest, UpdateBlueprintRequest } from '@core/blueprint/domain/types/blueprint/blueprint.types';
import { OwnerType } from '@core/blueprint/domain/types/blueprint/owner-type.enum';
import { from, Observable } from 'rxjs';

import { BlueprintFirestoreRepository } from './blueprint-firestore.repository';

/**
 * Feature-layer Blueprint service using @angular/fire DI.
 * Responsibilities:
 * - Delegates persistence to Firestore repository
 * - Exposes Observable APIs for UI consumption
 * - Avoids direct Firebase SDK usage outside DI context
 */
@Injectable({ providedIn: 'root' })
export class BlueprintFeatureService {
  private readonly repo = inject(BlueprintFirestoreRepository);

  getById(id: string): Observable<Blueprint | null> {
    return from(this.repo.getById(id));
  }

  getByOwner(ownerType: OwnerType, ownerId: string): Observable<Blueprint[]> {
    return from(this.repo.getByOwner(ownerType, ownerId));
  }

  create(payload: CreateBlueprintRequest): Promise<Blueprint> {
    return this.repo.create(payload);
  }

  update(id: string, updates: UpdateBlueprintRequest): Promise<void> {
    return this.repo.update(id, updates);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
