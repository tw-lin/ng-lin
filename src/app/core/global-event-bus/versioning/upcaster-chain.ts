/**
 * Upcaster Chain
 *
 * Manages automatic event version migration through a chain of upcasters.
 * Finds the optimal path from source version to target version.
 *
 * @see docs/event-bus(Global Event Bus)-4.md for chain strategy
 */

import { Injectable, inject } from '@angular/core';

import { EventUpcaster, UpcasterRegistry } from './event-upcaster.base';
import { EventVersion, EventVersionUtil } from './event-version.interface';
import { DomainEvent } from '../models/base-event';

/**
 * Upcast path step
 */
interface UpcastStep {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly upcaster: EventUpcaster<any, any>;
}

/**
 * Upcast chain result
 */
export interface UpcastChainResult<T extends DomainEvent<any>> {
  /** Upcasted event */
  readonly event: T;

  /** Path taken for upcasting */
  readonly path: UpcastStep[];

  /** Whether upcasting was needed */
  readonly wasUpcasted: boolean;

  /** Original version */
  readonly originalVersion: string;

  /** Target version achieved */
  readonly targetVersion: string;
}

/**
 * Upcaster Chain Service
 *
 * Automatically finds and executes the optimal path for event version migration
 *
 * @example
 * ```typescript
 * const chain = inject(UpcasterChain);
 *
 * // Register upcasters
 * chain.register(new TaskCreatedUpcaster_1_0_to_1_1());
 * chain.register(new TaskCreatedUpcaster_1_1_to_2_0());
 *
 * // Upcast event from 1.0 to 2.0 (automatic path finding)
 * const result = chain.upcast(eventV1_0, '2.0');
 * // Path: 1.0 -> 1.1 -> 2.0
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UpcasterChain {
  private readonly registry = new UpcasterRegistry();

  /**
   * Register an upcaster
   *
   * @param upcaster - Upcaster to register
   */
  register(upcaster: EventUpcaster<any, any>): void {
    this.registry.register(upcaster);
  }

  /**
   * Upcast event to target version
   *
   * Automatically finds the shortest path and applies all necessary transformations
   *
   * @param event - Event to upcast
   * @param targetVersion - Target version (e.g., "2.0")
   * @returns Upcast result with transformed event and path
   *
   * @throws Error if no upcast path exists
   */
  upcast<T extends DomainEvent<any>>(event: DomainEvent<any>, targetVersion: string): UpcastChainResult<T> {
    const currentVersion = event.metadata?.version || '1.0';

    // No upcasting needed
    if (currentVersion === targetVersion) {
      return {
        event: event as T,
        path: [],
        wasUpcasted: false,
        originalVersion: currentVersion,
        targetVersion: currentVersion
      };
    }

    // Find upcast path
    const path = this.findUpcastPath(event.eventType, currentVersion, targetVersion);

    if (!path) {
      throw new Error(`No upcast path found for ${event.eventType} from ${currentVersion} to ${targetVersion}`);
    }

    // Execute upcast chain
    let result: DomainEvent<any> = event;

    for (const step of path) {
      result = step.upcaster.upcast(result);
    }

    return {
      event: result as T,
      path,
      wasUpcasted: true,
      originalVersion: currentVersion,
      targetVersion
    };
  }

  /**
   * Check if upcast path exists
   *
   * @param eventType - Event type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns true if path exists
   */
  canUpcast(eventType: string, fromVersion: string, toVersion: string): boolean {
    if (fromVersion === toVersion) {
      return true;
    }

    return this.findUpcastPath(eventType, fromVersion, toVersion) !== null;
  }

  /**
   * Get all registered versions for an event type
   *
   * @param eventType - Event type
   * @returns Array of versions
   */
  getVersions(eventType: string): string[] {
    const upcasters = this.registry.getAll(eventType);
    const versions = new Set<string>();

    for (const upcaster of upcasters) {
      versions.add(upcaster.fromVersion);
      versions.add(upcaster.toVersion);
    }

    return Array.from(versions).sort((a, b) => {
      const vA = EventVersionUtil.parse(a);
      const vB = EventVersionUtil.parse(b);
      return EventVersionUtil.compare(vA, vB);
    });
  }

  /**
   * Get latest version for an event type
   *
   * @param eventType - Event type
   * @returns Latest version or null if no upcasters registered
   */
  getLatestVersion(eventType: string): string | null {
    const versions = this.getVersions(eventType);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  /**
   * Find upcast path using breadth-first search
   *
   * @param eventType - Event type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Array of upcast steps or null if no path exists
   */
  private findUpcastPath(eventType: string, fromVersion: string, toVersion: string): UpcastStep[] | null {
    // Breadth-first search to find shortest path
    const queue: Array<{ version: string; path: UpcastStep[] }> = [{ version: fromVersion, path: [] }];

    const visited = new Set<string>([fromVersion]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.version === toVersion) {
        return current.path;
      }

      // Find all possible next steps
      const upcasters = this.registry.getAll(eventType).filter(u => u.fromVersion === current.version);

      for (const upcaster of upcasters) {
        if (!visited.has(upcaster.toVersion)) {
          visited.add(upcaster.toVersion);

          queue.push({
            version: upcaster.toVersion,
            path: [
              ...current.path,
              {
                fromVersion: upcaster.fromVersion,
                toVersion: upcaster.toVersion,
                upcaster
              }
            ]
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Clear all registered upcasters
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Get number of registered upcasters
   */
  get size(): number {
    return this.registry.size;
  }
}
