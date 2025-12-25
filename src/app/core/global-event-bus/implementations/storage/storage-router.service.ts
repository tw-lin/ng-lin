/**
 * Storage Router Service
 *
 * Coordinates multi-tier storage strategy (Hot/Warm/Cold)
 * - Automatic tier selection based on data age and query patterns
 * - Write-through to both Hot (In-Memory) and Warm (Firestore) tiers
 * - Read from Hot tier first, fallback to Warm tier
 * - Automatic archiving from Hot → Warm → Cold
 *
 * Follows docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md specifications
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1 (P0 - Critical) - Task 1.1
 */

import { Injectable, inject, signal } from '@angular/core';

import { FirestoreStorageStrategy } from './firestore-storage.strategy';
import { InMemoryStorageStrategy } from './inmemory-storage.strategy';
import { IStorageStrategy, StorageTier, BatchWriteResult } from '../../interfaces/storage-strategy.interface';
import { AuditEvent, AuditEventQuery } from '../../models/audit-event.model';

/**
 * Storage Router Configuration
 */
export interface StorageRouterConfig {
  /** Enable Hot Tier (In-Memory) */
  enableHotTier: boolean;

  /** Enable Warm Tier (Firestore) */
  enableWarmTier: boolean;

  /** Enable Cold Tier (Cloud Storage) - Phase 2 */
  enableColdTier: boolean;

  /** Auto-tiering enabled (Hot → Warm → Cold) */
  autoTiering: boolean;

  /** Tiering check interval (ms) */
  tieringIntervalMs: number;

  /** Hot tier retention hours (default 24h) */
  hotTierRetentionHours: number;
}

/**
 * Default Storage Router Configuration
 */
const DEFAULT_ROUTER_CONFIG: StorageRouterConfig = {
  enableHotTier: true,
  enableWarmTier: true,
  enableColdTier: false, // Phase 2
  autoTiering: true,
  tieringIntervalMs: 3600000, // 1 hour
  hotTierRetentionHours: 24
};

/**
 * Storage Statistics
 */
export interface StorageStatistics {
  hotTier: {
    enabled: boolean;
    eventCount: number;
    lastWrite: Date | null;
  };
  warmTier: {
    enabled: boolean;
    eventCount: number;
    lastWrite: Date | null;
  };
  coldTier: {
    enabled: boolean;
    eventCount: number;
    lastArchive: Date | null;
  };
  totalWrites: number;
  totalReads: number;
  totalArchived: number;
}

@Injectable({ providedIn: 'root' })
export class StorageRouterService {
  // Inject storage strategies
  private hotTierStrategy = inject(InMemoryStorageStrategy);
  private warmTierStrategy = inject(FirestoreStorageStrategy);
  // coldTierStrategy will be added in Phase 2

  // Configuration
  private _config = signal<StorageRouterConfig>(DEFAULT_ROUTER_CONFIG);
  readonly config = this._config.asReadonly();

  // Statistics
  private _stats = signal<StorageStatistics>({
    hotTier: { enabled: true, eventCount: 0, lastWrite: null },
    warmTier: { enabled: true, eventCount: 0, lastWrite: null },
    coldTier: { enabled: false, eventCount: 0, lastArchive: null },
    totalWrites: 0,
    totalReads: 0,
    totalArchived: 0
  });
  readonly stats = this._stats.asReadonly();

  private tieringIntervalHandle: any;

  constructor() {
    console.log('[StorageRouterService] Initialized (Hot + Warm Tiers)');
    this.startAutoTiering();
  }

  /**
   * Initialize all storage tiers
   */
  async initialize(): Promise<void> {
    const tasks: Array<Promise<void>> = [];

    if (this._config().enableHotTier) {
      tasks.push(this.hotTierStrategy.initialize());
    }

    if (this._config().enableWarmTier) {
      tasks.push(this.warmTierStrategy.initialize());
    }

    await Promise.all(tasks);
    console.log('[StorageRouterService] All storage tiers initialized');
  }

