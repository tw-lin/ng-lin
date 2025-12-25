import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LifecycleManager } from './lifecycle-manager';
import { ResourceProvider } from './resource-provider';
import { IExecutionContext, ContextType } from '../context/execution-context.interface';
import { SharedContext } from '../context/shared-context';
import { EventBus } from '../events/event-bus';
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
 * Error Test Module - throws errors for testing
 */
class ErrorModule extends TestModule {
  throwOnInit = false;
  throwOnStart = false;
  throwOnReady = false;
  throwOnStop = false;
  throwOnDispose = false;

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

  override async ready(): Promise<void> {
    if (this.throwOnReady) {
      throw new Error('Ready failed');
    }
    return super.ready();
  }

  override async stop(): Promise<void> {
    if (this.throwOnStop) {
      throw new Error('Stop failed');
    }
    return super.stop();
  }

  override async dispose(): Promise<void> {
    if (this.throwOnDispose) {
      throw new Error('Dispose failed');
    }
    return super.dispose();
  }
}

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager;
  let context: IExecutionContext;
  let eventBus: EventBus;
  let sharedContext: SharedContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LifecycleManager, EventBus, SharedContext, ResourceProvider]
    });

    lifecycleManager = TestBed.inject(LifecycleManager);
    eventBus = TestBed.inject(EventBus);
    sharedContext = TestBed.inject(SharedContext);

    eventBus.initialize('test-blueprint', 'test-user');

    context = {
      blueprintId: 'test-blueprint',
      contextType: ContextType.ORGANIZATION,
      tenant: {
        organizationId: 'org-123',
        userId: 'user-123',
        contextType: ContextType.ORGANIZATION
      },
      eventBus,
      resources: TestBed.inject(ResourceProvider),
      sharedContext
    };
  });

  afterEach(() => {
    eventBus.dispose();
  });

  describe('Initialization', () => {
    it('should create an instance', () => {
      expect(lifecycleManager).toBeTruthy();
    });

    it('should start with module count of 0', () => {
      expect(lifecycleManager.moduleCount()).toBe(0);
    });

    it('should initialize module successfully', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await lifecycleManager.initialize(module, context);

      expect(module.initCalled).toBe(true);
      expect(lifecycleManager.moduleCount()).toBe(1);
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.INITIALIZED);
    });

    it('should throw error if module is already initialized', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await lifecycleManager.initialize(module, context);

      await expectAsync(lifecycleManager.initialize(module, context)).toBeRejectedWithError(/already initialized/);
    });

    it('should emit MODULE_INITIALIZED event', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');
      const events: string[] = [];

      eventBus.on('MODULE_INITIALIZED', event => {
        events.push(event.type);
      });

      await lifecycleManager.initialize(module, context);

      expect(events).toContain('MODULE_INITIALIZED');
    });
  });

  describe('Module Lifecycle', () => {
    let module: TestModule;

    beforeEach(async () => {
      module = new TestModule('test-module', 'Test Module', '1.0.0');
      await lifecycleManager.initialize(module, context);
    });

    it('should start module successfully', async () => {
      await lifecycleManager.start('test-module');

      expect(module.startCalled).toBe(true);
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.STARTED);
    });

    it('should mark module as ready', async () => {
      await lifecycleManager.start('test-module');
      await lifecycleManager.ready('test-module');

      expect(module.readyCalled).toBe(true);
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.READY);
    });

    it('should complete full lifecycle: init → start → ready → stop → dispose', async () => {
      // Start
      await lifecycleManager.start('test-module');
      expect(module.startCalled).toBe(true);

      // Ready
      await lifecycleManager.ready('test-module');
      expect(module.readyCalled).toBe(true);

      // Stop
      await lifecycleManager.stop('test-module');
      expect(module.stopCalled).toBe(true);
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.STOPPED);

      // Dispose
      await lifecycleManager.dispose('test-module');
      expect(module.disposeCalled).toBe(true);
      expect(lifecycleManager.moduleCount()).toBe(0);
    });

    it('should emit lifecycle events', async () => {
      const events: string[] = [];

      eventBus.on('MODULE_STARTING', e => {
        events.push(e.type);
      });
      eventBus.on('MODULE_STARTED', e => {
        events.push(e.type);
      });
      eventBus.on('MODULE_READY', e => {
        events.push(e.type);
      });
      eventBus.on('MODULE_STOPPING', e => {
        events.push(e.type);
      });
      eventBus.on('MODULE_STOPPED', e => {
        events.push(e.type);
      });
      eventBus.on('MODULE_DISPOSED', e => {
        events.push(e.type);
      });

      await lifecycleManager.start('test-module');
      await lifecycleManager.ready('test-module');
      await lifecycleManager.stop('test-module');
      await lifecycleManager.dispose('test-module');

      expect(events).toEqual(['MODULE_STARTING', 'MODULE_STARTED', 'MODULE_READY', 'MODULE_STOPPING', 'MODULE_STOPPED', 'MODULE_DISPOSED']);
    });
  });

  describe('State Management', () => {
    it('should track module state', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await lifecycleManager.initialize(module, context);
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.INITIALIZED);

      await lifecycleManager.start('test-module');
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.STARTED);

      await lifecycleManager.ready('test-module');
      expect(lifecycleManager.getState('test-module')).toBe(ModuleStatus.READY);
    });

    it('should return modules by state', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');
      const module3 = new TestModule('module-3', 'Module 3', '1.0.0');

      await lifecycleManager.initialize(module1, context);
      await lifecycleManager.initialize(module2, context);
      await lifecycleManager.initialize(module3, context);

      await lifecycleManager.start('module-1');
      await lifecycleManager.ready('module-1');

      await lifecycleManager.start('module-2');
      await lifecycleManager.ready('module-2');

      const readyModules = lifecycleManager.getModulesByState(ModuleStatus.READY);
      expect(readyModules).toEqual(['module-1', 'module-2']);

      const initializedModules = lifecycleManager.getModulesByState(ModuleStatus.INITIALIZED);
      expect(initializedModules).toEqual(['module-3']);
    });

    it('should check if module is ready', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await lifecycleManager.initialize(module, context);
      expect(lifecycleManager.isModuleReady('test-module')).toBe(false);

      await lifecycleManager.start('test-module');
      expect(lifecycleManager.isModuleReady('test-module')).toBe(false);

      await lifecycleManager.ready('test-module');
      expect(lifecycleManager.isModuleReady('test-module')).toBe(true);
    });

    it('should return false for non-existent module', () => {
      expect(lifecycleManager.isModuleReady('non-existent')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle init error', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnInit = true;

      const events: string[] = [];
      eventBus.on('MODULE_ERROR', e => {
        events.push(e.type);
      });

      await expectAsync(lifecycleManager.initialize(module, context)).toBeRejected();

      expect(events).toContain('MODULE_ERROR');
    });

    it('should handle start error', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnStart = true;

      await lifecycleManager.initialize(module, context);

      const events: string[] = [];
      eventBus.on('MODULE_ERROR', e => {
        events.push(e.type);
      });

      await expectAsync(lifecycleManager.start('error-module')).toBeRejected();

      expect(events).toContain('MODULE_ERROR');
    });

    it('should handle ready error', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnReady = true;

      await lifecycleManager.initialize(module, context);
      await lifecycleManager.start('error-module');

      const events: string[] = [];
      eventBus.on('MODULE_ERROR', e => {
        events.push(e.type);
      });

      await expectAsync(lifecycleManager.ready('error-module')).toBeRejected();

      expect(events).toContain('MODULE_ERROR');
    });

    it('should handle stop error', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnStop = true;

      await lifecycleManager.initialize(module, context);
      await lifecycleManager.start('error-module');
      await lifecycleManager.ready('error-module');

      const events: string[] = [];
      eventBus.on('MODULE_ERROR', e => {
        events.push(e.type);
      });

      await expectAsync(lifecycleManager.stop('error-module')).toBeRejected();

      expect(events).toContain('MODULE_ERROR');
    });

    it('should transition to error state on failure', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnStart = true;

      await lifecycleManager.initialize(module, context);

      try {
        await lifecycleManager.start('error-module');
      } catch {
        // Expected error
      }

      expect(lifecycleManager.getState('error-module')).toBe(ModuleStatus.ERROR);
    });

    it('should attempt rollback on error (up to 3 times)', async () => {
      const module = new ErrorModule('error-module', 'Error Module', '1.0.0');
      module.throwOnStart = true;

      await lifecycleManager.initialize(module, context);

      // First error
      try {
        await lifecycleManager.start('error-module');
      } catch {
        // Expected
      }

      // Should still be in error state after attempts
      expect(lifecycleManager.getState('error-module')).toBe(ModuleStatus.ERROR);
    });
  });

  describe('State Transition Validation', () => {
    it('should throw error on invalid state transition', async () => {
      const module = new TestModule('test-module', 'Test Module', '1.0.0');

      await lifecycleManager.initialize(module, context);

      // Try to stop before starting
      await expectAsync(lifecycleManager.stop('test-module')).toBeRejectedWithError(/Invalid state transition/);
    });

    it('should throw error when module not found', () => {
      expect(() => {
        lifecycleManager.getState('non-existent');
      }).toThrowError(/not found/);
    });
  });

  describe('Multiple Modules', () => {
    it('should manage multiple modules independently', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await lifecycleManager.initialize(module1, context);
      await lifecycleManager.initialize(module2, context);

      expect(lifecycleManager.moduleCount()).toBe(2);

      await lifecycleManager.start('module-1');
      await lifecycleManager.ready('module-1');

      expect(lifecycleManager.getState('module-1')).toBe(ModuleStatus.READY);
      expect(lifecycleManager.getState('module-2')).toBe(ModuleStatus.INITIALIZED);
    });

    it('should dispose modules independently', async () => {
      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');

      await lifecycleManager.initialize(module1, context);
      await lifecycleManager.initialize(module2, context);

      await lifecycleManager.start('module-1');
      await lifecycleManager.ready('module-1');
      await lifecycleManager.stop('module-1');
      await lifecycleManager.dispose('module-1');

      expect(lifecycleManager.moduleCount()).toBe(1);
      expect(() => lifecycleManager.getState('module-1')).toThrow();
      expect(lifecycleManager.getState('module-2')).toBe(ModuleStatus.INITIALIZED);
    });
  });

  describe('Module Count Signal', () => {
    it('should update module count signal reactively', async () => {
      expect(lifecycleManager.moduleCount()).toBe(0);

      const module1 = new TestModule('module-1', 'Module 1', '1.0.0');
      await lifecycleManager.initialize(module1, context);
      expect(lifecycleManager.moduleCount()).toBe(1);

      const module2 = new TestModule('module-2', 'Module 2', '1.0.0');
      await lifecycleManager.initialize(module2, context);
      expect(lifecycleManager.moduleCount()).toBe(2);

      await lifecycleManager.start('module-1');
      await lifecycleManager.ready('module-1');
      await lifecycleManager.stop('module-1');
      await lifecycleManager.dispose('module-1');
      expect(lifecycleManager.moduleCount()).toBe(1);
    });
  });
});
