/**
 * Module Registry Interface
 *
 * Defines the contract for registering, managing, and querying Blueprint modules.
 * Handles dependency resolution and version management.
 *
 * @packageDocumentation
 */

import { IBlueprintModule } from '../modules/module.interface';

/**
 * Module metadata stored in the registry
 */
export interface ModuleMetadata {
  /** Unique module identifier */
  readonly id: string;

  /** Module name */
  readonly name: string;

  /** Semantic version (e.g., "1.2.3") */
  readonly version: string;

  /** Module instance */
  readonly instance: IBlueprintModule;

  /** Module dependencies (array of module IDs) */
  readonly dependencies: readonly string[];

  /** Timestamp when module was registered */
  readonly registeredAt: Date;
}

/**
 * Dependency resolution result
 */
export interface DependencyResolution {
  /** Ordered list of module IDs in load order (dependencies first) */
  readonly loadOrder: readonly string[];

  /** Indicates if circular dependencies were detected */
  readonly hasCircularDependency: boolean;

  /** Circular dependency paths if detected */
  readonly circularPaths?: readonly string[][];
}

/**
 * Module Registry Interface
 *
 * Manages module registration, lookup, and dependency resolution.
 *
 * @example
 * ```typescript
 * const registry = new ModuleRegistry();
 *
 * // Register modules
 * registry.register(tasksModule);
 * registry.register(logsModule);
 *
 * // Get module
 * const module = registry.get('tasks-module');
 *
 * // Resolve dependencies
 * const resolution = registry.resolveDependencies(['tasks-module']);
 * console.log('Load order:', resolution.loadOrder);
 *
 * // Check for circular dependencies
 * if (resolution.hasCircularDependency) {
 *   console.error('Circular dependency detected!');
 * }
 * ```
 */
export interface IModuleRegistry {
  /**
   * Register a module in the registry
   *
   * @param module - The module instance to register
   * @throws Error if module with same ID already registered
   */
  register(module: IBlueprintModule): void;

  /**
   * Unregister a module from the registry
   *
   * @param moduleId - The ID of the module to unregister
   * @returns true if module was found and unregistered, false otherwise
   */
  unregister(moduleId: string): boolean;

  /**
   * Get a module by ID
   *
   * @param moduleId - The ID of the module to retrieve
   * @returns The module instance or undefined if not found
   */
  get(moduleId: string): IBlueprintModule | undefined;

  /**
   * Get module metadata
   *
   * @param moduleId - The ID of the module
   * @returns Module metadata or undefined if not found
   */
  getMetadata(moduleId: string): ModuleMetadata | undefined;

  /**
   * Check if a module is registered
   *
   * @param moduleId - The ID of the module to check
   * @returns true if module is registered, false otherwise
   */
  has(moduleId: string): boolean;

  /**
   * Get all registered module IDs
   *
   * @returns Array of all registered module IDs
   */
  getAllModuleIds(): readonly string[];

  /**
   * Get all registered modules
   *
   * @returns Array of all module instances
   */
  getAllModules(): readonly IBlueprintModule[];

  /**
   * Get all registered module metadata
   *
   * @returns Array of all module metadata
   */
  getAllMetadata(): readonly ModuleMetadata[];

  /**
   * Resolve module dependencies
   *
   * Calculates the correct load order for modules based on their dependencies.
   * Detects circular dependencies.
   *
   * @param moduleIds - Array of module IDs to resolve
   * @returns Dependency resolution result with load order and circular dependency info
   */
  resolveDependencies(moduleIds: readonly string[]): DependencyResolution;

  /**
   * Get dependencies of a module (immediate dependencies only)
   *
   * @param moduleId - The ID of the module
   * @returns Array of dependency module IDs
   */
  getDependencies(moduleId: string): readonly string[];

  /**
   * Get all dependencies of a module (recursive, flattened)
   *
   * @param moduleId - The ID of the module
   * @returns Array of all dependency module IDs (including transitive dependencies)
   */
  getAllDependencies(moduleId: string): readonly string[];

  /**
   * Get dependents of a module (modules that depend on this module)
   *
   * @param moduleId - The ID of the module
   * @returns Array of dependent module IDs
   */
  getDependents(moduleId: string): readonly string[];

  /**
   * Get all registered modules
   *
   * @returns Array of all module instances
   */
  list(): readonly IBlueprintModule[];

  /**
   * Check for missing dependencies
   *
   * @param modules - Array of modules to check
   * @returns Array of missing dependency IDs
   */
  checkMissingDependencies(modules: readonly IBlueprintModule[]): readonly string[];

  /**
   * Clear all registered modules
   */
  clear(): void;

  /**
   * Get the number of registered modules
   *
   * @returns Count of registered modules
   */
  get size(): number;
}