  /**
   * Write single audit event
   * Strategy: Write-through to both Hot and Warm tiers
   */
  async write(event: AuditEvent): Promise<string> {
    const tasks: Array<Promise<string>> = [];

    // Write to Hot Tier (synchronous, fast)
    if (this._config().enableHotTier) {
      tasks.push(this.hotTierStrategy.write(event));
    }

    // Write to Warm Tier (asynchronous, persistent)
    if (this._config().enableWarmTier) {
      tasks.push(this.warmTierStrategy.write(event));
    }

    const results = await Promise.all(tasks);

    // Update statistics
    this._stats.update(stats => ({
      ...stats,
      hotTier: { ...stats.hotTier, lastWrite: new Date() },
      warmTier: { ...stats.warmTier, lastWrite: new Date() },
      totalWrites: stats.totalWrites + 1
    }));

    return results[0]; // Return Hot Tier event ID
  }

  /**
   * Batch write multiple audit events
   * Strategy: Write-through to both Hot and Warm tiers
   */
  async writeBatch(events: AuditEvent[]): Promise<BatchWriteResult> {
    const tasks: Array<Promise<BatchWriteResult>> = [];

    // Write to Hot Tier
    if (this._config().enableHotTier) {
      tasks.push(this.hotTierStrategy.writeBatch(events));
    }

    // Write to Warm Tier (async, don't block)
    if (this._config().enableWarmTier) {
      tasks.push(this.warmTierStrategy.writeBatch(events));
    }

    const results = await Promise.all(tasks);

    // Aggregate results (use Hot Tier as primary)
    const primaryResult = results[0];

    // Update statistics
    this._stats.update(stats => ({
      ...stats,
      hotTier: { ...stats.hotTier, lastWrite: new Date() },
      warmTier: { ...stats.warmTier, lastWrite: new Date() },
      totalWrites: stats.totalWrites + events.length
    }));

    return primaryResult;
  }

  /**
   * Query audit events
   * Strategy: Read from Hot tier first, fallback to Warm tier if not found
   */
  async query(queryParams: AuditEventQuery): Promise<AuditEvent[]> {
    let results: AuditEvent[] = [];

    // Step 1: Query Hot Tier (fast, recent events)
    if (this._config().enableHotTier) {
      results = await this.hotTierStrategy.query(queryParams);

      // If Hot Tier has enough results, return immediately
      if (queryParams.limit && results.length >= queryParams.limit) {
        this._stats.update(stats => ({
          ...stats,
          totalReads: stats.totalReads + results.length
        }));
        return results;
      }
    }

    // Step 2: Query Warm Tier (persistent, older events)
    if (this._config().enableWarmTier) {
      const warmResults = await this.warmTierStrategy.query(queryParams);

      // Merge results (avoid duplicates by event ID)
      const hotEventIds = new Set(results.map(e => e.id));
      const uniqueWarmResults = warmResults.filter(e => !hotEventIds.has(e.id));

      results = [...results, ...uniqueWarmResults];

      // Sort by timestamp DESC
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (queryParams.limit) {
        results = results.slice(0, queryParams.limit);
      }
    }

    this._stats.update(stats => ({
      ...stats,
      totalReads: stats.totalReads + results.length
    }));

    return results;
  }

  /**
   * Get single audit event by ID
   * Strategy: Check Hot tier first, fallback to Warm tier
   */
  async getById(eventId: string, tenantId?: string): Promise<AuditEvent | null> {
    // Try Hot Tier first
    if (this._config().enableHotTier) {
      const event = await this.hotTierStrategy.getById(eventId, tenantId);
      if (event) {
        this._stats.update(stats => ({
          ...stats,
          totalReads: stats.totalReads + 1
        }));
        return event;
      }
    }

    // Fallback to Warm Tier
    if (this._config().enableWarmTier) {
      const event = await this.warmTierStrategy.getById(eventId, tenantId);
      if (event) {
        this._stats.update(stats => ({
          ...stats,
          totalReads: stats.totalReads + 1
        }));
        return event;
      }
    }

    return null;
  }

  /**
   * Delete audit event(s) by ID
   * Strategy: Delete from all tiers
   */
  async delete(eventIds: string[], tenantId: string): Promise<number> {
    let totalDeleted = 0;

    if (this._config().enableHotTier) {
      totalDeleted += await this.hotTierStrategy.delete(eventIds, tenantId);
    }

    if (this._config().enableWarmTier) {
      totalDeleted += await this.warmTierStrategy.delete(eventIds, tenantId);
    }

    return totalDeleted;
  }

