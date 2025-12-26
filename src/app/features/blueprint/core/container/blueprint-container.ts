/**
 * @module BlueprintContainer
 * @description Blueprint Container - Core Composition Root (藍圖容器)
 * 
 * **Purpose**: Main container class that integrates all core Blueprint subsystems into a cohesive runtime.
 * Acts as the composition root and lifecycle coordinator for Blueprint modules.
 * 
 * **Key Features**:
 * - **Module Management**: Centralized module registration and lifecycle
 * - **Event Coordination**: Integrated event bus for module communication
 * - **Resource Provisioning**: Shared resource provider for modules
 * - **Context Management**: Unified execution context and tenant info
 * - **Lifecycle Control**: Initialize, start, stop, dispose operations
 * - **Reactive State**: Signal-based status and module count
 * 
 * **Architecture Patterns**:
 * - **Composition Root**: Composes ModuleRegistry, LifecycleManager, EventBus, ResourceProvider
 * - **Facade Pattern**: Provides unified interface to complex subsystems
 * - **Dependency Injection**: Passes container dependencies to modules
 * - **State Machine**: Tracks container lifecycle states
 * - **Signal-Based State**: Reactive state management with Angular Signals
 * 
 * **Container Lifecycle States**:
 * - `uninitialized`: Container created but not initialized
 * - `initializing`: Core components being set up
 * - `ready`: Initialized and ready to load modules
 * - `running`: Modules loaded and active
 * - `stopping`: Graceful shutdown in progress
 * - `stopped`: All modules stopped, container idle
 * - `error`: Fatal error occurred during lifecycle
 * 
 * **Core Components**:
 * - **ModuleRegistry**: Manages module registration and lookup
 * - **LifecycleManager**: Coordinates module initialization/startup/shutdown
 * - **EventBus**: Pub/sub system for module communication
 * - **ResourceProvider**: Shared resource access for modules
 * - **SharedContext**: Global state shared across modules
 * 
 * **Module Integration**:
 * - Modules receive container reference on registration
 * - Modules access EventBus, ResourceProvider, SharedContext via container
 * - Module lifecycle (initialize → start → stop → dispose) managed by container
 * - Module dependencies resolved before initialization
 * 
 * **Execution Context**:
 * - `blueprintId`: Unique identifier for this blueprint instance
 * - `contextType`: User, Organization, Team, Partner, or Bot
 * - `contextId`: Entity ID for the context (user.uid, org.id, etc.)
 * - `tenantId`: Tenant isolation ID for multi-tenancy
 * - `timestamp`: Container creation time
 * 
 * **Tenant Info**:
 * - `tenantId`: Primary tenant identifier
 * - `tenantType`: Type of tenant (user, organization, team, partner)
 * - `tenantName`: Display name for tenant
 * - `metadata`: Additional tenant-specific data
 * 
 * **Multi-Tenancy Context**:
 * - Each container instance is tenant-scoped
 * - Modules inherit tenant context from container
 * - Events include tenant context automatically
 * - Resources filtered by tenant ID
 * 
 * **Event Integration**:
 * - Container publishes lifecycle events (initialized, started, stopped)
 * - Modules can subscribe to container events
 * - Event bus shared across all modules in container
 * - Event types: BlueprintEventType (MODULE_REGISTERED, LIFECYCLE_CHANGED, etc.)
 * 
 * **Performance**:
 * - Lazy module initialization (only when needed)
 * - Parallel module initialization where possible
 * - Efficient event routing via EventBus
 * - Minimal overhead for resource access
 * 
 * @see docs/⭐️/整體架構設計.md (Blueprint architecture)
 * @see .github/instructions/ng-gighub-architecture.instructions.md
 * 
 * @remarks
 * **Design**: Based on Dependency Injection Container and Composition Root patterns
 * **Testing**: Container facilitates testing by allowing module mocking
 * **Extensibility**: New subsystems can be added without modifying existing modules
 * 
 * @example
 * ```typescript
 * // Create container with config
 * const config: IBlueprintConfig = {
 *   blueprintId: 'construction-site-1',
 *   name: 'Construction Site Blueprint',
 *   version: '1.0.0',
 *   modules: [],
 *   featureFlags: {},
 *   theme: {},
 *   permissions: {}
 * };
 * 
 * const container = new BlueprintContainer(config);
 * 
 * // Initialize container
 * await container.initialize();
 * 
 * // Load modules
 * await container.loadModule(new TasksModule());
 * await container.loadModule(new LogsModule());
 * 
 * // Start container (starts all modules)
 * await container.start();
 * 
 * // Access components
 * const eventBus = container.getEventBus();
 * eventBus.publish({ type: 'task.created', data: {...} });
 * 
 * // Stop container (graceful shutdown)
 * await container.stop();
 * ```
 * 
 * @packageDocumentation
 * @module BlueprintCore
 */

