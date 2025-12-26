/**
 * Event Upcaster Base Classes
 *
 * Provides infrastructure for converting events from one version to another,
 * enabling backward compatibility and smooth event schema evolution.
 *
 * @see docs/event-bus(Global Event Bus)-4.md for upcasting strategy
 */

import { EventVersion } from './event-version.interface';
import { DomainEvent } from '../models/base-event';

/**
 * Generic event upcaster interface
 *
 * Transforms events from one version to another
 *
 * @template TFrom - Source event type
 * @template TTo - Target event type
 *
 * @example
 * ```typescript
 * class TaskCreatedUpcaster_1_0_to_2_0
 *   implements EventUpcaster<TaskCreatedEventV1, TaskCreatedEventV2>
 * {
 *   readonly fromVersion = '1.0';
 *   readonly toVersion = '2.0';
 *
 *   upcast(event: TaskCreatedEventV1): TaskCreatedEventV2 {
 *     return new TaskCreatedEventV2({
 *       ...event.payload,
 *       newField: 'default-value'
 *     });
 *   }
 * }
 * ```
 */
export interface EventUpcaster<TFrom extends DomainEvent<any>, TTo extends DomainEvent<any>> {
  /** Source version (e.g., "1.0") */
  readonly fromVersion: string;

  /** Target version (e.g., "2.0") */
  readonly toVersion: string;

  /** Event type this upcaster handles */
  readonly eventType: string;

  /**
   * Transform event from source version to target version
   *
   * @param event - Event in source version format
   * @returns Event in target version format
   */
  upcast(event: TFrom): TTo;

  /**
   * Optional: Validate that the event can be upcasted
   *
   * @param event - Event to validate
   * @returns true if event can be upcasted
   */
  canUpcast?(event: TFrom): boolean;
}

/**
 * Base abstract class for event upcasters
 *
 * Provides common functionality and validation
 */
export abstract class BaseEventUpcaster<TFrom extends DomainEvent<any>, TTo extends DomainEvent<any>> implements EventUpcaster<TFrom, TTo> {
  abstract readonly fromVersion: string;
  abstract readonly toVersion: string;
  abstract readonly eventType: string;

  /**
   * Upcast event with validation
   */
  upcast(event: TFrom): TTo {
    this.validateEvent(event);

    if (this.canUpcast && !this.canUpcast(event)) {
      throw new Error(`Cannot upcast event ${event.eventType} from ${this.fromVersion} to ${this.toVersion}`);
    }

    return this.transform(event);
  }

  /**
   * Implement the actual transformation logic
   */
  protected abstract transform(event: TFrom): TTo;

  /**
   * Validate source event before upcasting
   */
  protected validateEvent(event: TFrom): void {
    if (event.eventType !== this.eventType) {
      throw new Error(`Event type mismatch: expected ${this.eventType}, got ${event.eventType}`);
    }

    if (!event.metadata?.version) {
      throw new Error(`Event missing version metadata: ${event.eventId}`);
    }

    if (event.metadata.version !== this.fromVersion) {
      throw new Error(`Version mismatch: expected ${this.fromVersion}, got ${event.metadata.version}`);
    }
  }

  /**
   * Optional: Check if event can be upcasted
   */
  canUpcast?(event: TFrom): boolean;
}

/**
 * Upcaster registry for managing multiple upcasters
 */
export class UpcasterRegistry {
  private readonly upcasters = new Map<string, EventUpcaster<any, any>>();

  /**
   * Register an upcaster
   *
   * @param upcaster - Upcaster to register
   */
  register(upcaster: EventUpcaster<any, any>): void {
    const key = this.makeKey(upcaster.eventType, upcaster.fromVersion, upcaster.toVersion);
    this.upcasters.set(key, upcaster);
  }

  /**
   * Get upcaster for specific transformation
   *
   * @param eventType - Event type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Upcaster if found, undefined otherwise
   */
  get(eventType: string, fromVersion: string, toVersion: string): EventUpcaster<any, any> | undefined {
    const key = this.makeKey(eventType, fromVersion, toVersion);
    return this.upcasters.get(key);
  }

  /**
   * Get all upcasters for an event type
   *
   * @param eventType - Event type
   * @returns Array of upcasters for this event type
   */
  getAll(eventType: string): Array<EventUpcaster<any, any>> {
    return Array.from(this.upcasters.values()).filter(u => u.eventType === eventType);
  }

  /**
   * Check if upcaster exists
   */
  has(eventType: string, fromVersion: string, toVersion: string): boolean {
    const key = this.makeKey(eventType, fromVersion, toVersion);
    return this.upcasters.has(key);
  }

  /**
   * Clear all upcasters
   */
  clear(): void {
    this.upcasters.clear();
  }

  /**
   * Get total number of registered upcasters
   */
  get size(): number {
    return this.upcasters.size;
  }

  private makeKey(eventType: string, fromVersion: string, toVersion: string): string {
    return `${eventType}:${fromVersion}->${toVersion}`;
  }
}
