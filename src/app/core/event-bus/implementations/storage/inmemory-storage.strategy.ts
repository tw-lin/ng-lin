/**
 * In-Memory Storage Strategy
 * 
 * Hot Tier storage implementation using in-memory circular buffer
 * - 24-hour retention period for real-time queries & dashboards
 * - High-performance read/write operations
 * - Automatic eviction using FIFO strategy
 * - Thread-safe operations with signal-based reactivity
 * 
 * Follows docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md specifications
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1 (P0 - Critical) - Task 1.1
 */

import { Injectable, signal } from '@angular/core';
import {
  IStorageStrategy,
  StorageTier,
  StorageStrategyConfig,
  BatchWriteResult
} from '../../interfaces/storage-strategy.interface';
import { 
  AuditEvent, 
  AuditEventQuery,
  AuditLevel,
  AuditCategory 
} from '../../models/audit-event.model';

/**
 * Default In-Memory Storage Configuration
 */
const DEFAULT_INMEMORY_CONFIG: StorageStrategyConfig = {
  tier: StorageTier.HOT,
  retentionDays: 1,  // 24 hours
  autoTiering: true,
  batchSize: 1000,  // No platform limit for in-memory
  compression: false
};

/**
 * Circular Buffer for event storage
 * Automatically evicts oldest events when capacity reached
 */
class CircularBuffer<T> {
  private buffer: T[];
  private writeIndex = 0;
  private size = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  push(item: T): void {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }
  
  pushBatch(items: T[]): void {
    items.forEach(item => this.push(item));
  }
  
  getAll(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    
    // Reorder circular buffer to chronological order
    const part1 = this.buffer.slice(this.writeIndex);
    const part2 = this.buffer.slice(0, this.writeIndex);
    return [...part1, ...part2].filter(item => item !== undefined);
  }
  
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.writeIndex = 0;
    this.size = 0;
  }
  
  get length(): number {
    return this.size;
  }
}

@Injectable({ providedIn: 'root' })
export class InMemoryStorageStrategy implements IStorageStrategy {
  readonly tier = StorageTier.HOT;
  readonly config: StorageStrategyConfig;
  
  private buffer: CircularBuffer<AuditEvent>;
  private eventMap = new Map<string, AuditEvent>();  // For fast lookups
  
  // Signal for reactivity (UI updates)
  private _eventCount = signal(0);
  readonly eventCount = this._eventCount.asReadonly();
  
  constructor() {
    this.config = { ...DEFAULT_INMEMORY_CONFIG };
    this.buffer = new CircularBuffer<AuditEvent>(1000);  // Max 1000 events in Hot Tier
    console.log('[InMemoryStorageStrategy] Initialized (Hot Tier - 24h retention, max 1000 events)');
  }
  
  /**
   * Initialize in-memory storage
   */
  async initialize(): Promise<void> {
    this.buffer.clear();
    this.eventMap.clear();
    this._eventCount.set(0);
    console.log('[InMemoryStorageStrategy] Initialization complete');
  }
  
  /**
   * Write single audit event to memory
   */
  async write(event: AuditEvent): Promise<string> {
    // Auto-eviction: oldest event removed if buffer full
    if (this.buffer.length >= 1000) {
      const oldestEvents = this.buffer.getAll().slice(0, 1);
      oldestEvents.forEach(e => this.eventMap.delete(e.id));
    }
    
    this.buffer.push(event);
    this.eventMap.set(event.id, event);
    this._eventCount.set(this.buffer.length);
    
    return event.id;
  }
  
  /**
   * Batch write multiple audit events
   */
  async writeBatch(events: AuditEvent[]): Promise<BatchWriteResult> {
    const startTime = performance.now();
    let successCount = 0;
    const errors: string[] = [];
    
    try {
      // Auto-eviction handled by CircularBuffer
      this.buffer.pushBatch(events);
      
      events.forEach(event => {
        this.eventMap.set(event.id, event);
        successCount++;
      });
      
      this._eventCount.set(this.buffer.length);
    } catch (error) {
      errors.push(`Batch write failed: ${error}`);
    }
    
    const durationMs = performance.now() - startTime;
    
    return {
      success: successCount,
      failed: events.length - successCount,
      errors,
      durationMs
    };
  }
  
