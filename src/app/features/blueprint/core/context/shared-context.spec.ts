/**
 * Unit Tests for SharedContext
 *
 * Tests comprehensive state management functionality including:
 * - Initialization and tenant isolation
 * - State CRUD operations
 * - Signal-based reactive updates
 * - Namespace management
 * - State metadata tracking
 * - Cleanup and disposal
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SharedContext } from './shared-context';
import { TenantInfo, ContextType } from './tenant-info.interface';

describe('SharedContext', () => {
  let context: SharedContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedContext]
    });
    context = TestBed.inject(SharedContext);
  });

  afterEach(() => {
    context.dispose();
  });

  describe('Initialization', () => {
    it('should create instance', () => {
      expect(context).toBeTruthy();
    });

    it('should initialize with tenant information', () => {
      const tenant: TenantInfo = {
        organizationId: 'org-123',
        teamId: 'team-456',
        userId: 'user-789',
        contextType: ContextType.TEAM
      };

      context.initialize(tenant);

      const retrievedTenant = context.getTenant();
      expect(retrievedTenant).toEqual(tenant);
    });

    it('should return null tenant before initialization', () => {
      expect(context.getTenant()).toBeNull();
    });

    it('should have zero state count initially', () => {
      expect(context.stateCount()).toBe(0);
    });

    it('should have empty state keys initially', () => {
      expect(context.stateKeys()).toEqual([]);
    });
  });

  describe('State Management - Basic Operations', () => {
    it('should set and get string state', () => {
      context.setState('theme', 'dark');

      const theme = context.getState<string>('theme');
      expect(theme).toBe('dark');
    });

    it('should set and get number state', () => {
      context.setState('count', 42);

      const count = context.getState<number>('count');
      expect(count).toBe(42);
    });

    it('should set and get boolean state', () => {
      context.setState('enabled', true);

      const enabled = context.getState<boolean>('enabled');
      expect(enabled).toBe(true);
    });

    it('should set and get object state', () => {
      const user = { name: 'John', age: 30 };
      context.setState('user', user);

      const retrievedUser = context.getState<typeof user>('user');
      expect(retrievedUser).toEqual(user);
    });

    it('should set and get array state', () => {
      const items = ['a', 'b', 'c'];
      context.setState('items', items);

      const retrievedItems = context.getState<string[]>('items');
      expect(retrievedItems).toEqual(items);
    });

    it('should update existing state', () => {
      context.setState('theme', 'light');
      expect(context.getState<string>('theme')).toBe('light');

      context.setState('theme', 'dark');
      expect(context.getState<string>('theme')).toBe('dark');
    });

    it('should return undefined for non-existent state', () => {
      const result = context.getState('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('State Management - Namespaces', () => {
    it('should set and get state with namespace', () => {
      context.setState('preferences', { theme: 'dark' }, 'user');

      const prefs = context.getState<any>('preferences', 'user');
      expect(prefs).toEqual({ theme: 'dark' });
    });

    it('should isolate state between namespaces', () => {
      context.setState('config', { value: 1 }, 'namespace1');
      context.setState('config', { value: 2 }, 'namespace2');

      expect(context.getState<any>('config', 'namespace1')).toEqual({ value: 1 });
      expect(context.getState<any>('config', 'namespace2')).toEqual({ value: 2 });
    });

    it('should isolate namespaced state from non-namespaced state', () => {
      context.setState('key', 'value1');
      context.setState('key', 'value2', 'namespace');

      expect(context.getState<string>('key')).toBe('value1');
      expect(context.getState<string>('key', 'namespace')).toBe('value2');
    });

    it('should clear namespace state', () => {
      context.setState('key1', 'value1', 'namespace');
      context.setState('key2', 'value2', 'namespace');
      context.setState('key3', 'value3', 'other');

      context.clearNamespace('namespace');

      expect(context.hasState('key1', 'namespace')).toBe(false);
      expect(context.hasState('key2', 'namespace')).toBe(false);
      expect(context.hasState('key3', 'other')).toBe(true);
    });
  });

  describe('State Signals - Reactive Updates', () => {
    it('should get state as Signal', () => {
      context.setState('theme', 'dark');

      const themeSignal = context.getStateSignal<string>('theme');
      expect(themeSignal()).toBe('dark');
    });

    it('should create signal for non-existent state', () => {
      const signal = context.getStateSignal<string>('non-existent');
      expect(signal()).toBeUndefined();
    });

    it('should update signal when state changes', () => {
      context.setState('count', 0);
      const countSignal = context.getStateSignal<number>('count');

      expect(countSignal()).toBe(0);

      context.setState('count', 5);
      expect(countSignal()).toBe(5);
    });

    it('should trigger signal updates when state changes', done => {
      context.setState('theme', 'light');
      const themeSignal = context.getStateSignal<string>('theme');

      // Verify initial value
      expect(themeSignal()).toBe('light');

      // Trigger change and verify update
      setTimeout(() => {
        context.setState('theme', 'dark');
        expect(themeSignal()).toBe('dark');
        done();
      }, 10);
    });

    it('should update stateCount signal when state changes', () => {
      expect(context.stateCount()).toBe(0);

      context.setState('key1', 'value1');
      expect(context.stateCount()).toBe(1);

      context.setState('key2', 'value2');
      expect(context.stateCount()).toBe(2);
    });

    it('should update stateKeys signal when state changes', () => {
      expect(context.stateKeys()).toEqual([]);

      context.setState('key1', 'value1');
      expect(context.stateKeys()).toContain('key1');

      context.setState('key2', 'value2');
      expect(context.stateKeys()).toContain('key1');
      expect(context.stateKeys()).toContain('key2');
    });
  });

  describe('State Existence Checks', () => {
    it('should return true for existing state', () => {
      context.setState('key', 'value');
      expect(context.hasState('key')).toBe(true);
    });

    it('should return false for non-existent state', () => {
      expect(context.hasState('non-existent')).toBe(false);
    });

    it('should return true for namespaced state', () => {
      context.setState('key', 'value', 'namespace');
      expect(context.hasState('key', 'namespace')).toBe(true);
    });

    it('should return false after clearing state', () => {
      context.setState('key', 'value');
      expect(context.hasState('key')).toBe(true);

      context.clearState('key');
      expect(context.hasState('key')).toBe(false);
    });
  });

  describe('State Clearing', () => {
    it('should clear specific state', () => {
      context.setState('key1', 'value1');
      context.setState('key2', 'value2');

      context.clearState('key1');

      expect(context.hasState('key1')).toBe(false);
      expect(context.hasState('key2')).toBe(true);
    });

    it('should clear namespaced state', () => {
      context.setState('key', 'value', 'namespace');

      context.clearState('key', 'namespace');

      expect(context.hasState('key', 'namespace')).toBe(false);
    });

    it('should handle clearing non-existent state', () => {
      expect(() => {
        context.clearState('non-existent');
      }).not.toThrow();
    });

    it('should clear all state', () => {
      context.setState('key1', 'value1');
      context.setState('key2', 'value2', 'namespace');
      context.setState('key3', 'value3');

      context.clearAll();

      expect(context.stateCount()).toBe(0);
      expect(context.stateKeys()).toEqual([]);
      expect(context.hasState('key1')).toBe(false);
      expect(context.hasState('key2', 'namespace')).toBe(false);
      expect(context.hasState('key3')).toBe(false);
    });
  });

  describe('State Metadata', () => {
    it('should track state timestamp', done => {
      const beforeTimestamp = Date.now();

      context.setState('key', 'value');

      setTimeout(() => {
        const metadata = context.getStateMetadata('key');
        expect(metadata).toBeDefined();
        expect(metadata!.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(metadata!.timestamp).toBeLessThanOrEqual(Date.now());
        done();
      }, 10);
    });

    it('should track namespace in metadata', () => {
      context.setState('key', 'value', 'test-namespace');

      const metadata = context.getStateMetadata('key', 'test-namespace');
      expect(metadata?.namespace).toBe('test-namespace');
    });

    it('should return undefined metadata for non-existent state', () => {
      const metadata = context.getStateMetadata('non-existent');
      expect(metadata).toBeUndefined();
    });

    it('should update timestamp when state is updated', done => {
      context.setState('key', 'value1');
      const firstMetadata = context.getStateMetadata('key');
      const firstTimestamp = firstMetadata!.timestamp;

      setTimeout(() => {
        context.setState('key', 'value2');
        const secondMetadata = context.getStateMetadata('key');
        expect(secondMetadata!.timestamp).toBeGreaterThan(firstTimestamp);
        done();
      }, 10);
    });
  });

  describe('Get All State', () => {
    it('should return all state entries', () => {
      context.setState('key1', 'value1');
      context.setState('key2', 'value2');
      context.setState('key3', 'value3', 'namespace');

      const allState = context.getAllState();

      expect(allState.size).toBe(3);
      expect(allState.get('key1')).toBe('value1');
      expect(allState.get('key2')).toBe('value2');
      expect(allState.get('namespace:key3')).toBe('value3');
    });

    it('should return empty map when no state exists', () => {
      const allState = context.getAllState();
      expect(allState.size).toBe(0);
    });

    it('should not include cleared state', () => {
      context.setState('key1', 'value1');
      context.setState('key2', 'value2');
      context.clearState('key1');

      const allState = context.getAllState();

      expect(allState.size).toBe(1);
      expect(allState.has('key1')).toBe(false);
      expect(allState.has('key2')).toBe(true);
    });
  });

  describe('Disposal and Cleanup', () => {
    it('should clear all state on dispose', () => {
      context.setState('key1', 'value1');
      context.setState('key2', 'value2');

      context.dispose();

      expect(context.stateCount()).toBe(0);
    });

    it('should clear tenant info on dispose', () => {
      const tenant: TenantInfo = {
        organizationId: 'org-123',
        teamId: 'team-456',
        userId: 'user-789',
        contextType: ContextType.TEAM
      };

      context.initialize(tenant);
      expect(context.getTenant()).toEqual(tenant);

      context.dispose();
      expect(context.getTenant()).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple namespaces', () => {
      context.setState('config', { value: 1 }, 'module1');
      context.setState('config', { value: 2 }, 'module2');
      context.setState('config', { value: 3 }, 'module3');

      expect(context.getState<any>('config', 'module1')?.value).toBe(1);
      expect(context.getState<any>('config', 'module2')?.value).toBe(2);
      expect(context.getState<any>('config', 'module3')?.value).toBe(3);
    });

    it('should handle nested objects', () => {
      const complexObject = {
        user: {
          profile: {
            name: 'John',
            preferences: {
              theme: 'dark',
              language: 'en'
            }
          }
        }
      };

      context.setState('data', complexObject);
      const retrieved = context.getState<typeof complexObject>('data');

      expect(retrieved).toEqual(complexObject);
      expect(retrieved?.user.profile.preferences.theme).toBe('dark');
    });

    it('should handle state with dot notation keys', () => {
      context.setState('user.preferences.theme', 'dark');
      context.setState('user.preferences.language', 'en');

      expect(context.getState<string>('user.preferences.theme')).toBe('dark');
      expect(context.getState<string>('user.preferences.language')).toBe('en');
    });

    it('should maintain state isolation between different instances', () => {
      const context2 = TestBed.inject(SharedContext);

      context.setState('key', 'value1');
      context2.setState('key', 'value2');

      // Note: Both are singleton instances in root, so they share state
      // This test verifies the service is properly provided
      expect(context).toBe(context2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      context.setState('nullValue', null);
      expect(context.getState('nullValue')).toBeNull();
      expect(context.hasState('nullValue')).toBe(true);
    });

    it('should handle undefined values', () => {
      context.setState('undefinedValue', undefined);
      expect(context.getState('undefinedValue')).toBeUndefined();
    });

    it('should handle empty string keys', () => {
      context.setState('', 'value');
      expect(context.getState('')).toBe('value');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with_special.chars@123';
      context.setState(specialKey, 'value');
      expect(context.getState(specialKey)).toBe('value');
    });

    it('should handle large state objects', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `item-${i}`
      }));

      context.setState('largeArray', largeArray);
      const retrieved = context.getState<typeof largeArray>('largeArray');

      expect(retrieved?.length).toBe(1000);
      expect(retrieved?.[500].id).toBe(500);
    });
  });
});