import { signal } from '@angular/core';

import { IBlueprintContainer } from './blueprint-container.interface';
import { LifecycleManager } from './lifecycle-manager';
import { ILifecycleManager } from './lifecycle-manager.interface';
import { ModuleRegistry } from './module-registry';
import { IModuleRegistry } from './module-registry.interface';
import { ResourceProvider } from './resource-provider';
import { IResourceProvider } from './resource-provider.interface';
import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { IExecutionContext, ContextType } from '../context/execution-context.interface';
import { SharedContext } from '../context/shared-context';
import { TenantInfo } from '../context/tenant-info.interface';
import { EventBus } from '../events/event-bus';
import { IEventBus } from '../events/event-bus.interface';
import { BlueprintEventType } from '../events/event-types';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * 藍圖容器
 *
 * 整合模組註冊、生命週期管理、事件總線、資源提供者和共享上下文。
 *
 * @example
 * ```typescript
 * const config: IBlueprintConfig = {
 *   blueprintId: 'my-blueprint',
 *   name: 'My Blueprint',
 *   version: '1.0.0',
 *   modules: [],
 *   featureFlags: {},
 *   theme: {},
 *   permissions: {}
 * };
 *
 * const container = new BlueprintContainer(config);
 * await container.initialize();
 * await container.loadModule(tasksModule);
 * await container.start();
 * ```
 */
export class BlueprintContainer implements IBlueprintContainer {
  readonly id: string;
  readonly config: IBlueprintConfig;

  // Reactive state
  readonly status = signal<'uninitialized' | 'initializing' | 'ready' | 'running' | 'stopping' | 'stopped' | 'error'>('uninitialized');
  readonly moduleCount = signal(0);

  // Core components
  private moduleRegistry!: IModuleRegistry;
  private lifecycleManager!: ILifecycleManager;
  private eventBus!: IEventBus;
  private resourceProvider!: IResourceProvider;
  private sharedContext!: SharedContext;

  // Execution context
  private executionContext!: IExecutionContext;

  // Tenant info
  private tenantInfo?: TenantInfo;

  constructor(config: IBlueprintConfig) {
    this.id = config.blueprintId;
    this.config = config;
  }

  /**
   * 初始化容器
   */
  async initialize(): Promise<void> {
    if (this.status() !== 'uninitialized') {
      throw new Error(`Container is already initialized (status: ${this.status()})`);
    }

    try {
      this.status.set('initializing');

      // Initialize core components
      this.moduleRegistry = new ModuleRegistry();
      this.lifecycleManager = new LifecycleManager();
      this.eventBus = new EventBus();
      this.resourceProvider = new ResourceProvider();
      this.sharedContext = new SharedContext();

      // Setup execution context
      this.executionContext = {
        blueprintId: this.id,
        contextType: ContextType.ORGANIZATION,
        tenant: this.tenantInfo,
        eventBus: this.eventBus,
        resources: this.resourceProvider,
        sharedContext: this.sharedContext
      };

      // Initialize shared context with tenant
      if (this.tenantInfo) {
        this.sharedContext.initialize(this.tenantInfo);
      }

      // Emit container initialized event
      this.eventBus.emit(
        BlueprintEventType.CONTAINER_INITIALIZED,
        {
          containerId: this.id,
          config: this.config
        },
        'container'
      );

      this.status.set('ready');
    } catch (error) {
      this.status.set('error');
      this.eventBus?.emit(
        BlueprintEventType.CONTAINER_ERROR,
        {
          containerId: this.id,
          error: error instanceof Error ? error.message : String(error)
        },
        'container'
      );
      throw error;
    }
  }