  /**
   * Count total events across all tiers
   */
  async count(queryParams?: Partial<AuditEventQuery>): Promise<number> {
    let total = 0;

    if (this._config().enableHotTier) {
      total += await this.hotTierStrategy.count(queryParams);
    }

    if (this._config().enableWarmTier) {
      total += await this.warmTierStrategy.count(queryParams);
    }

    // Note: Avoid double-counting events in both tiers
    // In production, use unique event IDs to deduplicate

    return total;
  }

  /**
   * Start automatic tiering (Hot → Warm → Cold)
   */
  private startAutoTiering(): void {
    if (!this._config().autoTiering) {
      console.log('[StorageRouterService] Auto-tiering disabled');
      return;
    }

    console.log(`[StorageRouterService] Auto-tiering started (interval: ${this._config().tieringIntervalMs}ms)`);

    this.tieringIntervalHandle = setInterval(() => {
      this.performTiering();
    }, this._config().tieringIntervalMs);
  }

  /**
   * Perform tiering: Archive old events from Hot → Warm
   */
  private async performTiering(): Promise<void> {
    try {
      const retentionHours = this._config().hotTierRetentionHours;
      const cutoffDate = new Date(Date.now() - retentionHours * 3600 * 1000);

      console.log(`[StorageRouterService] Tiering check: archiving events before ${cutoffDate.toISOString()}`);

      // Archive from Hot to Warm
      if (this._config().enableHotTier && this._config().enableWarmTier) {
        const archivedCount = await this.hotTierStrategy.archive(cutoffDate);

        this._stats.update(stats => ({
          ...stats,
          totalArchived: stats.totalArchived + archivedCount
        }));

        console.log(`[StorageRouterService] Archived ${archivedCount} events from Hot to Warm tier`);
      }

      // TODO: Archive from Warm to Cold (Phase 2)
    } catch (error) {
      console.error('[StorageRouterService] Tiering failed:', error);
    }
  }

  /**
   * Stop automatic tiering
   */
  stopAutoTiering(): void {
    if (this.tieringIntervalHandle) {
      clearInterval(this.tieringIntervalHandle);
      this.tieringIntervalHandle = null;
      console.log('[StorageRouterService] Auto-tiering stopped');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StorageRouterConfig>): void {
    this._config.update(current => ({ ...current, ...config }));

    // Restart auto-tiering if interval changed
    if (config.tieringIntervalMs || config.autoTiering !== undefined) {
      this.stopAutoTiering();
      if (this._config().autoTiering) {
        this.startAutoTiering();
      }
    }

    console.log('[StorageRouterService] Configuration updated:', this._config());
  }

  /**
   * Get storage statistics
   */
  async refreshStatistics(): Promise<StorageStatistics> {
    const stats: StorageStatistics = {
      hotTier: {
        enabled: this._config().enableHotTier,
        eventCount: 0,
        lastWrite: this._stats().hotTier.lastWrite
      },
      warmTier: {
        enabled: this._config().enableWarmTier,
        eventCount: 0,
        lastWrite: this._stats().warmTier.lastWrite
      },
      coldTier: {
        enabled: this._config().enableColdTier,
        eventCount: 0,
        lastArchive: this._stats().coldTier.lastArchive
      },
      totalWrites: this._stats().totalWrites,
      totalReads: this._stats().totalReads,
      totalArchived: this._stats().totalArchived
    };

    if (this._config().enableHotTier) {
      stats.hotTier.eventCount = await this.hotTierStrategy.count();
    }

    if (this._config().enableWarmTier) {
      stats.warmTier.eventCount = await this.warmTierStrategy.count();
    }

    this._stats.set(stats);

    return stats;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.stopAutoTiering();

    const tasks: Array<Promise<void>> = [];

    if (this._config().enableHotTier) {
      tasks.push(this.hotTierStrategy.dispose());
    }

    if (this._config().enableWarmTier) {
      tasks.push(this.warmTierStrategy.dispose());
    }

    await Promise.all(tasks);
    console.log('[StorageRouterService] Disposed');
  }
}
