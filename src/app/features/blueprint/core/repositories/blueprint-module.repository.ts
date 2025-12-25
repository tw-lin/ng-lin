/**
 * Blueprint Module Repository
 *
 * Manages CRUD operations for blueprint module subcollection in Firestore.
 * Collection path: blueprints/{blueprintId}/modules/{moduleId}
 *
 * @author GigHub Development Team
 * @date 2025-12-10
 */

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  writeBatch
} from '@angular/fire/firestore';
import {
  BlueprintModuleDocument,
  CreateModuleData,
  UpdateModuleData,
  ModuleStatusSummary,
  BatchModuleOperationResult
} from '@core/blueprint/domain/models';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';
import { Observable, from, map, catchError, of } from 'rxjs';

/**
 * Blueprint Module Repository Service
 *
 * Handles all Firestore operations for blueprint modules.
 */
@Injectable({
  providedIn: 'root'
})
export class BlueprintModuleRepository {
  private readonly firestore = inject(Firestore);
  private readonly parentCollection = 'blueprints';
  private readonly subcollectionName = 'modules';

  /**
   * Get modules subcollection reference
   */
  private getModulesCollection(blueprintId: string): CollectionReference {
    return collection(this.firestore, this.parentCollection, blueprintId, this.subcollectionName);
  }

  /**
   * Get module document reference
   */
  private getModuleDoc(blueprintId: string, moduleId: string): DocumentReference {
    return doc(this.firestore, this.parentCollection, blueprintId, this.subcollectionName, moduleId);
  }

  /**
   * Convert Firestore data to BlueprintModuleDocument
   */
  private toModuleDocument(data: any, id: string, blueprintId: string): BlueprintModuleDocument {
    return {
      id,
      moduleType: data.moduleType,
      name: data.name,
      version: data.version,
      status: data.status,
      enabled: data.enabled,
      order: data.order,
      dependencies: data.dependencies || [],
      config: data.config || {},
      metadata: data.metadata || {},
      configuredBy: data.configuredBy,
      configuredAt: data.configuredAt instanceof Timestamp ? data.configuredAt.toDate() : data.configuredAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      lastActivatedAt: data.lastActivatedAt
        ? data.lastActivatedAt instanceof Timestamp
          ? data.lastActivatedAt.toDate()
          : data.lastActivatedAt
        : null,
      lastDeactivatedAt: data.lastDeactivatedAt
        ? data.lastDeactivatedAt instanceof Timestamp
          ? data.lastDeactivatedAt.toDate()
          : data.lastDeactivatedAt
        : null
    };
  }

