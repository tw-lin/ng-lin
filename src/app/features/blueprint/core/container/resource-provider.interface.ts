/**
 * Resource Provider Interface
 *
 * Manages registration and retrieval of shared resources (services, dependencies)
 * for use by modules within a blueprint.
 *
 * Implements lazy loading - resources are only instantiated when first requested.
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
 *   // ...
 * }
 * ```
 */
export interface IResourceProvider {
  /**
   * Register a resource
   *
   * Registers a factory function that will be called to create the resource
   * when it's first requested.
   *
   * @param name - Unique name for the resource
   * @param factory - Function that creates/returns the resource
   */
  register<T>(name: string, factory: () => T): void;

  /**
   * Get a resource
   *
   * Retrieves a registered resource. If the resource hasn't been instantiated yet,
   * the factory function will be called.
   *
   * @param name - Name of the resource to retrieve
   * @returns The resource instance
   * @throws Error if resource not found
   */
  get<T>(name: string): T;

  /**
   * Check if resource exists
   *
   * @param name - Name of the resource to check
   * @returns True if resource is registered
   */
  has(name: string): boolean;

  /**
   * Remove a resource
   *
   * Unregisters a resource and releases its instance if it was created.
   *
   * @param name - Name of the resource to remove
   */
  remove(name: string): void;
}
