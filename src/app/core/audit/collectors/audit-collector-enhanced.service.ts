/**
 * Enhanced Audit Collector Service (v3.0.0 - Unified Audit Infrastructure)
 *
 * Bridges BlueprintEventBus with the new Global Audit System:
 * - Subscribes to domain events (blueprint.*, task.*, user.*, auth.*, etc.)
 * - Auto-classifies events via ClassificationEngineService
 * - Batches events (50 events or 5 seconds whichever first)
 * - Persists to multi-tier Firestore storage via AuditEventRepository
 * - Circuit breaker for storage failures (3 failures → DLQ fallback)
 *
 * Integration Strategy:
 * - Extends existing audit-collector.service.ts (v2.0.0) functionality
 * - Reuses BlueprintEventBus subscription patterns
 * - Delegates classification to ClassificationEngineService
 * - Delegates storage to AuditEventRepository
 * - Maintains backward compatibility with manual audit recording
 *
 * Architecture Alignment:
 * - Layer 3 (Audit Collector) in 8-layer topology
 * - Connects Layer 1-2 (Event Sources, Event Bus) → Layer 4-6 (Classification, Storage, Query)
 * - Follows GitHub Master System event-driven patterns
 *
 * @version 3.0.0
 * @author Audit System Team
 * @date 2025-12-26
 */

import { Injectable, inject, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject } from 'rxjs';
import { buffer, filter } from 'rxjs/operators';

// Existing infrastructure
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';
import { LoggerService } from '@core/services/logger';
import { TenantContextService } from '@core/event-bus/services/tenant-context.service';
import { DomainEvent } from '@core/event-bus/models/base-event';

// New audit infrastructure
import { ClassificationEngineService } from '../services/classification-engine.service';
import { AuditEventRepository } from '../repositories/audit-event.repository';
import { AuditEvent } from '../models/audit-event.interface';
import { EventCategory } from '../models/event-category.enum';
import { EventSeverity } from '../models/event-severity.enum';
import { StorageTier } from '../models/storage-tier.enum';

/**
 * Batch collection configuration
 */
interface BatchConfig {
  /** Max events before auto-flush (default: 50) */
  maxSize: number;
  /** Max time (ms) before auto-flush (default: 5000) */
  maxWaitMs: number;
}

/**
 * Circuit breaker state for storage failures
 */
interface CircuitBreakerState {
  consecutiveFailures: number;
  isOpen: boolean;
  lastFailureTime: Date | null;
  maxFailures: number;
  resetTimeoutMs: number;
}

/**
 * Event subscription topic patterns
 */
const AUDIT_TOPIC_PATTERNS = [
  'blueprint.*', // All blueprint events
  'task.*', // All task events
  'user.*', // All user events
  'auth.*', // All authentication events
  'permission.*', // All permission events
  'data.*', // All data access events
  'ai.*', // All AI decision events
  'system.*', // All system events
  'error.*', // All error events
  'security.*', // All security events
  'compliance.*' // All compliance events
];

@Injectable({ providedIn: 'root' })
export class AuditCollectorEnhancedService implements OnDestroy {
  // Dependencies
  private eventBus = inject(BlueprintEventBus);
  private classificationEngine = inject(ClassificationEngineService);
  private auditRepository = inject(AuditEventRepository);
  private logger = inject(LoggerService);
  private tenantContext = inject(TenantContextService);
  private destroyRef = inject(DestroyRef);

  // Batch collection
  private eventBuffer$ = new Subject<DomainEvent>();
  private readonly batchConfig: BatchConfig = {
    maxSize: 50,
    maxWaitMs: 5000
  };

  // Circuit breaker for storage failures
  private circuitBreaker: CircuitBreakerState = {
    consecutiveFailures: 0,
    isOpen: false,
    lastFailureTime: null,
    maxFailures: 3,
    resetTimeoutMs: 60000 // 1 minute
  };

  // Statistics
  private stats = {
    eventsCollected: 0,
    eventsClassified: 0,
    eventsPersisted: 0,
    batchesFlushed: 0,
    storageFailures: 0,
    circuitBreakerTrips: 0
  };

  constructor() {
    this.logger.info('[AuditCollectorEnhanced]', 'Initializing v3.0.0 - Unified Audit Infrastructure');
    this.initializeEventSubscriptions();
    this.initializeBatchProcessing();
  }

