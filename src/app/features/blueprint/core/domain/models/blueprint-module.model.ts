/**
 * Blueprint Module Data Models
 *
 * Firestore persistence models for Blueprint Module subcollection.
 * Modules are stored as subcollection under each blueprint document.
 *
 * Collection path: blueprints/{blueprintId}/modules/{moduleId}
 */

import { Timestamp } from '@angular/fire/firestore';
import { ModuleStatus } from '@core/blueprint/modules/module-status.enum';

/**
 * Blueprint Module Document (Firestore)
 *
 * Represents a module configuration stored as a subcollection document.
 */
export interface BlueprintModuleDocument {
  /** Document ID (module type identifier) */
  readonly id?: string;

  /** Module type (e.g., 'tasks', 'logs', 'quality') */
  moduleType: string;

  /** Module name (display name) */
  name: string;

  /** Module version */
  version: string;

  /** Module status */
  status: ModuleStatus;

  /** Whether the module is enabled */
  enabled: boolean;

  /** Load order (lower numbers load first) */
  order: number;

  /** Module dependencies (other module types required) */
  dependencies: string[];

  /** Module-specific configuration */
  config: BlueprintModuleConfiguration;

  /** Module metadata */
  metadata?: Record<string, unknown>;

  // Audit fields
  /** User who configured this module */
  configuredBy: string;

  /** Configuration timestamp */
  configuredAt: Timestamp | Date;

  /** Last update timestamp */
  updatedAt: Timestamp | Date;

  /** Last activation timestamp */
  lastActivatedAt?: Timestamp | Date | null;

  /** Last deactivation timestamp */
  lastDeactivatedAt?: Timestamp | Date | null;
}

/**
 * Blueprint Module Configuration
 *
 * Type-safe module configuration structure for blueprint modules.
 */
export interface BlueprintModuleConfiguration {
  /** Enable/disable specific features */
  features?: Record<string, boolean>;

  /** Module-specific settings */
  settings?: Record<string, unknown>;

  /** UI customization options */
  ui?: {
    icon?: string;
    color?: string;
    position?: number;
    visibility?: 'visible' | 'hidden' | 'collapsed';
  };

  /** Permission configuration */
  permissions?: {
    requiredRoles?: string[];
    allowedActions?: string[];
  };

  /** Resource limits */
  limits?: {
    maxItems?: number;
    maxStorage?: number;
    maxRequests?: number;
  };

  /** Integration settings */
  integrations?: Record<string, unknown>;
}

/**
 * Create Blueprint Module Data
 *
 * Data required to add a new module to a blueprint.
 */
export interface CreateModuleData {
  moduleType: string;
  name: string;
  version: string;
  enabled?: boolean;
  order?: number;
  dependencies?: string[];
  config?: BlueprintModuleConfiguration;
  metadata?: Record<string, unknown>;
  configuredBy: string;
}

/**
 * Update Blueprint Module Data
 *
 * Partial update data for module documents.
 */
export type UpdateModuleData = Partial<Omit<BlueprintModuleDocument, 'id' | 'moduleType' | 'configuredAt' | 'configuredBy'>>;

/**
 * Module Status Summary
 *
 * Summary of module states within a blueprint.
 */
export interface ModuleStatusSummary {
  total: number;
  enabled: number;
  disabled: number;
  active: number;
  error: number;
  byStatus: Record<ModuleStatus, number>;
}

/**
 * Module Dependency Graph Node
 *
 * Represents a node in the module dependency graph.
 */
export interface ModuleDependencyNode {
  moduleType: string;
  name: string;
  version: string;
  dependencies: string[];
  dependents: string[]; // Modules that depend on this one
  order: number;
  enabled: boolean;
  status: ModuleStatus;
}

/**
 * Batch Module Operation Result
 *
 * Result of batch operations on multiple modules.
 */
export interface BatchModuleOperationResult {
  success: string[]; // Module IDs that succeeded
  failed: Array<{
    moduleId: string;
    error: string;
  }>;
  skipped: string[]; // Module IDs that were skipped
}
