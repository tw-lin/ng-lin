/**
 * Storage Strategy Interface
 * 
 * Abstraction layer for multi-tier audit log storage
 * - Supports Hot Tier (In-Memory/Redis), Warm Tier (Firestore), Cold Tier (Cloud Storage)
 * - Enables flexible storage implementation
 * - Follows docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md specifications
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 * @phase Phase 1 (P0 - Critical)
 */

import { AuditEvent, AuditEventQuery } from '../models/audit-event.model';

/**
 * Storage Tier Enum
 * 
 * Defines storage tier levels for audit log retention policy
 */
export enum StorageTier {
  /** Hot Tier: In-Memory/Redis (24h retention, real-time queries) */
  HOT = 'hot',
  
  /** Warm Tier: Firestore (90d retention, general queries & export) */
  WARM = 'warm',
  
  /** Cold Tier: Cloud Storage (7y retention, compliance archiving) */
  COLD = 'cold'
}

/**
 * Storage Strategy Configuration
 */
export interface StorageStrategyConfig {
  /** Storage tier type */
  tier: StorageTier;
  
  /** Retention period in days */
  retentionDays: number;
  
  /** Enable automatic tiering/archiving */
  autoTiering: boolean;
  
  /** Batch write size for optimization */
  batchSize: number;
  
  /** Enable compression for storage efficiency */
  compression: boolean;
}

/**
 * Batch Write Result
 */
export interface BatchWriteResult {
  /** Number of successful writes */
  success: number;
  
  /** Number of failed writes */
  failed: number;
  
  /** Error messages for failed writes */
  errors: string[];
  
  /** Total time taken (ms) */
  durationMs: number;
}

/**
 * Storage Strategy Interface
 * 
 * Abstract interface for audit log storage implementations
 * Supports hot/warm/cold tier storage with automatic tiering
 */
export interface IStorageStrategy {
  /**
   * Storage tier type
   */
  readonly tier: StorageTier;
  
  /**
   * Storage configuration
   */
  readonly config: StorageStrategyConfig;
  
  /**
   * Write single audit event to storage
   * 
   * @param event - Audit event to store
   * @returns Promise resolving to event ID
   */
  write(event: AuditEvent): Promise<string>;
  
  /**
   * Batch write multiple audit events
   * Optimized for bulk operations
   * 
   * @param events - Array of audit events to store
   * @returns Promise resolving to batch write result
   */
  writeBatch(events: AuditEvent[]): Promise<BatchWriteResult>;
  
  /**
   * Query audit events with filters
   * 
   * @param query - Query parameters (tenant, time range, category, level, etc.)
   * @returns Promise resolving to array of audit events
   */
  query(query: AuditEventQuery): Promise<AuditEvent[]>;
  
  /**
   * Get single audit event by ID
   * 
   * @param eventId - Unique audit event ID
   * @param tenantId - Tenant ID for isolation (optional for superadmin)
   * @returns Promise resolving to audit event or null
   */
  getById(eventId: string, tenantId?: string): Promise<AuditEvent | null>;
  
  /**
   * Delete audit event(s) by ID
   * Typically used for data retention compliance
   * 
   * @param eventIds - Array of event IDs to delete
   * @param tenantId - Tenant ID for isolation
   * @returns Promise resolving to number of deleted events
   */
  delete(eventIds: string[], tenantId: string): Promise<number>;
  
  /**
   * Archive events to next tier
   * Hot → Warm → Cold
   * 
   * @param beforeDate - Archive events before this date
   * @param tenantId - Tenant ID for isolation (optional)
   * @returns Promise resolving to number of archived events
   */
  archive(beforeDate: Date, tenantId?: string): Promise<number>;
  
  /**
   * Count total events (for statistics)
   * 
   * @param query - Optional query for filtered count
   * @returns Promise resolving to event count
   */
  count(query?: Partial<AuditEventQuery>): Promise<number>;
  
  /**
   * Initialize storage (create indexes, setup collections, etc.)
   * 
   * @returns Promise resolving when initialization complete
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup/dispose storage resources
   * 
   * @returns Promise resolving when cleanup complete
   */
  dispose(): Promise<void>;
}

/**
 * Storage Strategy Factory Interface
 * 
 * Factory for creating appropriate storage strategy based on tier
 */
export interface IStorageStrategyFactory {
  /**
   * Create storage strategy for specified tier
   * 
   * @param tier - Storage tier type
   * @param config - Optional configuration overrides
   * @returns Storage strategy instance
   */
  create(tier: StorageTier, config?: Partial<StorageStrategyConfig>): IStorageStrategy;
  
  /**
   * Get current active storage strategies
   * 
   * @returns Map of tier to strategy instance
   */
  getActiveStrategies(): Map<StorageTier, IStorageStrategy>;
}