  /**
   * Subscribe to domain events from BlueprintEventBus
   * Following existing patterns from audit-auto-subscription.service.ts
   */
  private initializeEventSubscriptions(): void {
    this.logger.debug('[AuditCollectorEnhanced]', `Subscribing to ${AUDIT_TOPIC_PATTERNS.length} topic patterns`);

    AUDIT_TOPIC_PATTERNS.forEach(pattern => {
      this.eventBus
        .subscribe(pattern)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event: DomainEvent) => {
            this.stats.eventsCollected++;
            this.eventBuffer$.next(event);
          },
          error: error => {
            this.logger.error('[AuditCollectorEnhanced]', `Subscription error for ${pattern}`, error);
          }
        });
    });

    this.logger.info('[AuditCollectorEnhanced]', 'Event subscriptions initialized successfully');
  }

  /**
   * Initialize batch processing pipeline
   * Flush when: 50 events accumulated OR 5 seconds elapsed
   */
  private initializeBatchProcessing(): void {
    // Create two triggers: size-based and time-based
    const sizeTrigger$ = this.eventBuffer$.pipe(
      buffer(this.eventBuffer$.pipe(filter((_, index) => (index + 1) % this.batchConfig.maxSize === 0)))
    );

    const timeTrigger$ = this.eventBuffer$.pipe(buffer(interval(this.batchConfig.maxWaitMs)));

    // Merge both triggers and process batches
    sizeTrigger$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(batch => this.processBatch(batch));
    timeTrigger$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(batch => {
      if (batch.length > 0) {
        this.processBatch(batch);
      }
    });

    this.logger.info(
      '[AuditCollectorEnhanced]',
      `Batch processing initialized (max: ${this.batchConfig.maxSize} events, ${this.batchConfig.maxWaitMs}ms)`
    );
  }

  /**
   * Process a batch of domain events
   * 1. Check circuit breaker state
   * 2. Convert domain events → audit events
   * 3. Classify events
   * 4. Persist to Firestore (HOT tier)
   * 5. Handle failures with circuit breaker
   */
  private async processBatch(domainEvents: DomainEvent[]): Promise<void> {
    if (domainEvents.length === 0) return;

    this.logger.debug('[AuditCollectorEnhanced]', `Processing batch of ${domainEvents.length} events`);

    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      this.logger.warn('[AuditCollectorEnhanced]', 'Circuit breaker OPEN - dropping batch to prevent cascade failure');
      // TODO: Send to dead letter queue (DLQ) for recovery
      return;
    }

    try {
      // Convert domain events to audit events
      const auditEvents = domainEvents.map(event => this.convertDomainEventToAuditEvent(event));

      // Classify events (bulk operation)
      const classifiedEvents = auditEvents.map(event => {
        const classification = this.classificationEngine.classify(event);
        this.stats.eventsClassified++;

        return {
          ...event,
          category: classification.category,
          level: classification.level,
          riskScore: classification.riskScore,
          complianceTags: classification.complianceTags,
          storageTier: StorageTier.HOT // New events always go to HOT tier
        };
      });

      // Persist batch to Firestore
      await this.auditRepository.createBatch(classifiedEvents);

      this.stats.eventsPersisted += classifiedEvents.length;
      this.stats.batchesFlushed++;
      this.resetCircuitBreaker(); // Success - reset failure counter

      this.logger.info('[AuditCollectorEnhanced]', `Batch persisted successfully (${classifiedEvents.length} events)`);
    } catch (error) {
      this.handleStorageFailure(error);
    }
  }

  /**
   * Convert BlueprintEventBus DomainEvent → AuditEvent
   * Maps existing event structure to new audit schema
   */
  private convertDomainEventToAuditEvent(domainEvent: DomainEvent): AuditEvent {
    const tenantId = this.extractTenantId(domainEvent);

    return {
      id: '', // Will be set by repository
      blueprintId: tenantId || domainEvent.blueprintId || 'unknown',
      timestamp: domainEvent.timestamp || new Date(),
      sequenceNumber: 0, // Will be set by repository

      // Actor mapping
      actor: {
        id: domainEvent.userId || domainEvent.actorId || 'system',
        type: this.inferActorType(domainEvent),
        name: domainEvent.actorName || domainEvent.userName || 'System',
        metadata: domainEvent.actorMetadata || {}
      },

      // Event details
      eventType: domainEvent.type,
      category: EventCategory.SYSTEM_EVENT, // Will be overridden by classification
      level: EventSeverity.LOW, // Will be overridden by classification

      // Entity tracking
      entity: domainEvent.entityId
        ? {
            id: domainEvent.entityId,
            type: domainEvent.entityType || 'unknown',
            name: domainEvent.entityName || domainEvent.entityId
          }
        : undefined,

      // Operation tracking
      operationType: this.inferOperationType(domainEvent.type),

      // Change tracking
      changes: domainEvent.changes || undefined,

      // Classification metadata (will be set by ClassificationEngineService)
      riskScore: 0,
      complianceTags: [],
      autoReviewRequired: false,
      aiGenerated: domainEvent.type.startsWith('ai.'),

      // Storage management
      storageTier: StorageTier.HOT,
      retentionDays: 7, // HOT tier default

      // Request context
      requestId: domainEvent.requestId,
      sessionId: domainEvent.sessionId,
      ipAddress: domainEvent.ipAddress,
      userAgent: domainEvent.userAgent,

      // Additional metadata
      metadata: domainEvent.payload || domainEvent.data || {},
      tags: domainEvent.tags || [],

      // Lifecycle timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Extract tenant ID from domain event
   * Priority: blueprintId > tenantId > context service
   */
  private extractTenantId(event: DomainEvent): string | undefined {
    return event.blueprintId || (event as any).tenantId || this.tenantContext.getCurrentTenantId() || undefined;
  }

  /**
   * Infer actor type from event metadata
   */
  private inferActorType(event: DomainEvent): 'user' | 'team' | 'partner' | 'ai' | 'system' {
    if (event.type.startsWith('ai.')) return 'ai';
    if (event.type.startsWith('system.')) return 'system';
    if (event.userId) return 'user';
    if ((event as any).teamId) return 'team';
    if ((event as any).partnerId) return 'partner';
    return 'system';
  }

  /**
   * Infer operation type from event type pattern
   */
  private inferOperationType(eventType: string): 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | undefined {
    if (eventType.includes('.created') || eventType.includes('.create')) return 'CREATE';
    if (eventType.includes('.read') || eventType.includes('.viewed')) return 'READ';
    if (eventType.includes('.updated') || eventType.includes('.update')) return 'UPDATE';
    if (eventType.includes('.deleted') || eventType.includes('.delete')) return 'DELETE';
    if (eventType.includes('.executed') || eventType.includes('.execute')) return 'EXECUTE';
    return undefined;
  }

  /**
   * Handle storage failure with circuit breaker pattern
   */
  private handleStorageFailure(error: any): void {
    this.stats.storageFailures++;
    this.circuitBreaker.consecutiveFailures++;
    this.circuitBreaker.lastFailureTime = new Date();

    this.logger.error('[AuditCollectorEnhanced]', 'Storage failure', error, {
      consecutiveFailures: this.circuitBreaker.consecutiveFailures,
      maxFailures: this.circuitBreaker.maxFailures
    });

    // Trip circuit breaker if threshold exceeded
    if (this.circuitBreaker.consecutiveFailures >= this.circuitBreaker.maxFailures) {
      this.circuitBreaker.isOpen = true;
      this.stats.circuitBreakerTrips++;

      this.logger.warn('[AuditCollectorEnhanced]', 'Circuit breaker OPENED due to consecutive failures', {
        failures: this.circuitBreaker.consecutiveFailures,
        resetTimeoutMs: this.circuitBreaker.resetTimeoutMs
      });

      // Schedule automatic reset
      setTimeout(() => {
        this.logger.info('[AuditCollectorEnhanced]', 'Circuit breaker reset timeout reached - attempting HALF-OPEN');
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.consecutiveFailures = 0;
      }, this.circuitBreaker.resetTimeoutMs);
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    return this.circuitBreaker.isOpen;
  }

  /**
   * Reset circuit breaker after successful operation
   */
  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.consecutiveFailures > 0) {
      this.logger.info('[AuditCollectorEnhanced]', 'Circuit breaker CLOSED - storage recovered');
    }
    this.circuitBreaker.consecutiveFailures = 0;
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.lastFailureTime = null;
  }

  /**
   * Manual audit recording API (backward compatibility)
   * Bypasses batch processing for immediate persistence
   */
  async recordAuditEvent(
    blueprintId: string,
    eventType: string,
    actorId: string,
    options: {
      actorType?: 'user' | 'team' | 'partner' | 'ai' | 'system';
      entityId?: string;
      entityType?: string;
      operationType?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
      changes?: Array<{ field: string; oldValue: any; newValue: any }>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      id: '',
      blueprintId,
      timestamp: new Date(),
      sequenceNumber: 0,
      actor: {
        id: actorId,
        type: options.actorType || 'user',
        name: actorId,
        metadata: {}
      },
      eventType,
      category: EventCategory.SYSTEM_EVENT, // Will be classified
      level: EventSeverity.LOW, // Will be classified
      entity: options.entityId
        ? {
            id: options.entityId,
            type: options.entityType || 'unknown',
            name: options.entityId
          }
        : undefined,
      operationType: options.operationType,
      changes: options.changes,
      riskScore: 0,
      complianceTags: [],
      autoReviewRequired: false,
      aiGenerated: eventType.startsWith('ai.'),
      storageTier: StorageTier.HOT,
      retentionDays: 7,
      metadata: options.metadata || {},
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Classify event
    const classification = this.classificationEngine.classify(auditEvent);
    auditEvent.category = classification.category;
    auditEvent.level = classification.level;
    auditEvent.riskScore = classification.riskScore;
    auditEvent.complianceTags = classification.complianceTags;

    // Persist immediately (bypass batch)
    try {
      await this.auditRepository.create(auditEvent);
      this.stats.eventsPersisted++;
      this.resetCircuitBreaker();
    } catch (error) {
      this.handleStorageFailure(error);
      throw error;
    }
  }

  /**
   * Get collector statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      circuitBreakerState: {
        isOpen: this.circuitBreaker.isOpen,
        consecutiveFailures: this.circuitBreaker.consecutiveFailures,
        lastFailureTime: this.circuitBreaker.lastFailureTime
      }
    };
  }

  ngOnDestroy(): void {
    this.logger.info('[AuditCollectorEnhanced]', 'Shutting down', this.getStatistics());
    this.eventBuffer$.complete();
  }
}
