import { Injectable, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

import { ResourceProvider } from './resource-provider';

// Mock services for testing
@Injectable()
class MockFirestore {
  collection(path: string) {
    return { path };
  }
}

@Injectable()
class MockAuth {
  currentUser = null;
  signIn() {
    return Promise.resolve();
  }
}

@Injectable()
class TestService {
  value = 'test-service';
}

describe('ResourceProvider', () => {
  let provider: ResourceProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResourceProvider, { provide: Firestore, useClass: MockFirestore }, { provide: Auth, useClass: MockAuth }, TestService]
    });
    provider = TestBed.inject(ResourceProvider);
  });

  describe('Initialization', () => {
    it('should create an instance', () => {
      expect(provider).toBeTruthy();
    });

    it('should auto-register default resources', () => {
      expect(provider.has('firestore')).toBe(true);
      expect(provider.has('auth')).toBe(true);
      expect(provider.has('injector')).toBe(true);
    });

    it('should provide Firestore instance', () => {
      const firestore = provider.get<Firestore>('firestore');
      expect(firestore).toBeTruthy();
      expect(firestore instanceof MockFirestore).toBe(true);
    });

    it('should provide Auth instance', () => {
      const auth = provider.get<Auth>('auth');
      expect(auth).toBeTruthy();
      expect(auth instanceof MockAuth).toBe(true);
    });
  });

  describe('Resource Registration', () => {
    it('should register a resource with factory', () => {
      provider.register('test', () => 'test-value');

      expect(provider.has('test')).toBe(true);
    });

    it('should register a resource with complex factory', () => {
      provider.register('complex', () => {
        return {
          initialized: true,
          value: 42,
          nested: { deep: 'value' }
        };
      });

      const resource = provider.get<any>('complex');
      expect(resource.initialized).toBe(true);
      expect(resource.value).toBe(42);
      expect(resource.nested.deep).toBe('value');
    });

    it('should warn when overwriting existing resource', () => {
      const warnSpy = spyOn(console, 'warn');

      provider.register('test', () => 'value1');
      provider.register('test', () => 'value2');

      expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/Resource "test" is already registered/));
    });

    it('should overwrite existing resource', () => {
      provider.register('test', () => 'value1');
      expect(provider.get<string>('test')).toBe('value1');

      provider.register('test', () => 'value2');
      expect(provider.get<string>('test')).toBe('value2');
    });

    it('should clear cached instance when re-registering', () => {
      let callCount = 0;

      provider.register('counter', () => ++callCount);
      expect(provider.get<number>('counter')).toBe(1);
      expect(provider.get<number>('counter')).toBe(1); // Cached

      provider.register('counter', () => ++callCount);
      expect(provider.get<number>('counter')).toBe(2); // Re-instantiated
    });
  });

  describe('Resource Retrieval', () => {
    it('should retrieve registered resource', () => {
      provider.register('test', () => 'test-value');

      const resource = provider.get<string>('test');
      expect(resource).toBe('test-value');
    });

    it('should cache resource instance', () => {
      let callCount = 0;
      provider.register('counter', () => ++callCount);

      expect(provider.get<number>('counter')).toBe(1);
      expect(provider.get<number>('counter')).toBe(1);
      expect(provider.get<number>('counter')).toBe(1);

      // Factory should only be called once
      expect(callCount).toBe(1);
    });

    it('should throw error for non-existent resource', () => {
      expect(() => provider.get('non-existent')).toThrowError(/Resource "non-existent" not found/);
    });

    it('should list available resources in error message', () => {
      provider.register('resource1', () => 'value1');
      provider.register('resource2', () => 'value2');

      expect(() => provider.get('non-existent')).toThrowError(/Available resources:/);
      expect(() => provider.get('non-existent')).toThrowError(/resource1/);
      expect(() => provider.get('non-existent')).toThrowError(/resource2/);
    });

    it('should throw error if factory throws', () => {
      provider.register('failing', () => {
        throw new Error('Factory error');
      });

      expect(() => provider.get('failing')).toThrowError(/Failed to instantiate resource "failing"/);
    });

    it('should handle factory returning different types', () => {
      provider.register('string', () => 'text');
      provider.register('number', () => 42);
      provider.register('boolean', () => true);
      provider.register('array', () => [1, 2, 3]);
      provider.register('object', () => ({ key: 'value' }));

      expect(provider.get<string>('string')).toBe('text');
      expect(provider.get<number>('number')).toBe(42);
      expect(provider.get<boolean>('boolean')).toBe(true);
      expect(provider.get<number[]>('array')).toEqual([1, 2, 3]);
      expect(provider.get<any>('object')).toEqual({ key: 'value' });
    });
  });

  describe('Resource Existence Check', () => {
    it('should return true for existing resource', () => {
      provider.register('test', () => 'value');

      expect(provider.has('test')).toBe(true);
    });

    it('should return false for non-existent resource', () => {
      expect(provider.has('non-existent')).toBe(false);
    });

    it('should return true for default resources', () => {
      expect(provider.has('firestore')).toBe(true);
      expect(provider.has('auth')).toBe(true);
      expect(provider.has('injector')).toBe(true);
    });
  });

  describe('Resource Removal', () => {
    it('should remove a resource', () => {
      provider.register('test', () => 'value');
      expect(provider.has('test')).toBe(true);

      provider.remove('test');
      expect(provider.has('test')).toBe(false);
    });

    it('should remove cached instance', () => {
      provider.register('test', () => 'value');
      provider.get('test'); // Instantiate

      expect(provider.getInstantiatedResources()).toContain('test');

      provider.remove('test');
      expect(provider.getInstantiatedResources()).not.toContain('test');
    });

    it('should handle removing non-existent resource', () => {
      expect(() => provider.remove('non-existent')).not.toThrow();
    });
  });

  describe('Resource Listing', () => {
    it('should list all registered resources', () => {
      provider.register('resource1', () => 'value1');
      provider.register('resource2', () => 'value2');
      provider.register('resource3', () => 'value3');

      const resources = provider.listResources();
      expect(resources).toContain('resource1');
      expect(resources).toContain('resource2');
      expect(resources).toContain('resource3');
    });

    it('should include default resources in list', () => {
      const resources = provider.listResources();
      expect(resources).toContain('firestore');
      expect(resources).toContain('auth');
      expect(resources).toContain('injector');
    });

    it('should list instantiated resources', () => {
      provider.register('resource1', () => 'value1');
      provider.register('resource2', () => 'value2');
      provider.register('resource3', () => 'value3');

      // Instantiate only some resources
      provider.get('resource1');
      provider.get('resource3');

      const instantiated = provider.getInstantiatedResources();
      expect(instantiated).toContain('resource1');
      expect(instantiated).not.toContain('resource2');
      expect(instantiated).toContain('resource3');
    });
  });

  describe('Clear All', () => {
    it('should clear all resources', () => {
      provider.register('resource1', () => 'value1');
      provider.register('resource2', () => 'value2');
      provider.get('resource1'); // Instantiate

      expect(provider.listResources().length).toBeGreaterThan(0);
      expect(provider.getInstantiatedResources().length).toBeGreaterThan(0);

      provider.clearAll();

      expect(provider.listResources().length).toBe(0);
      expect(provider.getInstantiatedResources().length).toBe(0);
    });

    it('should remove default resources', () => {
      expect(provider.has('firestore')).toBe(true);

      provider.clearAll();

      expect(provider.has('firestore')).toBe(false);
    });
  });

  describe('Convenience Methods', () => {
    it('should register Angular service by Type', () => {
      provider.registerService('testService', TestService);

      const service = provider.get<TestService>('testService');
      expect(service).toBeTruthy();
      expect(service instanceof TestService).toBe(true);
      expect(service.value).toBe('test-service');
    });

    it('should register value resource', () => {
      provider.registerValue('apiUrl', 'https://api.example.com');
      provider.registerValue('config', { debug: true, timeout: 5000 });

      expect(provider.get<string>('apiUrl')).toBe('https://api.example.com');
      expect(provider.get<any>('config')).toEqual({ debug: true, timeout: 5000 });
    });

    it('should cache value resources', () => {
      const obj = { value: 'test' };
      provider.registerValue('object', obj);

      const retrieved1 = provider.get('object');
      const retrieved2 = provider.get('object');

      expect(retrieved1).toBe(obj);
      expect(retrieved2).toBe(obj);
      expect(retrieved1).toBe(retrieved2); // Same instance
    });
  });

  describe('Type Safety', () => {
    interface CustomType {
      id: string;
      value: number;
    }

    it('should maintain type safety with generics', () => {
      provider.register<CustomType>('custom', () => ({
        id: 'test-id',
        value: 42
      }));

      const resource = provider.get<CustomType>('custom');
      expect(resource.id).toBe('test-id');
      expect(resource.value).toBe(42);
    });
  });

  describe('Integration with Angular DI', () => {
    it('should access Angular Injector', () => {
      const injector = provider.get('injector');
      expect(injector).toBeTruthy();
    });

    it('should inject services through Injector', () => {
      const injector = provider.get<Injector>('injector');
      const testService = injector?.get(TestService);

      expect(testService).toBeTruthy();
      expect(testService instanceof TestService).toBe(true);
    });
  });

  describe('Lazy Loading', () => {
    it('should only call factory when resource is accessed', () => {
      let factoryCalled = false;

      provider.register('lazy', () => {
        factoryCalled = true;
        return 'value';
      });

      expect(factoryCalled).toBe(false);

      provider.get('lazy');

      expect(factoryCalled).toBe(true);
    });

    it('should not re-instantiate on subsequent access', () => {
      let callCount = 0;

      provider.register('lazy', () => {
        callCount++;
        return `call-${callCount}`;
      });

      const first = provider.get('lazy');
      const second = provider.get('lazy');
      const third = provider.get('lazy');

      expect(callCount).toBe(1);
      expect(first).toBe('call-1');
      expect(second).toBe('call-1');
      expect(third).toBe('call-1');
    });
  });
});
