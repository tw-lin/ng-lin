/**
 * Module Registry Unit Tests
 *
 * Comprehensive test suite for the Module Registry service.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ModuleRegistry } from './module-registry';
import { IExecutionContext } from '../context/execution-context.interface';
import { ModuleStatus } from '../modules/module-status.enum';
import { IBlueprintModule } from '../modules/module.interface';

// Mock module implementation
class MockModule implements IBlueprintModule {
  readonly status = signal(ModuleStatus.UNINITIALIZED);
  readonly exports = {};

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string,
    public readonly dependencies: string[] = []
  ) {}

  async init(context: IExecutionContext): Promise<void> {
    this.status.set(ModuleStatus.INITIALIZING);
  }

  async start(): Promise<void> {
    this.status.set(ModuleStatus.STARTING);
  }

  async ready(): Promise<void> {
    this.status.set(ModuleStatus.READY);
  }

  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPING);
  }

  async dispose(): Promise<void> {
    this.status.set(ModuleStatus.DISPOSED);
  }
}

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModuleRegistry]
    });
    registry = TestBed.inject(ModuleRegistry);
  });

  afterEach(() => {
    registry.clear();
  });

  describe('Initialization', () => {
    it('should create instance', () => {
      expect(registry).toBeTruthy();
    });

    it('should start with zero modules', () => {
      expect(registry.size).toBe(0);
      expect(registry.moduleCount()).toBe(0);
    });

    it('should have empty module list initially', () => {
      expect(registry.getAllModuleIds()).toEqual([]);
      expect(registry.getAllModules()).toEqual([]);
      expect(registry.getAllMetadata()).toEqual([]);
    });
  });

  describe('Module Registration', () => {
    it('should register a module successfully', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');

      registry.register(module);

      expect(registry.size).toBe(1);
      expect(registry.moduleCount()).toBe(1);
      expect(registry.has('test-module')).toBe(true);
    });

    it('should throw error when registering duplicate module ID', () => {
      const module1 = new MockModule('test-module', 'Test Module 1', '1.0.0');
      const module2 = new MockModule('test-module', 'Test Module 2', '2.0.0');

      registry.register(module1);

      expect(() => registry.register(module2)).toThrow('Module with ID "test-module" is already registered');
    });

    it('should register multiple modules', () => {
      const module1 = new MockModule('module-1', 'Module 1', '1.0.0');
      const module2 = new MockModule('module-2', 'Module 2', '1.0.0');
      const module3 = new MockModule('module-3', 'Module 3', '1.0.0');

      registry.register(module1);
      registry.register(module2);
      registry.register(module3);

      expect(registry.size).toBe(3);
      expect(registry.moduleCount()).toBe(3);
    });

    it('should store module metadata correctly', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0', ['dep-1']);
      const beforeRegister = Date.now();

      registry.register(module);

      const metadata = registry.getMetadata('test-module')!;
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('test-module');
      expect(metadata.name).toBe('Test Module');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.instance).toBe(module);
      expect(metadata.dependencies).toEqual(['dep-1']);
      expect(metadata.registeredAt.getTime()).toBeGreaterThanOrEqual(beforeRegister);
    });

    it('should update module count signal reactively', () => {
      const module1 = new MockModule('module-1', 'Module 1', '1.0.0');
      const module2 = new MockModule('module-2', 'Module 2', '1.0.0');

      expect(registry.moduleCount()).toBe(0);

      registry.register(module1);
      expect(registry.moduleCount()).toBe(1);

      registry.register(module2);
      expect(registry.moduleCount()).toBe(2);
    });
  });

  describe('Module Unregistration', () => {
    it('should unregister a module successfully', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');
      registry.register(module);

      const result = registry.unregister('test-module');

      expect(result).toBe(true);
      expect(registry.size).toBe(0);
      expect(registry.has('test-module')).toBe(false);
    });

    it('should return false when unregistering non-existent module', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should update module count signal on unregister', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');
      registry.register(module);
      expect(registry.moduleCount()).toBe(1);

      registry.unregister('test-module');
      expect(registry.moduleCount()).toBe(0);
    });
  });

  describe('Module Retrieval', () => {
    it('should get module by ID', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');
      registry.register(module);

      const retrieved = registry.get('test-module');
      expect(retrieved).toBe(module);
    });

    it('should return undefined for non-existent module', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should check module existence', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');
      registry.register(module);

      expect(registry.has('test-module')).toBe(true);
      expect(registry.has('non-existent')).toBe(false);
    });

    it('should get all module IDs', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));
      registry.register(new MockModule('module-2', 'Module 2', '1.0.0'));
      registry.register(new MockModule('module-3', 'Module 3', '1.0.0'));

      const ids = registry.getAllModuleIds();
      expect(ids).toContain('module-1');
      expect(ids).toContain('module-2');
      expect(ids).toContain('module-3');
      expect(ids.length).toBe(3);
    });

    it('should get all modules', () => {
      const module1 = new MockModule('module-1', 'Module 1', '1.0.0');
      const module2 = new MockModule('module-2', 'Module 2', '1.0.0');

      registry.register(module1);
      registry.register(module2);

      const modules = registry.getAllModules();
      expect(modules).toContain(module1);
      expect(modules).toContain(module2);
      expect(modules.length).toBe(2);
    });

    it('should get all metadata', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));
      registry.register(new MockModule('module-2', 'Module 2', '1.0.0'));

      const metadata = registry.getAllMetadata();
      expect(metadata.length).toBe(2);
      expect(metadata[0].id).toBeDefined();
      expect(metadata[0].name).toBeDefined();
      expect(metadata[0].version).toBeDefined();
    });
  });

  describe('Dependency Management', () => {
    it('should get immediate dependencies of a module', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0', ['dep-1', 'dep-2']);
      registry.register(module);

      const deps = registry.getDependencies('test-module');
      expect(deps).toEqual(['dep-1', 'dep-2']);
    });

    it('should return empty array for module with no dependencies', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0');
      registry.register(module);

      const deps = registry.getDependencies('test-module');
      expect(deps).toEqual([]);
    });

    it('should return empty array for non-existent module dependencies', () => {
      const deps = registry.getDependencies('non-existent');
      expect(deps).toEqual([]);
    });

    it('should get all transitive dependencies', () => {
      // dependency-1 depends on: dependency-2
      // dependency-2 depends on: dependency-3
      // test-module depends on: dependency-1
      registry.register(new MockModule('dependency-3', 'Dependency 3', '1.0.0', []));
      registry.register(new MockModule('dependency-2', 'Dependency 2', '1.0.0', ['dependency-3']));
      registry.register(new MockModule('dependency-1', 'Dependency 1', '1.0.0', ['dependency-2']));
      registry.register(new MockModule('test-module', 'Test Module', '1.0.0', ['dependency-1']));

      const allDeps = registry.getAllDependencies('test-module');
      expect(allDeps).toContain('dependency-1');
      expect(allDeps).toContain('dependency-2');
      expect(allDeps).toContain('dependency-3');
      expect(allDeps.length).toBe(3);
    });

    it('should get dependents of a module', () => {
      registry.register(new MockModule('dependency', 'Dependency', '1.0.0'));
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0', ['dependency']));
      registry.register(new MockModule('module-2', 'Module 2', '1.0.0', ['dependency']));
      registry.register(new MockModule('module-3', 'Module 3', '1.0.0'));

      const dependents = registry.getDependents('dependency');
      expect(dependents).toContain('module-1');
      expect(dependents).toContain('module-2');
      expect(dependents).not.toContain('module-3');
      expect(dependents.length).toBe(2);
    });

    it('should return empty array for module with no dependents', () => {
      registry.register(new MockModule('test-module', 'Test Module', '1.0.0'));

      const dependents = registry.getDependents('test-module');
      expect(dependents).toEqual([]);
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve simple dependency chain', () => {
      // Chain: module-a -> module-b -> module-c
      registry.register(new MockModule('module-c', 'Module C', '1.0.0'));
      registry.register(new MockModule('module-b', 'Module B', '1.0.0', ['module-c']));
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['module-b']));

      const resolution = registry.resolveDependencies(['module-a']);

      expect(resolution.hasCircularDependency).toBe(false);
      expect(resolution.loadOrder).toEqual(['module-c', 'module-b', 'module-a']);
    });

    it('should resolve multiple independent modules', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));
      registry.register(new MockModule('module-2', 'Module 2', '1.0.0'));
      registry.register(new MockModule('module-3', 'Module 3', '1.0.0'));

      const resolution = registry.resolveDependencies(['module-1', 'module-2', 'module-3']);

      expect(resolution.hasCircularDependency).toBe(false);
      expect(resolution.loadOrder.length).toBe(3);
      expect(resolution.loadOrder).toContain('module-1');
      expect(resolution.loadOrder).toContain('module-2');
      expect(resolution.loadOrder).toContain('module-3');
    });

    it('should resolve complex dependency graph', () => {
      // Graph:
      //   module-a -> [module-b, module-c]
      //   module-b -> [module-d]
      //   module-c -> [module-d]
      //   module-d -> []
      registry.register(new MockModule('module-d', 'Module D', '1.0.0'));
      registry.register(new MockModule('module-c', 'Module C', '1.0.0', ['module-d']));
      registry.register(new MockModule('module-b', 'Module B', '1.0.0', ['module-d']));
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['module-b', 'module-c']));

      const resolution = registry.resolveDependencies(['module-a']);

      expect(resolution.hasCircularDependency).toBe(false);

      // module-d should come before module-b and module-c
      const dIndex = resolution.loadOrder.indexOf('module-d');
      const bIndex = resolution.loadOrder.indexOf('module-b');
      const cIndex = resolution.loadOrder.indexOf('module-c');
      const aIndex = resolution.loadOrder.indexOf('module-a');

      expect(dIndex).toBeLessThan(bIndex);
      expect(dIndex).toBeLessThan(cIndex);
      expect(bIndex).toBeLessThan(aIndex);
      expect(cIndex).toBeLessThan(aIndex);
    });

    it('should detect simple circular dependency (A -> B -> A)', () => {
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['module-b']));
      registry.register(new MockModule('module-b', 'Module B', '1.0.0', ['module-a']));

      const resolution = registry.resolveDependencies(['module-a']);

      expect(resolution.hasCircularDependency).toBe(true);
      expect(resolution.circularPaths).toBeDefined();
      expect(resolution.circularPaths!.length).toBeGreaterThan(0);
    });

    it('should detect complex circular dependency (A -> B -> C -> A)', () => {
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['module-b']));
      registry.register(new MockModule('module-b', 'Module B', '1.0.0', ['module-c']));
      registry.register(new MockModule('module-c', 'Module C', '1.0.0', ['module-a']));

      const resolution = registry.resolveDependencies(['module-a']);

      expect(resolution.hasCircularDependency).toBe(true);
      expect(resolution.circularPaths).toBeDefined();
    });

    it('should detect self-referencing module', () => {
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['module-a']));

      const resolution = registry.resolveDependencies(['module-a']);

      expect(resolution.hasCircularDependency).toBe(true);
    });

    it('should throw error when resolving non-existent module', () => {
      expect(() => {
        registry.resolveDependencies(['non-existent']);
      }).toThrow('Module "non-existent" is not registered');
    });

    it('should handle module with missing dependency', () => {
      // Module has dependency that isn't registered - should throw
      registry.register(new MockModule('module-a', 'Module A', '1.0.0', ['missing-dep']));

      // This should not throw because we only check if the requested module exists
      // The dependency resolution will fail later when trying to resolve 'missing-dep'
      expect(() => {
        registry.resolveDependencies(['module-a']);
      }).toThrow();
    });
  });

  describe('Clear', () => {
    it('should clear all modules', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));
      registry.register(new MockModule('module-2', 'Module 2', '1.0.0'));
      registry.register(new MockModule('module-3', 'Module 3', '1.0.0'));

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.moduleCount()).toBe(0);
      expect(registry.getAllModuleIds()).toEqual([]);
    });

    it('should allow registration after clear', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));
      registry.clear();

      const module = new MockModule('module-2', 'Module 2', '1.0.0');
      registry.register(module);

      expect(registry.size).toBe(1);
      expect(registry.has('module-2')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dependency resolution', () => {
      const resolution = registry.resolveDependencies([]);
      expect(resolution.hasCircularDependency).toBe(false);
      expect(resolution.loadOrder).toEqual([]);
    });

    it('should handle module with empty dependencies array', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0', []);
      registry.register(module);

      const deps = registry.getDependencies('test-module');
      expect(deps).toEqual([]);
    });

    it('should return immutable arrays from registry methods', () => {
      registry.register(new MockModule('module-1', 'Module 1', '1.0.0'));

      const ids = registry.getAllModuleIds();
      expect(() => {
        (ids as any).push('new-id');
      }).toThrow();
    });

    it('should return immutable metadata', () => {
      const module = new MockModule('test-module', 'Test Module', '1.0.0', ['dep-1']);
      registry.register(module);

      const metadata = registry.getMetadata('test-module')!;
      expect(() => {
        (metadata as any).id = 'modified-id';
      }).toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large number of modules efficiently', () => {
      const moduleCount = 1000;
      const startTime = Date.now();

      // Register modules
      for (let i = 0; i < moduleCount; i++) {
        registry.register(new MockModule(`module-${i}`, `Module ${i}`, '1.0.0'));
      }

      const registrationTime = Date.now() - startTime;
      expect(registrationTime).toBeLessThan(1000); // Should complete within 1 second
      expect(registry.size).toBe(moduleCount);

      // Retrieval should be fast
      const retrievalStart = Date.now();
      const module = registry.get('module-500');
      const retrievalTime = Date.now() - retrievalStart;

      expect(module).toBeDefined();
      expect(retrievalTime).toBeLessThan(10); // Should be nearly instant
    });

    it('should handle complex dependency graphs efficiently', () => {
      // Create a dependency tree with depth 5
      registry.register(new MockModule('level-5', 'Level 5', '1.0.0'));
      registry.register(new MockModule('level-4', 'Level 4', '1.0.0', ['level-5']));
      registry.register(new MockModule('level-3', 'Level 3', '1.0.0', ['level-4']));
      registry.register(new MockModule('level-2', 'Level 2', '1.0.0', ['level-3']));
      registry.register(new MockModule('level-1', 'Level 1', '1.0.0', ['level-2']));

      const startTime = Date.now();
      const resolution = registry.resolveDependencies(['level-1']);
      const resolutionTime = Date.now() - startTime;

      expect(resolutionTime).toBeLessThan(100); // Should resolve quickly
      expect(resolution.hasCircularDependency).toBe(false);
      expect(resolution.loadOrder.length).toBe(5);
    });
  });
});
