import { Injectable, signal, computed } from '@angular/core';
import { EventEnvelope } from '../models/event-envelope';
import { DomainEvent } from '../models/base-event';

/**
 * Dead Letter Queue Service
 *
 * Responsibilities:
 * - Store failed events that exhausted all retry attempts
 * - Provide query interface for failed events
 * - Support manual retry of failed events
 * - Track failure statistics and patterns
 * - Enable failure analysis and debugging
 *
 * Dead Letter Queue is crucial for:
 * - Preventing data loss
 * - Debugging production issues
 * - Manual intervention for critical events
 * - Failure pattern analysis
 *
 * @example
 * ```typescript
 * const dlq = inject(DeadLetterQueueService);
 *
 * // Send failed event
 * await dlq.send(failedEnvelope);
 *
 * // Get failed events
 * const failed = await dlq.getFailedEvents();
 *
 * // Retry specific event
 * await dlq.retry('event-123');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DeadLetterQueueService {
  /**
   * In-memory storage for failed events
   * In production, this should be backed by persistent storage (Firestore, PostgreSQL, etc.)
   */
  private readonly failedEvents = signal<Map<string, EventEnvelope>>(new Map());

  /**
   * Signal-based computed metrics
   */
  readonly totalFailedEvents = computed(() => this.failedEvents().size);
  readonly failedEventTypes = computed(() => {
    const types = new Map<string, number>();
    for (const envelope of this.failedEvents().values()) {
      const eventType = envelope.event.eventType;
      types.set(eventType, (types.get(eventType) ?? 0) + 1);
    }
    return types;
  });

  /**
   * Send failed event to dead letter queue
   *
   * @param envelope - Event envelope containing the failed event
   */
  async send(envelope: EventEnvelope): Promise<void> {
    const eventId = envelope.event.eventId;

    // Update signal immutably
    this.failedEvents.update(current => {
      const next = new Map(current);
      next.set(eventId, envelope);
      return next;
    });

    console.error(
      `[DeadLetterQueue] Event ${eventId} (${envelope.event.eventType}) sent to DLQ after ${envelope.retryCount} attempts`,
      {
        eventId,
        eventType: envelope.event.eventType,
        retryCount: envelope.retryCount,
        lastError: envelope.error?.message,
      }
    );
  }

  /**
   * Get all failed events
   *
   * @param filter - Optional filter criteria
   * @returns Array of failed event envelopes
   */
  async getFailedEvents(filter?: {
    eventType?: string;
    since?: Date;
    limit?: number;
  }): Promise<EventEnvelope[]> {
    let events = Array.from(this.failedEvents().values());

    // Apply filters
    if (filter?.eventType) {
      events = events.filter(e => e.event.eventType === filter.eventType);
    }

    if (filter?.since) {
      events = events.filter(
        e => e.lastAttempt && e.lastAttempt >= filter.since!
      );
    }

    // Sort by last attempt (most recent first)
    events.sort((a, b) => {
      const timeA = a.lastAttempt?.getTime() ?? 0;
      const timeB = b.lastAttempt?.getTime() ?? 0;
      return timeB - timeA;
    });

    // Apply limit
    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Get a specific failed event by ID
   *
   * @param eventId - The event ID
   * @returns Event envelope or undefined if not found
   */
  async getFailedEvent(eventId: string): Promise<EventEnvelope | undefined> {
    return this.failedEvents().get(eventId);
  }

  /**
   * Retry a failed event
   *
   * Removes event from DLQ and returns it for reprocessing.
   * The caller is responsible for republishing the event.
   *
   * @param eventId - The event ID to retry
   * @returns Event envelope for reprocessing
   * @throws Error if event not found in DLQ
   */
  async retry(eventId: string): Promise<EventEnvelope> {
    const envelope = this.failedEvents().get(eventId);

    if (!envelope) {
      throw new Error(`Event ${eventId} not found in dead letter queue`);
    }

    // Remove from DLQ
    this.failedEvents.update(current => {
      const next = new Map(current);
      next.delete(eventId);
      return next;
    });

    // Create a new envelope with reset retry count for fresh retry
    const freshEnvelope = new EventEnvelope({
      event: envelope.event,
      retryCount: 0,
      error: undefined,
      lastAttempt: undefined,
      createdAt: envelope.createdAt,
      isDeadLetter: false
    });

    console.info(
      `[DeadLetterQueue] Event ${eventId} removed from DLQ for retry`
    );

    return freshEnvelope;
  }

  /**
   * Retry all failed events of a specific type
   *
   * @param eventType - The event type to retry
   * @returns Array of event envelopes for reprocessing
   */
  async retryByType(eventType: string): Promise<EventEnvelope[]> {
    const toRetry = Array.from(this.failedEvents().values()).filter(
      e => e.event.eventType === eventType
    );

    // Remove from DLQ
    this.failedEvents.update(current => {
      const next = new Map(current);
      for (const envelope of toRetry) {
        next.delete(envelope.event.eventId);
      }
      return next;
    });
    
    // Create fresh envelopes with reset retry count
    const freshEnvelopes: EventEnvelope[] = toRetry.map(envelope => 
      new EventEnvelope({
        event: envelope.event,
        retryCount: 0,
        error: undefined,
        lastAttempt: undefined,
        createdAt: envelope.createdAt,
        isDeadLetter: false
      })
    );

    console.info(
      `[DeadLetterQueue] ${freshEnvelopes.length} events of type ${eventType} removed from DLQ for retry`
    );

    return freshEnvelopes;
  }

  /**
   * Permanently delete a failed event from DLQ
   *
   * Use with caution - this is permanent data loss
   *
   * @param eventId - The event ID to delete
   */
  async delete(eventId: string): Promise<void> {
    this.failedEvents.update(current => {
      const next = new Map(current);
      next.delete(eventId);
      return next;
    });

    console.warn(`[DeadLetterQueue] Event ${eventId} permanently deleted from DLQ`);
  }

  /**
   * Clear all failed events from DLQ
   *
   * Use with extreme caution - this is permanent data loss for all events
   */
  async clear(): Promise<void> {
    const count = this.failedEvents().size;
    this.failedEvents.set(new Map());

    console.warn(`[DeadLetterQueue] Cleared ${count} events from DLQ`);
  }

  /**
   * Get failure statistics
   *
   * @returns Statistics about failed events
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Map<string, number>;
    oldestFailure: Date | null;
    newestFailure: Date | null;
  }> {
    const events = Array.from(this.failedEvents().values());

    let oldestFailure: Date | null = null;
    let newestFailure: Date | null = null;

    for (const envelope of events) {
      if (envelope.lastAttempt) {
        if (!oldestFailure || envelope.lastAttempt < oldestFailure) {
          oldestFailure = envelope.lastAttempt;
        }
        if (!newestFailure || envelope.lastAttempt > newestFailure) {
          newestFailure = envelope.lastAttempt;
        }
      }
    }

    return {
      total: this.totalFailedEvents(),
      byType: this.failedEventTypes(),
      oldestFailure,
      newestFailure,
    };
  }

  /**
   * Export failed events for analysis
   *
   * @returns Array of simplified failed event records
   */
  async export(): Promise<
    Array<{
      eventId: string;
      eventType: string;
      retryCount: number;
      lastAttempt: Date | null;
      error: string | null;
      payload: unknown;
    }>
  > {
    const events = Array.from(this.failedEvents().values());

    return events.map(envelope => ({
      eventId: envelope.event.eventId,
      eventType: envelope.event.eventType,
      retryCount: envelope.retryCount,
      lastAttempt: envelope.lastAttempt ?? null,
      error: envelope.error?.message ?? null,
      payload: envelope.event.payload,
    }));
  }
}
