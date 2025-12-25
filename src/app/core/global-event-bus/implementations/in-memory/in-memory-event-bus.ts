import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, Subject, filter, tap } from 'rxjs';

import { IEventBus, IEventStore } from '../../interfaces';
import { DomainEvent, EventHandler, SubscribeOptions, Subscription, RetryPolicy } from '../../models';
import { TenantValidationMiddleware } from '../../services/tenant-validation-middleware.service';
import { HybridEventStore } from '../hybrid/hybrid-event-store';

/**
 * In-Memory Event Bus (with Firestore Persistence)
 *
 * RxJS and Signals-based event bus implementation with:
 * - Hybrid storage (in-memory cache + Firestore persistence)
 * - Tenant isolation middleware (validates tenant_id on all events)
 * - GitHub-style event sourcing (all events persisted)
 *
 * Storage Strategy:
 * - Write: Both in-memory (cache) and Firestore (persistence)
 * - Read: In-memory first (fast), Firestore fallback (complete)
 * - Cache: Recent 1000 events in memory (24h warmup)
 *
 * Features:
 * - Reactive event streaming with RxJS
 * - Automatic retry with exponential backoff
 * - Event persistence via HybridEventStore
 * - Declarative subscriptions with Signals
 * - Tenant isolation middleware (validates tenant_id on all events)
 *
 * Tenant Isolation:
 * - All events must have tenant_id in metadata
 * - Auto-injection from TenantContextService if missing
 * - Events without tenant context are rejected
 * - Superadmin can bypass with allowCrossTenant flag
 *
 * Follows:
 * - docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Event sourcing)
 * - docs/⭐️/⭐️⭐️⭐️⭐️⭐️ROLE.md (GitHub alignment - persist all events)
 *
 * @phase Phase 1.5 (Blocker Fix) - Firestore Event Persistence
 */
@Injectable({
  providedIn: 'root'
})
export class InMemoryEventBus implements IEventBus {
  private readonly eventStore = inject(HybridEventStore);
  private readonly tenantMiddleware = inject(TenantValidationMiddleware);

  /** Main event stream */
  private readonly eventStream$ = new Subject<DomainEvent>();

  /** Map of event type to handlers */
  private readonly handlers = new Map<string, Set<EventHandler>>();

  /** Active subscriptions */
  private readonly activeSubscriptions = signal<Subscription[]>([]);

  /** Total events published */
  private readonly eventsPublished = signal(0);

  /** Computed: number of active subscriptions */
  readonly subscriptionCount = computed(() => this.activeSubscriptions().length);

  /** Computed: total events published */
  readonly totalEvents = computed(() => this.eventsPublished());

