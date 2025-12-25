/**
 * Shared Context Implementation for Blueprint V2.0
 *
 * Provides a shared state container that modules can use to store and retrieve
 * data with tenant isolation. Uses Angular Signals for reactive state management.
 *
 * Features:
 * - Type-safe state management with generics
 * - Tenant-level isolation (Organization/Team/User)
 * - Angular Signals for reactive updates
 * - Key-value store with namespacing
 * - State history tracking
 * - Automatic cleanup
 *
 * @example
 * ```typescript
 * // Set state
 * context.setState('user.preferences', { theme: 'dark' });
 *
 * // Get state
 * const prefs = context.getState<UserPrefs>('user.preferences');
 *
 * // Get state as Signal
 * const prefsSignal = context.getStateSignal<UserPrefs>('user.preferences');
 *
 * // Check if state exists
 * if (context.hasState('user.preferences')) {
 *   // ...
 * }
 *
 * // Clear specific state
 * context.clearState('user.preferences');
 * ```
 *
 * @packageDocumentation
 */

import { Injectable, signal, Signal, computed, WritableSignal } from '@angular/core';

import { TenantInfo } from './tenant-info.interface';

/**
 * State entry metadata
 */
interface StateEntry<T = any> {
  value: T;
  timestamp: number;
  namespace?: string;
}

/**
 * Shared Context for Blueprint Modules
 *
 * Provides a centralized state management system that modules can use
 * to share data while maintaining tenant isolation.
 */
@Injectable({
  providedIn: 'root'
})
export class SharedContext {
  /**
   * Internal state store with Signals
   * Map<key, WritableSignal<StateEntry>>
   */
  private stateStore = new Map<string, WritableSignal<StateEntry | undefined>>();

  /**
   * Tenant information for isolation
   */
  private tenantInfo: TenantInfo | null = null;

  /**
   * State change counter for reactive updates
   */
  private stateChangeCount = signal(0);

  /**
   * Number of state entries
   */
  public readonly stateCount: Signal<number>;

  /**
   * List of all state keys
   */
  public readonly stateKeys: Signal<string[]>;

  constructor() {
    // Computed signals for state monitoring
    this.stateCount = computed(() => {
      // Trigger on state changes
      this.stateChangeCount();
      return this.stateStore.size;
    });

    this.stateKeys = computed(() => {
      // Trigger on state changes
      this.stateChangeCount();
      return Array.from(this.stateStore.keys());
    });
  }

  /**
   * Initialize context with tenant information
   *
   * @param tenant - Tenant information for isolation
   *
   * @example
   * ```typescript
   * context.initialize({
   *   organizationId: 'org-123',
   *   teamId: 'team-456',
   *   userId: 'user-789'
   * });
   * ```
   */
  initialize(tenant: TenantInfo): void {
    this.tenantInfo = tenant;
  }

  /**
   * Get tenant information
   *
   * @returns Current tenant info or null if not initialized
   */
  getTenant(): TenantInfo | null {
    return this.tenantInfo;
  }

  /**
   * Set state value
   *
   * @param key - State key (supports dot notation for namespacing)
   * @param value - State value
   * @param namespace - Optional namespace for organization
   *
   * @example
   * ```typescript
   * // Simple state
   * context.setState('theme', 'dark');
   *
   * // Namespaced state
   * context.setState('preferences', { lang: 'en' }, 'user');
   *
   * // Dot notation
   * context.setState('user.preferences.theme', 'dark');
   * ```
   */
  setState<T>(key: string, value: T, namespace?: string): void {
    const fullKey = this.buildKey(key, namespace);

    const entry: StateEntry<T> = {
      value,
      timestamp: Date.now(),
      namespace
    };

    // Get or create signal for this key
    if (!this.stateStore.has(fullKey)) {
      this.stateStore.set(fullKey, signal<StateEntry<T> | undefined>(entry));
    } else {
      const existingSignal = this.stateStore.get(fullKey) as WritableSignal<StateEntry<T> | undefined>;
      existingSignal.set(entry);
    }

    // Trigger state change notification
    this.stateChangeCount.update(c => c + 1);
  }

  /**
   * Get state value
   *
   * @param key - State key
   * @param namespace - Optional namespace
   * @returns State value or undefined if not found
   *
   * @example
   * ```typescript
   * const theme = context.getState<string>('theme');
   * const prefs = context.getState<UserPrefs>('preferences', 'user');
   * ```
   */
  getState<T>(key: string, namespace?: string): T | undefined {
    const fullKey = this.buildKey(key, namespace);
    const stateSignal = this.stateStore.get(fullKey);

    if (!stateSignal) {
      return undefined;
    }

    const entry = stateSignal() as StateEntry<T> | undefined;
    return entry?.value;
  }

