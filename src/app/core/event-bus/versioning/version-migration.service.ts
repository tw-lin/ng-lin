/**
 * Version Migration Service
 * 
 * Manages event version migration strategies and tracks deprecation lifecycle.
 * Provides tools for managing event schema evolution in production.
 * 
 * @see docs/event-bus(Global Event Bus)-4.md for migration strategy
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { DomainEvent } from '../models/base-event';
import { UpcasterChain } from './upcaster-chain';
import { EventVersion, EventVersionUtil } from './event-version.interface';

/**
 * Deprecation status
 */
export interface DeprecationStatus {
  /** Event type */
  readonly eventType: string;
  
  /** Deprecated version */
  readonly version: string;
  
  /** Target version for migration */
  readonly migrateTo: string;
  
  /** Deprecation message */
  readonly message: string;
  
  /** Deprecation date */
  readonly deprecatedAt: Date;
  
  /** Planned removal date */
  readonly removeAt?: Date;
}

/**
 * Migration statistics
 */
export interface MigrationStats {
  /** Total migrations performed */
  readonly totalMigrations: number;
  
  /** Migrations by event type */
  readonly byEventType: Map<string, number>;
  
  /** Migrations by version path */
  readonly byPath: Map<string, number>;
  
  /** Failed migrations */
  readonly failures: number;
  
  /** Average migration time (ms) */
  readonly avgMigrationTime: number;
}

/**
 * Version Migration Service
 * 
 * Tracks event version deprecation and migration progress
 * 
 * @example
 * ```typescript
 * const migrationService = inject(VersionMigrationService);
 * 
 * // Mark version as deprecated
 * migrationService.deprecateVersion(
 *   'task.created',
 *   '1.0',
 *   '2.0',
 *   'Legacy format no longer supported',
 *   new Date('2025-12-31')
 * );
 * 
 * // Check deprecation status
 * const deprecated = migrationService.isDeprecated('task.created', '1.0');
 * 
 * // Get migration statistics
 * const stats = migrationService.getStats();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class VersionMigrationService {
  private readonly upcasterChain = inject(UpcasterChain);
  
  // Signal-based state
  private readonly _deprecations = signal<Map<string, DeprecationStatus>>(new Map());
  private readonly _migrationCount = signal(0);
  private readonly _migrationTimes = signal<number[]>([]);
  private readonly _migrationsByType = signal<Map<string, number>>(new Map());
  private readonly _migrationsByPath = signal<Map<string, number>>(new Map());
  private readonly _failures = signal(0);
  
  // Computed signals
  readonly deprecations = computed(() => Array.from(this._deprecations().values()));
  readonly totalMigrations = this._migrationCount.asReadonly();
  readonly failures = this._failures.asReadonly();
  readonly avgMigrationTime = computed(() => {
    const times = this._migrationTimes();
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  });
  
  /**
   * Deprecate an event version
   * 
   * @param eventType - Event type
   * @param version - Version to deprecate
   * @param migrateTo - Target version
   * @param message - Deprecation message
   * @param removeAt - Optional planned removal date
   */
  deprecateVersion(
    eventType: string,
    version: string,
    migrateTo: string,
    message: string,
    removeAt?: Date
  ): void {
    const key = `${eventType}:${version}`;
    
    const status: DeprecationStatus = {
      eventType,
      version,
      migrateTo,
      message,
      deprecatedAt: new Date(),
      removeAt
    };
    
    this._deprecations.update(map => {
      const newMap = new Map(map);
      newMap.set(key, status);
      return newMap;
    });
  }
  
  /**
   * Check if version is deprecated
   * 
   * @param eventType - Event type
   * @param version - Version to check
   * @returns Deprecation status if deprecated, undefined otherwise
   */
  isDeprecated(eventType: string, version: string): DeprecationStatus | undefined {
    const key = `${eventType}:${version}`;
    return this._deprecations().get(key);
  }
  
  /**
   * Get all deprecated versions for an event type
   * 
   * @param eventType - Event type
   * @returns Array of deprecation statuses
   */
  getDeprecatedVersions(eventType: string): DeprecationStatus[] {
    return this.deprecations().filter(d => d.eventType === eventType);
  }
  
  /**
   * Remove deprecation status
   * 
   * @param eventType - Event type
   * @param version - Version
   */
  removeDeprecation(eventType: string, version: string): void {
    const key = `${eventType}:${version}`;
    
    this._deprecations.update(map => {
      const newMap = new Map(map);
      newMap.delete(key);
      return newMap;
    });
  }
  
  /**
   * Migrate event and track statistics
   * 
   * @param event - Event to migrate
   * @param targetVersion - Target version
   * @returns Migrated event
   */
  async migrate<T extends DomainEvent<any>>(
    event: DomainEvent<any>,
    targetVersion: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = this.upcasterChain.upcast<T>(event, targetVersion);
      
      const duration = performance.now() - startTime;
      
      // Update statistics
      this.trackMigration(event.eventType, result.originalVersion, targetVersion, duration);
      
      return result.event;
    } catch (error) {
      this._failures.update(f => f + 1);
      throw error;
    }
  }
  
  /**
   * Get migration statistics
   */
  getStats(): MigrationStats {
    return {
      totalMigrations: this.totalMigrations(),
      byEventType: new Map(this._migrationsByType()),
      byPath: new Map(this._migrationsByPath()),
      failures: this.failures(),
      avgMigrationTime: this.avgMigrationTime()
    };
  }
  
  /**
   * Reset migration statistics
   */
  resetStats(): void {
    this._migrationCount.set(0);
    this._migrationTimes.set([]);
    this._migrationsByType.set(new Map());
    this._migrationsByPath.set(new Map());
    this._failures.set(0);
  }
  
  /**
   * Track migration in statistics
   */
  private trackMigration(
    eventType: string,
    fromVersion: string,
    toVersion: string,
    duration: number
  ): void {
    // Increment total count
    this._migrationCount.update(c => c + 1);
    
    // Track migration time
    this._migrationTimes.update(times => {
      const newTimes = [...times, duration];
      // Keep only last 1000 measurements
      return newTimes.slice(-1000);
    });
    
    // Track by event type
    this._migrationsByType.update(map => {
      const newMap = new Map(map);
      newMap.set(eventType, (newMap.get(eventType) || 0) + 1);
      return newMap;
    });
    
    // Track by path
    const path = `${fromVersion} -> ${toVersion}`;
    this._migrationsByPath.update(map => {
      const newMap = new Map(map);
      newMap.set(path, (newMap.get(path) || 0) + 1);
      return newMap;
    });
  }
}