  /**
   * Publish a single event to the bus
   *
   * Tenant Isolation:
   * - Validates and enriches event with tenant_id before publishing
   * - Auto-injects tenant_id from TenantContextService if missing
   * - Rejects events without tenant context
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // 0. Validate and enrich with tenant_id (MANDATORY)
      const enrichedEvent = this.tenantMiddleware.validateAndEnrich(event);

      // 1. Persist event to store
      await this.eventStore.append(enrichedEvent);

      // 2. Emit to stream
      this.eventStream$.next(enrichedEvent);

      // 3. Execute handlers
      await this.executeHandlers(enrichedEvent);

      // 4. Update metrics
      this.eventsPublished.update(count => count + 1);
    } catch (error) {
      console.error(`[EventBus] Error publishing event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * Publish multiple events in a batch
   *
   * Tenant Isolation:
   * - Validates and enriches all events with tenant_id before publishing
   * - Batch validation is atomic (all or nothing)
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    try {
      // 0. Validate and enrich ALL events with tenant_id (MANDATORY)
      const enrichedEvents = this.tenantMiddleware.validateAndEnrichBatch(events);

      // 1. Persist all events
      await this.eventStore.appendBatch(enrichedEvents);

      // 2. Emit and execute in sequence
      for (const event of enrichedEvents) {
        this.eventStream$.next(event);
        await this.executeHandlers(event);
      }

      // 3. Update metrics
      this.eventsPublished.update(count => count + events.length);
    } catch (error) {
      console.error('[EventBus] Error publishing batch:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events of a specific type
   */
  async subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions): Promise<Subscription> {
    // Wrap handler with retry logic if needed
    const wrappedHandler = options?.retryPolicy ? this.wrapWithRetry(handler, options.retryPolicy) : handler;

    // Wrap with filter if provided
    const finalHandler = options?.filter
      ? async (event: DomainEvent) => {
          if (options.filter!(event)) {
            await wrappedHandler(event as T);
          }
        }
      : wrappedHandler;

    // Add to handlers map
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(finalHandler as EventHandler);

    // Create subscription object
    const subscription: Subscription = {
      eventType,
      handler: finalHandler as EventHandler,
      id: this.generateSubscriptionId(),
      unsubscribe: () => this.unsubscribe(subscription)
    };

    // Track subscription
    this.activeSubscriptions.update(subs => [...subs, subscription]);

    return subscription;
  }

  /**
   * Unsubscribe from an event subscription
   */
  async unsubscribe(subscription: Subscription): Promise<void> {
    const handlers = this.handlers.get(subscription.eventType);
    if (handlers) {
      handlers.delete(subscription.handler);

      // Clean up empty handler sets
      if (handlers.size === 0) {
        this.handlers.delete(subscription.eventType);
      }
    }

    // Remove from active subscriptions
    this.activeSubscriptions.update(subs => subs.filter(s => s.id !== subscription.id));
  }

  /**
   * Get an observable stream of events for a specific type
   */
  observe<T extends DomainEvent>(eventType: string): Observable<T> {
    return this.eventStream$.pipe(
      filter((event): event is T => event.eventType === eventType),
      tap(event => console.debug(`[EventBus] Event observed: ${event.eventType}`))
    );
  }

  /**
   * Get an observable stream of all events
   */
  observeAll(): Observable<DomainEvent> {
    return this.eventStream$.asObservable();
  }

  /**
   * Execute all handlers for an event
   */
  private async executeHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? new Set();

    // Execute all handlers in parallel
    const executions = Array.from(handlers).map(handler => this.safeExecute(handler, event));

    await Promise.all(executions);
  }

  /**
   * Safely execute a handler with error handling
   */
  private async safeExecute(handler: EventHandler, event: DomainEvent): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[EventBus] Handler error for ${event.eventType}:`, error);
      // Don't re-throw - we don't want one handler failure to affect others
    }
  }

  /**
   * Wrap a handler with retry logic
   */
  private wrapWithRetry<T extends DomainEvent>(handler: EventHandler<T>, policy: RetryPolicy): EventHandler<T> {
    return async (event: T) => {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
        try {
          await handler(event);
          return; // Success
        } catch (error) {
          lastError = error as Error;

          // If not the last attempt, wait before retrying
          if (attempt < policy.maxAttempts - 1) {
            const delay = this.calculateDelay(attempt, policy);
            await this.sleep(delay);
          }
        }
      }

      // All retries failed
      throw lastError;
    };
  }

  /**
   * Calculate delay for retry based on policy
   */
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoff) {
      case 'exponential':
        return Math.min(policy.initialDelay * Math.pow(2, attempt), policy.maxDelay ?? Infinity);
      case 'linear':
        return policy.initialDelay * (attempt + 1);
      case 'fixed':
        return policy.initialDelay;
    }
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique subscription ID
   */
  private generateSubscriptionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `sub_${timestamp}_${random}`;
  }

  /**
   * Dispose of the event bus (cleanup)
   */
  dispose(): void {
    this.eventStream$.complete();
    this.handlers.clear();
    this.activeSubscriptions.set([]);
  }
}