  /**
   * 啟動容器
   */
  async start(): Promise<void> {
    if (this.status() !== 'ready') {
      throw new Error(`Container must be ready to start (current status: ${this.status()})`);
    }

    try {
      this.status.set('running');

      this.eventBus.emit(
        BlueprintEventType.CONTAINER_STARTING,
        {
          containerId: this.id
        },
        'container'
      );

      // Get all registered modules
      const modules = this.moduleRegistry.list();

      // Resolve dependencies and get load order
      const moduleIds = modules.map(m => m.id);
      const resolution = this.moduleRegistry.resolveDependencies(moduleIds);

      if (resolution.hasCircularDependency) {
        throw new Error(`Circular dependencies detected: ${JSON.stringify(resolution.circularPaths)}`);
      }

      // Start modules in dependency order
      for (const moduleId of resolution.loadOrder) {
        const module = this.moduleRegistry.get(moduleId);
        if (module) {
          await this.lifecycleManager.start(moduleId);
          await this.lifecycleManager.ready(moduleId);
        }
      }

      this.eventBus.emit(
        BlueprintEventType.CONTAINER_STARTED,
        {
          containerId: this.id,
          modulesStarted: resolution.loadOrder.length
        },
        'container'
      );
    } catch (error) {
      this.status.set('error');
      this.eventBus.emit(
        BlueprintEventType.CONTAINER_ERROR,
        {
          containerId: this.id,
          error: error instanceof Error ? error.message : String(error)
        },
        'container'
      );
      throw error;
    }
  }

  /**
   * 停止容器
   */
  async stop(): Promise<void> {
    if (this.status() !== 'running') {
      throw new Error(`Container is not running (current status: ${this.status()})`);
    }

    try {
      this.status.set('stopping');

      this.eventBus.emit(
        BlueprintEventType.CONTAINER_STOPPING,
        {
          containerId: this.id
        },
        'container'
      );

      // Get all running modules (in reverse order)
      const readyModules = this.lifecycleManager.getModulesByState(ModuleStatus.READY);

      // Stop modules in reverse order
      for (const moduleId of readyModules.reverse()) {
        await this.lifecycleManager.stop(moduleId);
      }

      this.status.set('stopped');

      this.eventBus.emit(
        BlueprintEventType.CONTAINER_STOPPED,
        {
          containerId: this.id,
          modulesStopped: readyModules.length
        },
        'container'
      );
    } catch (error) {
      this.status.set('error');
      this.eventBus.emit(
        BlueprintEventType.CONTAINER_ERROR,
        {
          containerId: this.id,
          error: error instanceof Error ? error.message : String(error)
        },
        'container'
      );
      throw error;
    }
  }

  /**
   * 銷毀容器
   */
  async dispose(): Promise<void> {
    try {
      // Stop if running
      if (this.status() === 'running') {
        await this.stop();
      }

      // Dispose all modules
      const modules = this.moduleRegistry.list();
      for (const module of modules) {
        await this.unloadModule(module.id);
      }

      // Clear shared context
      this.sharedContext?.clearAll();

      // Dispose event bus
      this.eventBus?.dispose();

      this.status.set('uninitialized');
      this.moduleCount.set(0);
    } catch (error) {
      this.status.set('error');
      throw error;
    }
  }

