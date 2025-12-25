import { Observable } from 'rxjs';

import { DomainEvent, EventHandler, SubscribeOptions, Subscription } from '../models';

/**
 * Event Bus Interface
 *
 * Defines the contract for event bus implementations.
 * This abstraction allows for different implementations (in-memory, Kafka, RabbitMQ, etc.)
 */
export interface IEventBus {
  /**
   * Publish a single event to the bus
   *
   * @param event The domain event to publish
   * @returns Promise that resolves when event is published
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple events in a batch
   *
   * @param events Array of domain events to publish
   * @returns Promise that resolves when all events are published
   */
  publishBatch(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe to events of a specific type
   *
   * @param eventType The type of event to subscribe to (e.g., 'issues.opened')
   * @param handler Function to handle the event
   * @param options Optional subscription configuration
   * @returns Promise that resolves to a subscription object
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions): Promise<Subscription>;

  /**
   * Unsubscribe from an event subscription
   *
   * @param subscription The subscription to cancel
   * @returns Promise that resolves when unsubscribed
   */
  unsubscribe(subscription: Subscription): Promise<void>;

  /**
   * Get an observable stream of events for a specific type
   *
   * @param eventType The type of event to observe
   * @returns Observable stream of events
   */
  observe<T extends DomainEvent>(eventType: string): Observable<T>;

  /**
   * Get an observable stream of all events
   *
   * @returns Observable stream of all events
   */
  observeAll(): Observable<DomainEvent>;
}
