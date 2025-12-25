import { Signal } from '@angular/core';

import { ModuleStatus } from './module-status.enum';
import type { IExecutionContext } from '../context/execution-context.interface';

/**
 * Blueprint Module Interface
 *
 * All blueprint modules MUST implement this interface to ensure consistent
 * lifecycle management and integration with the blueprint container.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class TasksModule implements IBlueprintModule {
 *   readonly id = 'tasks';
 *   readonly name = '任務管理';
 *   readonly version = '1.0.0';
 *   readonly dependencies = ['context', 'logger'];
 *   readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);
 *
 *   async init(context: IExecutionContext): Promise<void> {
 *     this.status.set(ModuleStatus.INITIALIZING);
 *     // Initialize module...
 *     this.status.set(ModuleStatus.READY);
 *   }
 *
 *   // ... other lifecycle methods
 * }
 * ```
 */
export interface IBlueprintModule {
  /**
   * Unique identifier for this module
   * Must be globally unique across all modules in the system
   */
  readonly id: string;

  /**
   * Human-readable name of the module
   * Used for display in UI
   */
  readonly name: string;

  /**
   * Semantic version of the module (e.g., "1.0.0")
   * Used for version compatibility checks
   */
  readonly version: string;

  /**
   * Optional description of the module's purpose
   */
  readonly description?: string;

  /**
   * Array of module IDs that this module depends on
   * Dependencies must be loaded and initialized before this module
   */
  readonly dependencies: string[];

  /**
   * Current lifecycle status of the module
   * Uses Angular Signal for reactive state management
   */
  readonly status: Signal<ModuleStatus>;

  /**
   * Initialize the module
   *
   * Called once when the module is first loaded.
   * Use this to set up resources, subscribe to events, and prepare the module for use.
   *
   * @param context - Execution context providing access to shared resources
   * @throws Error if initialization fails
   */
  init(context: IExecutionContext): Promise<void>;

  /**
   * Start the module
   *
   * Called after init() to start the module's operations.
   * Module should begin performing its main functions.
   *
   * @throws Error if start fails
   */
  start(): Promise<void>;

  /**
   * Signal that module is ready
   *
   * Called after start() completes successfully.
   * Module should be fully operational at this point.
   */
  ready(): Promise<void>;

  /**
   * Stop the module
   *
   * Called when the module needs to stop operations gracefully.
   * Module should stop processing but retain state for potential restart.
   *
   * @throws Error if stop fails
   */
  stop(): Promise<void>;

  /**
   * Dispose of the module
   *
   * Called when the module is being unloaded.
   * Module should clean up all resources, unsubscribe from events, and release memory.
   */
  dispose(): Promise<void>;

  /**
   * Optional: Module exports
   *
   * Modules can export functions or data for other modules to consume.
   * Access via execution context: context.use('moduleName').exports
   */
  exports?: Record<string, any>;
}
