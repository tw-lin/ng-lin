/**
 * Versioned Event Bus
 * 
 * Event bus implementation with automatic version migration support.
 * Automatically upcasts events to latest/target version on consumption.
 * 
 * @see docs/event-bus(Global Event Bus)-4.md for versioning strategy
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomainEvent } from '../models/base-event';
import { IEventBus } from '../interfaces/event-bus.interface';
import { InMemoryEventBus } from '../implementations/in-memory/in-memory-event-bus';
import { UpcasterChain } from './upcaster-chain';
import { EventSubscribeOptions } from '../interfaces/event-handler.interface';
import { ISubscription } from '../interfaces/subscription.interface';

/**
 * Versioned subscribe options
 */
export interface VersionedSubscribeOptions extends EventSubscribeOptions {
  /**
   * Target version for automatic upcasting
   * 
   * - Specific version: "2.0"
   * - Latest version: "latest"
   * - Current version (no upcast): "current"
   * 
   * @default "latest"
   */
  readonly targetVersion?: string | 'latest' | 'current';
}

/**
 * Versioned Event Bus
 * 
 * Wraps existing event bus with automatic version migration capabilities
 * 
 * @example
 * ```typescript
 * const versionedBus = inject(VersionedEventBus);
 * 
 * // Register upcasters
 * versionedBus.registerUpcaster(new TaskCreatedUpcaster_1_0_to_2_0());
 * 
 * // Subscribe with automatic upcasting to latest version
 * versionedBus.subscribe('task.created', (event) => {
 *   // event is automatically upcasted to latest version
 *   console.log(event);
 * }, { targetVersion: 'latest' });
 * 
 * // Subscribe to specific version
 * versionedBus.subscribe('task.created', (event) => {
 *   // event is upcasted to version 2.0
 *   console.log(event);
 * }, { targetVersion: '2.0' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class VersionedEventBus implements IEventBus {
  private readonly innerBus = inject(InMemoryEventBus);
  private readonly upcasterChain = inject(UpcasterChain);
  
  /**
   * Publish event (without version transformation)
   * 
   * Events are published in their original version
   */
  async publish<T extends DomainEvent<any>>(event: T): Promise<void> {
    return this.innerBus.publish(event);
  }
  
  /**
   * Publish multiple events in batch
   */
  async publishBatch<T extends DomainEvent<any>>(events: T[]): Promise<void> {
    return this.innerBus.publishBatch(events);
  }
  
  /**
   * Subscribe to event with automatic version migration
   * 
   * @param eventType - Event type pattern (supports wildcards)
   * @param handler - Event handler function
   * @param options - Subscribe options with version targeting
   */
  async subscribe<T extends DomainEvent<any>>(
    eventType: string,
    handler: (event: T) => void | Promise<void>,
    options?: VersionedSubscribeOptions
  ): Promise<ISubscription> {
    const targetVersion = options?.targetVersion || 'latest';
    
    // Wrap handler with version migration
    const wrappedHandler = async (event: DomainEvent<any>) => {
      try {
        const migratedEvent = this.upcastEvent<T>(event, targetVersion);
        await handler(migratedEvent);
      } catch (error) {
        console.error(
          `[VersionedEventBus] Failed to upcast event ${event.eventType} to version ${targetVersion}`,
          error
        );
        throw error;
      }
    };
    
    return this.innerBus.subscribe(eventType, wrappedHandler, options);
  }
  
  /**
   * Observe events as Observable with automatic version migration
   * 
   * @param eventType - Event type pattern
   * @param targetVersion - Target version (default: 'latest')
   */
  observe<T extends DomainEvent<any>>(
    eventType: string,
    targetVersion: string | 'latest' | 'current' = 'latest'
  ): Observable<T> {
    return this.innerBus.observe(eventType).pipe(
      map(event => this.upcastEvent<T>(event, targetVersion))
    );
  }
  
  /**
   * Observe all events with version migration
   * 
   * @param targetVersion - Target version (default: 'latest')
   */
  observeAll<T extends DomainEvent<any>>(
    targetVersion: string | 'latest' | 'current' = 'latest'
  ): Observable<T> {
    return this.innerBus.observeAll().pipe(
      map(event => this.upcastEvent<T>(event, targetVersion))
    );
  }
  
  /**
   * Unsubscribe from event
   */
  async unsubscribe(subscription: ISubscription): Promise<void> {
    return this.innerBus.unsubscribe(subscription);
  }
  
  /**
   * Register an upcaster
   * 
   * @param upcaster - Upcaster to register
   */
  registerUpcaster(upcaster: any): void {
    this.upcasterChain.register(upcaster);
  }
  
  /**
   * Get latest version for an event type
   * 
   * @param eventType - Event type
   * @returns Latest version or null
   */
  getLatestVersion(eventType: string): string | null {
    return this.upcasterChain.getLatestVersion(eventType);
  }
  
  /**
   * Get all versions for an event type
   * 
   * @param eventType - Event type
   * @returns Array of versions
   */
  getVersions(eventType: string): string[] {
    return this.upcasterChain.getVersions(eventType);
  }
  
  /**
   * Check if upcast path exists
   * 
   * @param eventType - Event type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   */
  canUpcast(eventType: string, fromVersion: string, toVersion: string): boolean {
    return this.upcasterChain.canUpcast(eventType, fromVersion, toVersion);
  }
  
  /**
   * Upcast event to target version
   * 
   * @param event - Event to upcast
   * @param targetVersion - Target version
   * @returns Upcasted event
   */
  private upcastEvent<T extends DomainEvent<any>>(
    event: DomainEvent<any>,
    targetVersion: string | 'latest' | 'current'
  ): T {
    // No upcasting needed
    if (targetVersion === 'current') {
      return event as T;
    }
    
    // Resolve "latest" to actual version
    let resolvedVersion = targetVersion;
    if (targetVersion === 'latest') {
      const latest = this.upcasterChain.getLatestVersion(event.eventType);
      if (!latest) {
        // No upcasters registered, return original event
        return event as T;
      }
      resolvedVersion = latest;
    }
    
    // Upcast event
    const result = this.upcasterChain.upcast<T>(event, resolvedVersion);
    return result.event;
  }
}
