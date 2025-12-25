import { DomainEvent } from '../models';

/**
 * Event Criteria
 *
 * Criteria for querying events from the event store
 */
export interface EventCriteria {
  /** Filter by event type */
  eventType?: string;

  /** Filter by aggregate ID */
  aggregateId?: string;

  /** Filter by aggregate type */
  aggregateType?: string;

  /** Filter events after this timestamp */
  since?: Date;

  /** Filter events before this timestamp */
  until?: Date;

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort order */
  order?: 'asc' | 'desc';
}

/**
 * Event Store Interface
 *
 * Defines the contract for event persistence.
 * Events are stored for audit trails, event sourcing, and replay capabilities.
 */
export interface IEventStore {
  /**
   * Append a single event to the store
   *
   * @param event The domain event to append
   * @returns Promise that resolves when event is stored
   */
  append(event: DomainEvent): Promise<void>;

  /**
   * Append multiple events in a batch
   *
   * @param events Array of domain events to append
   * @returns Promise that resolves when all events are stored
   */
  appendBatch(events: DomainEvent[]): Promise<void>;

  /**
   * Get events matching the criteria
   *
   * @param criteria Query criteria
   * @returns Promise that resolves to array of events
   */
  getEvents(criteria: EventCriteria): Promise<DomainEvent[]>;

  /**
   * Get all events for a specific aggregate
   *
   * @param aggregateId The aggregate ID
   * @param aggregateType The aggregate type
   * @returns Promise that resolves to array of events
   */
  getEventsByAggregate(aggregateId: string, aggregateType: string): Promise<DomainEvent[]>;

  /**
   * Get events since a specific timestamp
   *
   * @param timestamp The timestamp to query from
   * @returns Promise that resolves to array of events
   */
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;

  /**
   * Clear all events (mainly for testing)
   *
   * @returns Promise that resolves when store is cleared
   */
  clear(): Promise<void>;
}