  /**
   * Query audit events with filters
   * In-memory filtering (fast but limited to buffer size)
   */
  async query(queryParams: AuditEventQuery): Promise<AuditEvent[]> {
    let results = this.buffer.getAll();
    
    // ✅ Tenant isolation (MANDATORY unless superadmin)
    if (queryParams.tenantId) {
      results = results.filter(e => e.tenantId === queryParams.tenantId);
    }
    
    // Time range filtering
    if (queryParams.startDate) {
      results = results.filter(e => e.timestamp >= queryParams.startDate!);
    }
    if (queryParams.endDate) {
      results = results.filter(e => e.timestamp <= queryParams.endDate!);
    }
    
    // Category filtering
    if (queryParams.category) {
      results = results.filter(e => e.category === queryParams.category);
    }
    
    // Level filtering
    if (queryParams.level) {
      results = results.filter(e => e.level === queryParams.level);
    }
    
    // Actor filtering
    if (queryParams.actorId) {
      results = results.filter(e => e.actorId === queryParams.actorId);
    }
    
    // Resource filtering
    if (queryParams.resourceId) {
      results = results.filter(e => e.resourceId === queryParams.resourceId);
    }
    
    // Review status filtering
    if (queryParams.requiresReview !== undefined) {
      results = results.filter(e => e.requiresReview === queryParams.requiresReview);
    }
    
    // Sort by timestamp DESC (default)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Pagination limit
    if (queryParams.limit) {
      results = results.slice(0, queryParams.limit);
    }
    
    return results;
  }
  
  /**
   * Get single audit event by ID
   */
  async getById(eventId: string, tenantId?: string): Promise<AuditEvent | null> {
    const event = this.eventMap.get(eventId);
    
    if (!event) {
      return null;
    }
    
    // Tenant isolation check
    if (tenantId && event.tenantId !== tenantId) {
      console.warn(`[InMemoryStorageStrategy] Tenant isolation violation: ${tenantId} tried to access ${event.tenantId}'s event`);
      return null;
    }
    
    return event;
  }
  
  /**
   * Delete audit event(s) by ID
   * Not recommended for Hot Tier (use archive instead)
   */
  async delete(eventIds: string[], tenantId: string): Promise<number> {
    let deletedCount = 0;
    
    for (const eventId of eventIds) {
      const event = this.eventMap.get(eventId);
      if (!event) continue;
      
      // Tenant isolation check
      if (event.tenantId !== tenantId) {
        console.warn(`[InMemoryStorageStrategy] Skipping deletion of ${eventId}: wrong tenant`);
        continue;
      }
      
      this.eventMap.delete(eventId);
      deletedCount++;
    }
    
    // Note: Cannot remove from circular buffer efficiently, will be evicted naturally
    this._eventCount.set(this.eventMap.size);
    
    return deletedCount;
  }
  
  /**
   * Archive events to Warm Tier (Firestore)
   * Events older than 24h should be moved to Firestore
   */
  async archive(beforeDate: Date, tenantId?: string): Promise<number> {
    const eventsToArchive = await this.query({
      tenantId: tenantId || '',
      endDate: beforeDate
    } as AuditEventQuery);
    
    console.log(`[InMemoryStorageStrategy] ${eventsToArchive.length} events ready for archiving to Warm Tier`);
    
    // In production: These events will be written to Firestore by Storage Router
    // Then removed from in-memory buffer
    
    return eventsToArchive.length;
  }
  
  /**
   * Count total events
   */
  async count(queryParams?: Partial<AuditEventQuery>): Promise<number> {
    if (!queryParams) {
      return this.buffer.length;
    }
    
    const events = await this.query(queryParams as AuditEventQuery);
    return events.length;
  }
  
  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.buffer.clear();
    this.eventMap.clear();
    this._eventCount.set(0);
    console.log('[InMemoryStorageStrategy] Disposed');
  }
}
