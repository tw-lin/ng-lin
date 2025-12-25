/**
 * Module Registry Implementation
 *
 * Manages registration and lookup of Blueprint modules with dependency resolution.
 *
 * @packageDocumentation
 */

import { Injectable, signal, Signal } from '@angular/core';

import { IModuleRegistry, ModuleMetadata, DependencyResolution } from './module-registry.interface';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * Module Registry Service
 *
 * Provides centralized module management with:
 * - Module registration and unregistration
 * - Dependency resolution with circular dependency detection
 * - Version management
 * - Module lookup and querying
 *
 * @example
 * ```typescript
 * @Component({
 *   // ...
 * })
 * export class AppComponent {
 *   private registry = inject(ModuleRegistry);
 *
 *   ngOnInit() {
 *     // Register modules
 *     this.registry.register(new TasksModule());
 *     this.registry.register(new LogsModule());
 *
 *     // Resolve dependencies
 *     const resolution = this.registry.resolveDependencies(['tasks-module']);
 *     console.log('Load order:', resolution.loadOrder);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ModuleRegistry implements IModuleRegistry {
  /** Internal module storage */
  private readonly modules = new Map<string, ModuleMetadata>();

  /** Signal for reactive module count */
  private readonly _moduleCount = signal(0);

  /**
   * Reactive signal for the number of registered modules
   */
  public readonly moduleCount: Signal<number> = this._moduleCount.asReadonly();

  /**
   * Register a module in the registry
   *
   * @param module - The module instance to register
   * @throws Error if module with same ID already registered
   */
  register(module: IBlueprintModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID "${module.id}" is already registered`);
    }

    const metadata: ModuleMetadata = {
      id: module.id,
      name: module.name,
      version: module.version,
      instance: module,
      dependencies: Object.freeze([...module.dependencies]),
      registeredAt: new Date()
    };

    this.modules.set(module.id, Object.freeze(metadata));
    this._moduleCount.set(this.modules.size);
  }

  /**
   * Unregister a module from the registry
   *
   * @param moduleId - The ID of the module to unregister
   * @returns true if module was found and unregistered, false otherwise
   */
  unregister(moduleId: string): boolean {
    const result = this.modules.delete(moduleId);
    if (result) {
      this._moduleCount.set(this.modules.size);
    }
    return result;
  }

  /**
   * Get a module by ID
   *
   * @param moduleId - The ID of the module to retrieve
   * @returns The module instance or undefined if not found
   */
  get(moduleId: string): IBlueprintModule | undefined {
    return this.modules.get(moduleId)?.instance;
  }

  /**
   * Get module metadata
   *
   * @param moduleId - The ID of the module
   * @returns Module metadata or undefined if not found
   */
  getMetadata(moduleId: string): ModuleMetadata | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Check if a module is registered
   *
   * @param moduleId - The ID of the module to check
   * @returns true if module is registered, false otherwise
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Get all registered module IDs
   *
   * @returns Array of all registered module IDs
   */
  getAllModuleIds(): readonly string[] {
    return Object.freeze([...this.modules.keys()]);
  }

  /**
   * Get all registered modules
   *
   * @returns Array of all module instances
   */
  getAllModules(): readonly IBlueprintModule[] {
    return Object.freeze([...this.modules.values()].map(meta => meta.instance));
  }

  /**
   * Get all registered module metadata
   *
   * @returns Array of all module metadata
   */
  getAllMetadata(): readonly ModuleMetadata[] {
    return Object.freeze([...this.modules.values()]);
  }

  /**
   * Resolve module dependencies
   *
   * Uses topological sort to determine correct load order.
   * Detects circular dependencies using DFS cycle detection.
   *
   * @param moduleIds - Array of module IDs to resolve
   * @returns Dependency resolution result with load order and circular dependency info
   */
  resolveDependencies(moduleIds: readonly string[]): DependencyResolution {
    // Check if all modules exist
    for (const id of moduleIds) {
      if (!this.has(id)) {
        throw new Error(`Module "${id}" is not registered`);
      }
    }

    // Detect circular dependencies first
    const circularPaths = this.detectCircularDependencies(moduleIds);

    if (circularPaths.length > 0) {
      return {
        loadOrder: Object.freeze([]),
        hasCircularDependency: true,
        circularPaths: Object.freeze(circularPaths)
      };
    }

    // Perform topological sort
    const loadOrder = this.topologicalSort(moduleIds);

    return {
      loadOrder: Object.freeze(loadOrder),
      hasCircularDependency: false
    };
  }

  /**
   * Get dependencies of a module (immediate dependencies only)
   *
   * @param moduleId - The ID of the module
   * @returns Array of dependency module IDs
   */
  getDependencies(moduleId: string): readonly string[] {
    const metadata = this.getMetadata(moduleId);
    return metadata ? metadata.dependencies : Object.freeze([]);
  }

  /**
   * Get all dependencies of a module (recursive, flattened)
   *
   * @param moduleId - The ID of the module
   * @returns Array of all dependency module IDs (including transitive dependencies)
   */
  getAllDependencies(moduleId: string): readonly string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const deps = this.getDependencies(id);
      for (const dep of deps) {
        visit(dep);
        if (!result.includes(dep)) {
          result.push(dep);
        }
      }
    };

    visit(moduleId);
    return Object.freeze(result);
  }

  /**
   * Get dependents of a module (modules that depend on this module)
   *
   * @param moduleId - The ID of the module
   * @returns Array of dependent module IDs
   */
  getDependents(moduleId: string): readonly string[] {
    const dependents: string[] = [];

    for (const [id, metadata] of this.modules) {
      if (metadata.dependencies.includes(moduleId)) {
        dependents.push(id);
      }
    }

    return Object.freeze(dependents);
  }

  /**
   * Get all registered modules
   *
   * @returns Array of all module instances
   */
  list(): readonly IBlueprintModule[] {
    return Object.freeze(Array.from(this.modules.values()).map(metadata => metadata.instance));
  }

  /**
   * Check for missing dependencies
   *
   * @param modules - Array of modules to check
   * @returns Array of missing dependency IDs
   */
  checkMissingDependencies(modules: readonly IBlueprintModule[]): readonly string[] {
    const registeredIds = new Set(this.getAllModuleIds());
    const missing = new Set<string>();

    for (const module of modules) {
      for (const depId of module.dependencies) {
        if (!registeredIds.has(depId)) {
          missing.add(depId);
        }
      }
    }

    return Object.freeze(Array.from(missing));
  }

  /**
   * Clear all registered modules
   */
  clear(): void {
    this.modules.clear();
    this._moduleCount.set(0);
  }

  /**
   * Get the number of registered modules
   *
   * @returns Count of registered modules
   */
  get size(): number {
    return this.modules.size;
  }

  /**
   * Detect circular dependencies using DFS
   *
   * @private
   * @param moduleIds - Array of module IDs to check
   * @returns Array of circular dependency paths
   */
  private detectCircularDependencies(moduleIds: readonly string[]): string[][] {
    const circularPaths: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (moduleId: string): void => {
      visited.add(moduleId);
      recursionStack.add(moduleId);
      currentPath.push(moduleId);

      const deps = this.getDependencies(moduleId);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(dep);
          const cyclePath = currentPath.slice(cycleStart).concat(dep);
          circularPaths.push(cyclePath);
        }
      }

      currentPath.pop();
      recursionStack.delete(moduleId);
    };

    for (const id of moduleIds) {
      if (!visited.has(id)) {
        dfs(id);
      }
    }

    return circularPaths;
  }

  /**
   * Perform topological sort using Kahn's algorithm
   *
   * @private
   * @param moduleIds - Array of module IDs to sort
   * @returns Sorted array of module IDs (dependencies first)
   */
  private topologicalSort(moduleIds: readonly string[]): string[] {
    // Build dependency graph
    const allModules = new Set<string>();
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Collect all modules (including transitive dependencies)
    const collectModules = (id: string) => {
      if (allModules.has(id)) return;
      allModules.add(id);

      const deps = this.getDependencies(id);
      for (const dep of deps) {
        collectModules(dep);
      }
    };

    for (const id of moduleIds) {
      collectModules(id);
    }

    // Initialize graph
    for (const id of allModules) {
      inDegree.set(id, 0);
      adjacencyList.set(id, []);
    }

    // Build adjacency list and in-degree counts
    for (const id of allModules) {
      const deps = this.getDependencies(id);
      for (const dep of deps) {
        adjacencyList.get(dep)!.push(id);
        inDegree.set(id, inDegree.get(id)! + 1);
      }
    }

    // Find nodes with no incoming edges
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    // Process nodes
    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }
}