  /**
   * Find all modules for a blueprint
   */
  findByBlueprintId(blueprintId: string): Observable<BlueprintModuleDocument[]> {
    const q = query(this.getModulesCollection(blueprintId), orderBy('order', 'asc'));

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toModuleDocument(docSnap.data(), docSnap.id, blueprintId))),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Find enabled modules only
   */
  findEnabledModules(blueprintId: string): Observable<BlueprintModuleDocument[]> {
    const q = query(this.getModulesCollection(blueprintId), where('enabled', '==', true), orderBy('order', 'asc'));

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(docSnap => this.toModuleDocument(docSnap.data(), docSnap.id, blueprintId))),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Find module by ID
   */
  findById(blueprintId: string, moduleId: string): Observable<BlueprintModuleDocument | null> {
    return from(getDoc(this.getModuleDoc(blueprintId, moduleId))).pipe(
      map(snapshot => (snapshot.exists() ? this.toModuleDocument(snapshot.data(), snapshot.id, blueprintId) : null)),
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Find module by type
   */
  findByType(blueprintId: string, moduleType: string): Observable<BlueprintModuleDocument | null> {
    const q = query(this.getModulesCollection(blueprintId), where('moduleType', '==', moduleType));

    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return this.toModuleDocument(doc.data(), doc.id, blueprintId);
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Create a new module
   */
  async create(blueprintId: string, data: CreateModuleData): Promise<BlueprintModuleDocument> {
    const now = Timestamp.now();
    const docData = {
      moduleType: data.moduleType,
      name: data.name,
      version: data.version,
      status: ModuleStatus.UNINITIALIZED,
      enabled: data.enabled ?? true,
      order: data.order ?? 100,
      dependencies: data.dependencies || [],
      config: data.config || {},
      metadata: data.metadata || {},
      configuredBy: data.configuredBy,
      configuredAt: now,
      updatedAt: now,
      lastActivatedAt: null,
      lastDeactivatedAt: null
    };

    try {
      const docRef = await addDoc(this.getModulesCollection(blueprintId), docData);

      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return this.toModuleDocument(snapshot.data(), snapshot.id, blueprintId);
      }

      // Fallback
      return this.toModuleDocument(docData, docRef.id, blueprintId);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update an existing module
   */
  async update(blueprintId: string, moduleId: string, data: UpdateModuleData): Promise<void> {
    const docData = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Remove id if present
    delete (docData as any).id;

    try {
      await updateDoc(this.getModuleDoc(blueprintId, moduleId), docData);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update module status
   */
  async updateStatus(blueprintId: string, moduleId: string, status: ModuleStatus): Promise<void> {
    const docData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    // Track activation/deactivation
    if (status === ModuleStatus.RUNNING || status === ModuleStatus.STARTED) {
      docData.lastActivatedAt = Timestamp.now();
    } else if (status === ModuleStatus.STOPPED || status === ModuleStatus.DISPOSED) {
      docData.lastDeactivatedAt = Timestamp.now();
    }

    try {
      await updateDoc(this.getModuleDoc(blueprintId, moduleId), docData);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Enable a module
   */
  async enable(blueprintId: string, moduleId: string): Promise<void> {
    try {
      await updateDoc(this.getModuleDoc(blueprintId, moduleId), {
        enabled: true,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Disable a module
   */
  async disable(blueprintId: string, moduleId: string): Promise<void> {
    try {
      await updateDoc(this.getModuleDoc(blueprintId, moduleId), {
        enabled: false,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Delete a module
   */
  async delete(blueprintId: string, moduleId: string): Promise<void> {
    try {
      await deleteDoc(this.getModuleDoc(blueprintId, moduleId));
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Batch enable/disable modules
   */
  async batchUpdateEnabled(blueprintId: string, moduleIds: string[], enabled: boolean): Promise<BatchModuleOperationResult> {
    const batch = writeBatch(this.firestore);
    const result: BatchModuleOperationResult = {
      success: [],
      failed: [],
      skipped: []
    };

    try {
      for (const moduleId of moduleIds) {
        const docRef = this.getModuleDoc(blueprintId, moduleId);
        batch.update(docRef, {
          enabled,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();
      result.success = moduleIds;
    } catch (error: any) {
      result.failed = moduleIds.map(id => ({ moduleId: id, error: error.message }));
    }

    return result;
  }

  /**
   * Get module status summary
   */
  async getStatusSummary(blueprintId: string): Promise<ModuleStatusSummary> {
    try {
      const snapshot = await getDocs(this.getModulesCollection(blueprintId));

      const summary: ModuleStatusSummary = {
        total: snapshot.size,
        enabled: 0,
        disabled: 0,
        active: 0,
        error: 0,
        byStatus: {} as Record<ModuleStatus, number>
      };

      // Initialize status counts
      Object.values(ModuleStatus).forEach(status => {
        summary.byStatus[status] = 0;
      });

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        if (data['enabled']) {
          summary.enabled++;
        } else {
          summary.disabled++;
        }

        const status = data['status'] as ModuleStatus;
        if (status === ModuleStatus.RUNNING || status === ModuleStatus.STARTED) {
          summary.active++;
        }

        if (status === ModuleStatus.ERROR) {
          summary.error++;
        }

        summary.byStatus[status]++;
      });

      return summary;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check if module type exists
   */
  async exists(blueprintId: string, moduleType: string): Promise<boolean> {
    try {
      const q = query(this.getModulesCollection(blueprintId), where('moduleType', '==', moduleType));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      return false;
    }
  }
}