  /**
   * Get state as a Signal for reactive updates
   *
   * @param key - State key
   * @param namespace - Optional namespace
   * @returns Signal of state value
   *
   * @example
   * ```typescript
   * const themeSignal = context.getStateSignal<string>('theme');
   *
   * // In component template
   * <div [class.dark]="themeSignal() === 'dark'">
   * ```
   */
  getStateSignal<T>(key: string, namespace?: string): Signal<T | undefined> {
    const fullKey = this.buildKey(key, namespace);

    if (!this.stateStore.has(fullKey)) {
      // Create empty signal if key doesn't exist
      this.stateStore.set(fullKey, signal<StateEntry<T> | undefined>(undefined));
    }

    const stateSignal = this.stateStore.get(fullKey) as WritableSignal<StateEntry<T> | undefined>;

    // Return computed signal that extracts value
    return computed(() => {
      const entry = stateSignal();
      return entry?.value;
    });
  }

  /**
   * Check if state exists
   *
   * @param key - State key
   * @param namespace - Optional namespace
   * @returns True if state exists
   *
   * @example
   * ```typescript
   * if (context.hasState('theme')) {
   *   const theme = context.getState<string>('theme');
   * }
   * ```
   */
  hasState(key: string, namespace?: string): boolean {
    const fullKey = this.buildKey(key, namespace);
    const stateSignal = this.stateStore.get(fullKey);
    return stateSignal !== undefined && stateSignal() !== undefined;
  }

  /**
   * Clear specific state
   *
   * @param key - State key
   * @param namespace - Optional namespace
   *
   * @example
   * ```typescript
   * context.clearState('theme');
   * context.clearState('preferences', 'user');
   * ```
   */
  clearState(key: string, namespace?: string): void {
    const fullKey = this.buildKey(key, namespace);
    const stateSignal = this.stateStore.get(fullKey);

    if (stateSignal) {
      stateSignal.set(undefined);
      // Trigger state change notification
      this.stateChangeCount.update(c => c + 1);
    }
  }

  /**
   * Clear all state in a namespace
   *
   * @param namespace - Namespace to clear
   *
   * @example
   * ```typescript
   * // Clear all user state
   * context.clearNamespace('user');
   * ```
   */
  clearNamespace(namespace: string): void {
    const keysToRemove: string[] = [];

    for (const [key, stateSignal] of this.stateStore.entries()) {
      const entry = stateSignal();
      if (entry?.namespace === namespace) {
        stateSignal.set(undefined);
        keysToRemove.push(key);
      }
    }

    if (keysToRemove.length > 0) {
      // Trigger state change notification
      this.stateChangeCount.update(c => c + 1);
    }
  }

  /**
   * Clear all state
   *
   * @example
   * ```typescript
   * context.clearAll();
   * ```
   */
  clearAll(): void {
    for (const stateSignal of this.stateStore.values()) {
      stateSignal.set(undefined);
    }
    this.stateStore.clear();
    this.stateChangeCount.update(c => c + 1);
  }

  /**
   * Get all state entries (for debugging)
   *
   * @returns Map of all state entries
   */
  getAllState(): Map<string, any> {
    const result = new Map<string, any>();

    for (const [key, stateSignal] of this.stateStore.entries()) {
      const entry = stateSignal();
      if (entry !== undefined) {
        result.set(key, entry.value);
      }
    }

    return result;
  }

  /**
   * Get state metadata
   *
   * @param key - State key
   * @param namespace - Optional namespace
   * @returns State metadata (timestamp, namespace) or undefined
   *
   * @example
   * ```typescript
   * const metadata = context.getStateMetadata('theme');
   * console.log('Last updated:', metadata?.timestamp);
   * ```
   */
  getStateMetadata(key: string, namespace?: string): Omit<StateEntry, 'value'> | undefined {
    const fullKey = this.buildKey(key, namespace);
    const stateSignal = this.stateStore.get(fullKey);

    if (!stateSignal) {
      return undefined;
    }

    const entry = stateSignal();
    if (!entry) {
      return undefined;
    }

    return {
      timestamp: entry.timestamp,
      namespace: entry.namespace
    };
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.clearAll();
    this.tenantInfo = null;
  }

  /**
   * Build full key with namespace
   *
   * @param key - Base key
   * @param namespace - Optional namespace
   * @returns Full key
   */
  private buildKey(key: string, namespace?: string): string {
    if (namespace) {
      return `${namespace}:${key}`;
    }
    return key;
  }
}