  /**
   * 載入模組
   */
  async loadModule(module: IBlueprintModule): Promise<void> {
    if (this.status() === 'uninitialized') {
      throw new Error('Container must be initialized before loading modules');
    }

    try {
      // Check if module is already loaded
      if (this.moduleRegistry.has(module.id)) {
        throw new Error(`Module '${module.id}' is already loaded`);
      }

      // Check dependencies
      const missing = this.moduleRegistry.checkMissingDependencies([module]);
      if (missing.length > 0) {
        throw new Error(`Missing dependencies for module '${module.id}': ${missing.join(', ')}`);
      }

      // Register module
      this.moduleRegistry.register(module);

      // Initialize module
      await this.lifecycleManager.initialize(module, this.executionContext);

      // Update count
      this.moduleCount.set(this.moduleRegistry.list().length);

      // Emit event
      this.eventBus.emit(
        BlueprintEventType.MODULE_LOADED,
        {
          moduleId: module.id,
          moduleName: module.name,
          version: module.version
        },
        module.id
      );

      // Auto-start if container is running
      if (this.status() === 'running') {
        await this.lifecycleManager.start(module.id);
        await this.lifecycleManager.ready(module.id);
      }
    } catch (error) {
      this.eventBus.emit(
        BlueprintEventType.MODULE_ERROR,
        {
          moduleId: module.id,
          moduleName: module.name,
          error: error instanceof Error ? error.message : String(error)
        },
        module.id
      );
      throw error;
    }
  }

  /**
   * 卸載模組
   */
  async unloadModule(moduleId: string): Promise<void> {
    try {
      const module = this.moduleRegistry.get(moduleId);
      if (!module) {
        throw new Error(`Module '${moduleId}' not found`);
      }

      // Check for dependents
      const dependents = this.moduleRegistry.getDependents(moduleId);
      if (dependents.length > 0) {
        throw new Error(`Cannot unload module '${moduleId}' - it has dependents: ${dependents.join(', ')}`);
      }

      // Stop if running
      const status = this.lifecycleManager.getState(moduleId);
      if (status === ModuleStatus.READY) {
        await this.lifecycleManager.stop(moduleId);
      }

      // Dispose
      await this.lifecycleManager.dispose(moduleId);

      // Unregister
      this.moduleRegistry.unregister(moduleId);

      // Update count
      this.moduleCount.set(this.moduleRegistry.list().length);

      // Emit event
      this.eventBus.emit(
        BlueprintEventType.MODULE_UNLOADED,
        {
          moduleId,
          moduleName: module.name
        },
        moduleId
      );
    } catch (error) {
      this.eventBus.emit(
        BlueprintEventType.MODULE_ERROR,
        {
          moduleId,
          error: error instanceof Error ? error.message : String(error)
        },
        moduleId
      );
      throw error;
    }
  }

  /**
   * 重新載入模組（熱重載）
   */
  async reloadModule(moduleId: string): Promise<void> {
    const module = this.moduleRegistry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    // Unload and reload
    await this.unloadModule(moduleId);
    await this.loadModule(module);
  }

  /**
   * 獲取模組
   */
  getModule(moduleId: string): IBlueprintModule | undefined {
    return this.moduleRegistry.get(moduleId);
  }

  /**
   * 獲取所有模組
   */
  getAllModules(): IBlueprintModule[] {
    return Array.from(this.moduleRegistry.list());
  }

  /**
   * 獲取指定狀態的模組
   */
  getModulesByStatus(status: ModuleStatus): IBlueprintModule[] {
    const moduleIds = this.lifecycleManager.getModulesByState(status);
    return moduleIds.map(id => this.moduleRegistry.get(id)).filter((m): m is IBlueprintModule => m !== undefined);
  }

  /**
   * 檢查模組是否已載入
   */
  hasModule(moduleId: string): boolean {
    return this.moduleRegistry.has(moduleId);
  }

  /**
   * 檢查容器是否運行中
   */
  isRunning(): boolean {
    return this.status() === 'running';
  }

  /**
   * 設定租戶資訊
   *
   * @param tenantInfo - 租戶資訊
   */
  setTenantInfo(tenantInfo: TenantInfo): void {
    this.tenantInfo = tenantInfo;
    if (this.sharedContext) {
      this.sharedContext.initialize(tenantInfo);
    }
  }

  /**
   * 獲取執行上下文
   *
   * @returns 執行上下文
   */
  getExecutionContext(): IExecutionContext {
    return this.executionContext;
  }
}
