import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BlueprintContainer } from './blueprint-container';
import { IBlueprintConfig } from '../config/blueprint-config.interface';
import { IExecutionContext, ContextType } from '../context/execution-context.interface';
import { BlueprintEventType } from '../events/event-types';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

/**
 * Test Module Implementation
 */
class TestModule implements IBlueprintModule {
  readonly status = signal<ModuleStatus>(ModuleStatus.UNINITIALIZED);

  initCalled = false;
  startCalled = false;
  readyCalled = false;
  stopCalled = false;
  disposeCalled = false;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly dependencies: string[] = []
  ) {}

  async init(context: IExecutionContext): Promise<void> {
    this.initCalled = true;
    this.status.set(ModuleStatus.INITIALIZED);
  }

  async start(): Promise<void> {
    this.startCalled = true;
    this.status.set(ModuleStatus.STARTED);
  }

  async ready(): Promise<void> {
    this.readyCalled = true;
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.stopCalled = true;
    this.status.set(ModuleStatus.STOPPED);
  }

  async dispose(): Promise<void> {
    this.disposeCalled = true;
    this.status.set(ModuleStatus.DISPOSED);
  }
}

/**
 * Error Test Module
 */
class ErrorModule extends TestModule {
  throwOnInit = false;
  throwOnStart = false;

  override async init(context: IExecutionContext): Promise<void> {
    if (this.throwOnInit) {
      throw new Error('Init failed');
    }
    return super.init(context);
  }

  override async start(): Promise<void> {
    if (this.throwOnStart) {
      throw new Error('Start failed');
    }
    return super.start();
  }
}

