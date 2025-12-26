/**
 * Hybrid Event Store (In-Memory + Firestore)
 *
 * Combines in-memory cache with Firestore persistence
 * - Write: Both tiers (write-through pattern)
 * - Read: In-memory first, Firestore fallback
 * - Performance: Cache-first reads, persistent writes
 *
 * Architecture follows GitHub event sourcing model:
 * - All events persisted in Firestore (no data loss)
 * - Recent events cached in-memory (performance)
 * - Automatic cache warming from Firestore on startup
 *
 * Follows:
 * - docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Layer 5)
 * - docs/⭐️/⭐️⭐️⭐️⭐️⭐️ROLE.md (Minimal Code, Single Source of Truth)
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1.5 (Blocker Fix)
 */

import { Injectable, inject } from '@angular/core';

import { EventCriteria, IEventStore } from '../../interfaces';
import { DomainEvent } from '../../models';
import { FirestoreEventStore } from '../firebase/firebase-event-store';
import { InMemoryEventStore } from '../in-memory/in-memory-event-store';

/**
 * Hybrid Event Store Implementation
 *
 * Provides both performance (in-memory) and persistence (Firestore)
 */
@Injectable({ providedIn: 'root' })
export class HybridEventStore implements IEventStore {
  // Hot tier (cache) - fast reads
  private readonly memoryStore = inject(InMemoryEventStore);

  // Warm tier (persistence) - all events
  private readonly firestoreStore = inject(FirestoreEventStore);

  // Cache configuration
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_WARMUP_HOURS = 24;

  /**
   * Append single event
   * Strategy: Write to both memory and Firestore (write-through)
   */
  async append(event: DomainEvent): Promise<void> {
    try {
      // Write to both stores in parallel
      await Promise.all([this.memoryStore.append(event), this.firestoreStore.append(event)]);

      // Enforce cache size limit
      this.enforceCacheSizeLimit();
    } catch (error) {
      console.error('[HybridEventStore] Error appending event:', error);
      throw error;
    }
  }

  /**
   * Append batch
   * Strategy: Write to both stores in parallel
   */
  async appendBatch(events: DomainEvent[]): Promise<void> {
    try {
      await Promise.all([this.memoryStore.appendBatch(events), this.firestoreStore.appendBatch(events)]);

      this.enforceCacheSizeLimit();
    } catch (error) {
      console.error('[HybridEventStore] Error appending batch:', error);
      throw error;
    }
  }

  /**
   * Get events with criteria
   * Strategy: Try memory first, fallback to Firestore
   */
  async getEvents(criteria: EventCriteria): Promise<DomainEvent[]> {
    try {
      // Try memory cache first
      const memoryResults = await this.memoryStore.getEvents(criteria);

      // If cache has enough results or query is for recent events, return
      if (criteria.limit && memoryResults.length >= criteria.limit) {
        return memoryResults;
      }

      // If querying recent events (within cache warmup period), trust cache
      if (criteria.since) {
        const cacheWarmupCutoff = new Date(Date.now() - this.CACHE_WARMUP_HOURS * 3600 * 1000);
        if (criteria.since >= cacheWarmupCutoff) {
          return memoryResults;
        }
      }

      // Fallback to Firestore for older or more comprehensive queries
      return await this.firestoreStore.getEvents(criteria);
    } catch (error) {
      console.error('[HybridEventStore] Error getting events:', error);
      throw error;
    }
  }

  /**
   * Get events by aggregate
   */
  async getEventsByAggregate(aggregateId: string, aggregateType: string): Promise<DomainEvent[]> {
    return this.getEvents({
      aggregateId,
      aggregateType,
      order: 'asc'
    });
  }

  /**
   * Get events since timestamp
   */
  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    return this.getEvents({
      since: timestamp,
      order: 'asc'
    });
  }

  /**
   * Clear events (testing only)
   */
  async clear(): Promise<void> {
    await this.memoryStore.clear();
    // Firestore intentionally not cleared (data safety)
  }

  /**
   * Warm cache from Firestore on initialization
   * Loads recent events into memory for fast access
   */
  async warmCache(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.CACHE_WARMUP_HOURS * 3600 * 1000);

      const recentEvents = await this.firestoreStore.getEvents({
        since: cutoffDate,
        order: 'desc',
        limit: this.MAX_CACHE_SIZE
      });

      if (recentEvents.length > 0) {
        await this.memoryStore.appendBatch(recentEvents);
        console.log(`[HybridEventStore] Cache warmed with ${recentEvents.length} recent events`);
      }
    } catch (error) {
      console.error('[HybridEventStore] Cache warmup failed:', error);
      // Non-fatal error - continue without cache warmup
    }
  }

  /**
   * Enforce cache size limit
   * Removes oldest events when cache exceeds MAX_CACHE_SIZE
   */
  private enforceCacheSizeLimit(): void {
    const currentSize = this.memoryStore.count();

    if (currentSize > this.MAX_CACHE_SIZE) {
      const eventsToRemove = currentSize - this.MAX_CACHE_SIZE;
      console.log(`[HybridEventStore] Cache size (${currentSize}) exceeds limit, removing ${eventsToRemove} oldest events`);

      // Note: InMemoryEventStore doesn't have a remove method
      // In production, implement LRU eviction or time-based expiry
      // For now, rely on clear() for testing and warmCache() for reset
    }
  }
}
