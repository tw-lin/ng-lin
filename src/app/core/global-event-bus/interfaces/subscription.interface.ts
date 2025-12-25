/**
 * Subscription Interface
 *
 * Represents an active subscription to events.
 * Provides methods to manage the subscription lifecycle.
 */

import { EventHandler, SubscribeOptions } from './event-handler.interface';

/**
 * Subscription interface
 *
 * Represents a subscription to a specific event type.
 * Can be unsubscribed to stop receiving events.
 */
export interface ISubscription {
  /**
   * Unique subscription identifier
   */
  readonly id: string;

  /**
   * Event type this subscription listens to
   */
  readonly eventType: string;

  /**
   * Handler function for events
   */
  readonly handler: EventHandler;

  /**
   * Subscription options
   */
  readonly options?: SubscribeOptions;

  /**
   * Timestamp when subscription was created
   */
  readonly createdAt: Date;

  /**
   * Whether subscription is active
   */
  readonly active: boolean;

  /**
   * Unsubscribe from events
   * After calling, no more events will be delivered to handler
   */
  unsubscribe(): Promise<void>;
}

/**
 * Subscription state
 * Used for tracking subscription lifecycle
 */
export interface SubscriptionState {
  /**
   * Subscription ID
   */
  readonly id: string;

  /**
   * Event type
   */
  readonly eventType: string;

  /**
   * Number of events processed
   */
  readonly eventsProcessed: number;

  /**
   * Number of events failed
   */
  readonly eventsFailed: number;

  /**
   * Last event timestamp
   */
  readonly lastEventAt?: Date;

  /**
   * Last error
   */
  readonly lastError?: Error;

  /**
   * Subscription created timestamp
   */
  readonly createdAt: Date;

  /**
   * Subscription unsubscribed timestamp
   */
  readonly unsubscribedAt?: Date;
}