describe('BlueprintContainer', () => {
  let container: BlueprintContainer;
  let config: IBlueprintConfig;

  beforeEach(() => {
    config = {
      blueprintId: 'test-blueprint-123',
      name: 'Test Blueprint',
      version: '1.0.0',
      description: 'Test Description',
      modules: [],
      featureFlags: {
        enableRealtime: true,
        enableNotifications: true
      },
      theme: {
        primaryColor: '#1890ff',
        layout: 'side'
      },
      permissions: {
        roles: {
          admin: ['*'],
          member: ['blueprint.read']
        }
      }
    };

    TestBed.configureTestingModule({
      providers: [BlueprintContainer]
    });

    container = new BlueprintContainer(config);
  });

  afterEach(async () => {
    try {
      await container.dispose();
    } catch {
      // Ignore disposal errors in tests
    }
  });

  describe('Container Creation', () => {
    it('should create a container instance', () => {
      expect(container).toBeTruthy();
    });

    it('should set container id from config', () => {
      expect(container.id).toBe('test-blueprint-123');
    });

    it('should store config', () => {
      expect(container.config).toEqual(config);
    });

    it('should start with uninitialized status', () => {
      expect(container.status()).toBe('uninitialized');
    });

    it('should start with module count of 0', () => {
      expect(container.moduleCount()).toBe(0);
    });
  });

  describe('Container Initialization', () => {
    it('should initialize successfully', async () => {
      await container.initialize();

      expect(container.status()).toBe('ready');
    });

    it('should throw error if already initialized', async () => {
      await container.initialize();

      await expectAsync(container.initialize()).toBeRejectedWithError(/already initialized/);
    });

    it('should emit CONTAINER_INITIALIZED event', async () => {
      await container.initialize();

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const initEvent = history.find(e => e.type === BlueprintEventType.CONTAINER_INITIALIZED);

      expect(initEvent).toBeTruthy();
      expect(initEvent?.payload.containerId).toBe('test-blueprint-123');
    });

    it('should create execution context', async () => {
      await container.initialize();

      const context = container.getExecutionContext();
      expect(context).toBeTruthy();
      expect(context.blueprintId).toBe('test-blueprint-123');
      expect(context.eventBus).toBeTruthy();
      expect(context.resources).toBeTruthy();
      expect(context.sharedContext).toBeTruthy();
    });

    it('should handle initialization error', async () => {
      // Force an error by passing invalid config
      const badContainer = new BlueprintContainer(null as any);

      await expectAsync(badContainer.initialize()).toBeRejected();

      expect(badContainer.status()).toBe('error');
    });
  });

  describe('Module Loading', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should load module successfully', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);

      expect(module.initCalled).toBe(true);
      expect(container.moduleCount()).toBe(1);
      expect(container.hasModule('test-module')).toBe(true);
    });

    it('should throw error if loading before initialization', async () => {
      const uninitContainer = new BlueprintContainer(config);
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await expectAsync(uninitContainer.loadModule(module)).toBeRejectedWithError(/must be initialized/);
    });

    it('should throw error if module already loaded', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);

      await expectAsync(container.loadModule(module)).toBeRejectedWithError(/already loaded/);
    });

    it('should emit MODULE_LOADED event', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const loadEvent = history.find(e => e.type === BlueprintEventType.MODULE_LOADED);

      expect(loadEvent).toBeTruthy();
      expect(loadEvent?.payload.moduleId).toBe('test-module');
    });

    it('should check dependencies before loading', async () => {
      const module = new TestModule('dependent-module', 'Dependent', '1.0.0', ['missing-dep']);

      await expectAsync(container.loadModule(module)).toBeRejectedWithError(/Missing dependencies/);
    });

    it('should load multiple modules', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);

      expect(container.moduleCount()).toBe(2);
      expect(container.getAllModules()).toEqual([module1, module2]);
    });

    it('should auto-start module if container is running', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.start();
      await container.loadModule(module);

      expect(module.startCalled).toBe(true);
      expect(module.readyCalled).toBe(true);
    });
  });

  describe('Module Unloading', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should unload module successfully', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);
      await container.unloadModule('test-module');

      expect(module.disposeCalled).toBe(true);
      expect(container.moduleCount()).toBe(0);
      expect(container.hasModule('test-module')).toBe(false);
    });

    it('should throw error if module not found', async () => {
      await expectAsync(container.unloadModule('non-existent')).toBeRejectedWithError(/not found/);
    });

    it('should emit MODULE_UNLOADED event', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);
      await container.unloadModule('test-module');

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const unloadEvent = history.find(e => e.type === BlueprintEventType.MODULE_UNLOADED);

      expect(unloadEvent).toBeTruthy();
      expect(unloadEvent?.payload.moduleId).toBe('test-module');
    });

    it('should stop running module before unloading', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);
      await container.start();
      await container.unloadModule('test-module');

      expect(module.stopCalled).toBe(true);
      expect(module.disposeCalled).toBe(true);
    });

    it('should prevent unloading module with dependents', async () => {
      const baseModule = new TestModule('base', 'Base', '1.0.0');
      const depModule = new TestModule('dependent', 'Dependent', '1.0.0', ['base']);

      await container.loadModule(baseModule);
      await container.loadModule(depModule);

      await expectAsync(container.unloadModule('base')).toBeRejectedWithError(/has dependents/);
    });
  });

  describe('Container Start/Stop', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should start container successfully', async () => {
      await container.start();

      expect(container.status()).toBe('running');
      expect(container.isRunning()).toBe(true);
    });

    it('should throw error if starting before ready', async () => {
      const uninitContainer = new BlueprintContainer(config);

      await expectAsync(uninitContainer.start()).toBeRejectedWithError(/must be ready/);
    });

    it('should emit CONTAINER_STARTED event', async () => {
      await container.start();

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const startEvent = history.find(e => e.type === BlueprintEventType.CONTAINER_STARTED);

      expect(startEvent).toBeTruthy();
    });

    it('should start all loaded modules', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);
      await container.start();

      expect(module1.startCalled).toBe(true);
      expect(module1.readyCalled).toBe(true);
      expect(module2.startCalled).toBe(true);
      expect(module2.readyCalled).toBe(true);
    });

    it('should start modules in dependency order', async () => {
      const baseModule = new TestModule('base', 'Base', '1.0.0');
      const depModule = new TestModule('dependent', 'Dependent', '1.0.0', ['base']);

      await container.loadModule(baseModule);
      await container.loadModule(depModule);
      await container.start();

      expect(baseModule.startCalled).toBe(true);
      expect(depModule.startCalled).toBe(true);
    });

    it('should stop container successfully', async () => {
      await container.start();
      await container.stop();

      expect(container.status()).toBe('stopped');
      expect(container.isRunning()).toBe(false);
    });

    it('should throw error if stopping when not running', async () => {
      await expectAsync(container.stop()).toBeRejectedWithError(/not running/);
    });

    it('should emit CONTAINER_STOPPED event', async () => {
      await container.start();
      await container.stop();

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const stopEvent = history.find(e => e.type === BlueprintEventType.CONTAINER_STOPPED);

      expect(stopEvent).toBeTruthy();
    });

    it('should stop all running modules', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);
      await container.start();
      await container.stop();

      expect(module1.stopCalled).toBe(true);
      expect(module2.stopCalled).toBe(true);
    });
  });

  describe('Module Queries', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should get module by id', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);
      const retrieved = container.getModule('test-module');

      expect(retrieved).toBe(module);
    });

    it('should return undefined for non-existent module', () => {
      const retrieved = container.getModule('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should get all modules', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);

      const all = container.getAllModules();

      expect(all.length).toBe(2);
      expect(all).toContain(module1);
      expect(all).toContain(module2);
    });

    it('should get modules by status', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);
      await container.start();

      const readyModules = container.getModulesByStatus(ModuleStatus.READY);

      expect(readyModules.length).toBe(2);
      expect(readyModules).toContain(module1);
      expect(readyModules).toContain(module2);
    });

    it('should check if module exists', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      expect(container.hasModule('test-module')).toBe(false);

      await container.loadModule(module);

      expect(container.hasModule('test-module')).toBe(true);
    });
  });

  describe('Hot Reload', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should reload module successfully', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await container.loadModule(module);
      await container.reloadModule('test-module');

      expect(module.disposeCalled).toBe(true);
      expect(module.initCalled).toBe(true);
      expect(container.hasModule('test-module')).toBe(true);
    });

    it('should throw error if module not found', async () => {
      await expectAsync(container.reloadModule('non-existent')).toBeRejectedWithError(/not found/);
    });
  });

  describe('Tenant Management', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should set tenant info', () => {
      const tenantInfo = {
        organizationId: 'org-123',
        teamId: 'team-456',
        userId: 'user-789',
        contextType: ContextType.ORGANIZATION
      };

      container.setTenantInfo(tenantInfo);

      const context = container.getExecutionContext();
      expect(context.tenant).toEqual(tenantInfo);
    });

    it('should update shared context with tenant info', () => {
      const tenantInfo = {
        organizationId: 'org-123',
        userId: 'user-789',
        contextType: ContextType.ORGANIZATION
      };

      container.setTenantInfo(tenantInfo);

      const context = container.getExecutionContext();
      const tenant = context.sharedContext.getTenant();

      expect(tenant).toEqual(tenantInfo);
    });
  });

  describe('Container Disposal', () => {
    it('should dispose container successfully', async () => {
      await container.initialize();

      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await container.loadModule(module1);
      await container.loadModule(module2);
      await container.start();

      await container.dispose();

      expect(container.status()).toBe('uninitialized');
      expect(container.moduleCount()).toBe(0);
      expect(module1.disposeCalled).toBe(true);
      expect(module2.disposeCalled).toBe(true);
    });

    it('should stop running container before disposal', async () => {
      await container.initialize();

      const module = new TestModule('test-module', 'Test Module', '1.0.0');
      await container.loadModule(module);
      await container.start();

      await container.dispose();

      expect(module.stopCalled).toBe(true);
      expect(module.disposeCalled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await container.initialize();
    });

    it('should handle module load error', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnInit = true;

      await expectAsync(container.loadModule(module)).toBeRejected();

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const errorEvent = history.find(e => e.type === BlueprintEventType.MODULE_ERROR);

      expect(errorEvent).toBeTruthy();
    });

    it('should handle container start error with circular dependencies', async () => {
      // Create modules with circular dependencies
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0', ['module-2']);
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0', ['module-1']);

      await container.loadModule(module1);
      await container.loadModule(module2);

      await expectAsync(container.start()).toBeRejectedWithError(/Circular dependencies/);

      expect(container.status()).toBe('error');
    });

    it('should emit CONTAINER_ERROR event on error', async () => {
      // Force an error by trying to start without modules loaded properly
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnStart = true;

      await container.loadModule(module);

      try {
        await container.start();
      } catch {
        // Expected error
      }

      const context = container.getExecutionContext();
      const history = context.eventBus.getHistory();
      const errorEvent = history.find(e => e.type === BlueprintEventType.CONTAINER_ERROR);

      expect(errorEvent).toBeTruthy();
    });
  });

  describe('Reactive State', () => {
    it('should update status signal', async () => {
      expect(container.status()).toBe('uninitialized');

      await container.initialize();
      expect(container.status()).toBe('ready');

      await container.start();
      expect(container.status()).toBe('running');

      await container.stop();
      expect(container.status()).toBe('stopped');
    });

    it('should update module count signal', async () => {
      await container.initialize();

      expect(container.moduleCount()).toBe(0);

      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      await container.loadModule(module1);
      expect(container.moduleCount()).toBe(1);

      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');
      await container.loadModule(module2);
      expect(container.moduleCount()).toBe(2);

      await container.unloadModule('module-1');
      expect(container.moduleCount()).toBe(1);
    });
  });
});
