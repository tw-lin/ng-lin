import { Injectable, inject, Injector, Type } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

import type { IResourceProvider } from './resource-provider.interface';

/**
 * Resource Provider Implementation
 *
 * Manages registration and retrieval of shared resources (services, dependencies)
 * for use by modules within a blueprint. Implements lazy loading - resources are
 * only instantiated when first requested.
 *
 * Features:
 * - Lazy resource instantiation
 * - Factory pattern for flexible resource creation
 * - Automatic registration of Angular Fire resources
 * - Type-safe resource retrieval
 * - Memory-efficient resource management
 *
 * @example
 * ```typescript
 * // Register a resource
 * provider.register('firestore', () => inject(Firestore));
 *
 * // Get a resource
 * const firestore = provider.get<Firestore>('firestore');
 *
 * // Check if resource exists
 * if (provider.has('myResource')) {
 *   const resource = provider.get('myResource');
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ResourceProvider implements IResourceProvider {
  /**
   * Angular Injector for accessing DI services
   */
  private readonly injector = inject(Injector);

  /**
   * Factory registry
   * Maps resource names to their factory functions
   */
  private readonly factories = new Map<string, () => any>();

  /**
   * Resource instance cache
   * Stores instantiated resources for reuse
   */
  private readonly instances = new Map<string, any>();

  /**
   * Initialize with default Angular Fire resources
   */
  constructor() {
    this.registerDefaultResources();
  }

  /**
   * Register a resource
   *
   * Registers a factory function that will be called to create the resource
   * when it's first requested.
   *
   * @param name - Unique name for the resource
   * @param factory - Function that creates/returns the resource
   *
   * @example
   * ```typescript
   * // Register a simple value
   * provider.register('apiUrl', () => 'https://api.example.com');
   *
   * // Register a service instance
   * provider.register('logger', () => inject(LoggerService));
   *
   * // Register with complex initialization
   * provider.register('cache', () => {
   *   const cache = new Map();
   *   cache.set('initialized', true);
   *   return cache;
   * });
   * ```
   */
  register<T>(name: string, factory: () => T): void {
    if (this.factories.has(name)) {
      console.warn(`[ResourceProvider] Resource "${name}" is already registered. Overwriting.`);
    }

    this.factories.set(name, factory);

    // Clear cached instance if it exists
    if (this.instances.has(name)) {
      this.instances.delete(name);
    }
  }

  /**
   * Get a resource
   *
   * Retrieves a registered resource. If the resource hasn't been instantiated yet,
   * the factory function will be called.
   *
   * @param name - Name of the resource to retrieve
   * @returns The resource instance
   * @throws Error if resource not found
   *
   * @example
   * ```typescript
   * const firestore = provider.get<Firestore>('firestore');
   * const auth = provider.get<Auth>('auth');
   * ```
   */
  get<T>(name: string): T {
    // Check if already instantiated
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Check if factory exists
    if (!this.factories.has(name)) {
      throw new Error(`[ResourceProvider] Resource "${name}" not found. Available resources: ${this.listResources().join(', ')}`);
    }

    // Instantiate using factory
    try {
      const factory = this.factories.get(name)!;
      const instance = factory();

      // Cache the instance
      this.instances.set(name, instance);

      return instance;
    } catch (error) {
      throw new Error(
        `[ResourceProvider] Failed to instantiate resource "${name}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if resource exists
   *
   * @param name - Name of the resource to check
   * @returns True if resource is registered
   *
   * @example
   * ```typescript
   * if (provider.has('firestore')) {
   *   const firestore = provider.get<Firestore>('firestore');
   * }
   * ```
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Remove a resource
   *
   * Unregisters a resource and releases its instance if it was created.
   *
   * @param name - Name of the resource to remove
   *
   * @example
   * ```typescript
   * provider.remove('temporaryCache');
   * ```
   */
  remove(name: string): void {
    this.factories.delete(name);
    this.instances.delete(name);
  }

  /**
   * Get all registered resource names
   *
   * @returns Array of resource names
   *
   * @example
   * ```typescript
   * const resources = provider.listResources();
   * console.log('Available resources:', resources);
   * ```
   */
  listResources(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get instantiated resource names
   *
   * @returns Array of resource names that have been instantiated
   *
   * @example
   * ```typescript
   * const instantiated = provider.getInstantiatedResources();
   * console.log('Cached resources:', instantiated);
   * ```
   */
  getInstantiatedResources(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Clear all resources
   *
   * Removes all registered factories and cached instances.
   * Useful for testing or cleanup.
   */
  clearAll(): void {
    this.factories.clear();
    this.instances.clear();
  }

  /**
   * Register default Angular Fire resources
   *
   * Automatically registers Firestore and Auth services
   * for convenient access by modules.
   */
  private registerDefaultResources(): void {
    // Register Firestore
    this.register('firestore', () => this.injector.get(Firestore));

    // Register Auth
    this.register('auth', () => this.injector.get(Auth));

    // Register Injector (for advanced use cases)
    this.register('injector', () => this.injector);
  }

  /**
   * Register an Angular service by Type
   *
   * Convenience method for registering Angular services.
   *
   * @param name - Resource name
   * @param serviceType - Angular service class
   *
   * @example
   * ```typescript
   * provider.registerService('logger', LoggerService);
   * const logger = provider.get<LoggerService>('logger');
   * ```
   */
  registerService<T>(name: string, serviceType: Type<T>): void {
    this.register(name, () => this.injector.get(serviceType));
  }

  /**
   * Register a value resource
   *
   * Convenience method for registering simple values.
   *
   * @param name - Resource name
   * @param value - Value to register
   *
   * @example
   * ```typescript
   * provider.registerValue('apiUrl', 'https://api.example.com');
   * provider.registerValue('config', { debug: true, timeout: 5000 });
   * ```
   */
  registerValue<T>(name: string, value: T): void {
    this.register(name, () => value);
  }
}
