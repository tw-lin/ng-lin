/**
 * Event Handler Interface
 * 
 * Defines the signature for event handler functions.
 * Handlers can be synchronous or asynchronous.
 * 
 * @template T - The type of DomainEvent this handler processes
 */

import { DomainEvent } from '../models/base-event';

/**
 * Event handler function type
 * 
 * @param event - The domain event to handle
 * @returns Promise<void> for async handlers, void for sync handlers
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => Promise<void> | void;

/**
 * Event handler with error handling
 * 
 * @param event - The domain event to handle
 * @param error - Optional error from previous attempt
 * @returns Promise<void>
 */
export type EventHandlerWithError<T extends DomainEvent = DomainEvent> = (
  event: T,
  error?: Error
) => Promise<void>;

/**
 * Event handler metadata
 * Used by decorators to store handler information
 */
export interface EventHandlerMetadata {
  /**
   * Event type this handler subscribes to
   */
  readonly eventType: string;

  /**
   * Handler function reference
   */
  readonly handler: EventHandler;

  /**
   * Method name on the class
   */
  readonly methodName: string;

  /**
   * Subscribe options
   */
  readonly options?: SubscribeOptions;
}

/**
 * Subscribe options for event handlers
 */
export interface SubscribeOptions {
  /**
   * Retry policy for failed handlers
   */
  readonly retryPolicy?: RetryPolicy;

  /**
   * Filter function to determine if handler should process event
   */
  readonly filter?: (event: DomainEvent) => boolean;

  /**
   * Priority for handler execution (higher = earlier)
   * Default: 0
   */
  readonly priority?: number;

  /**
   * Whether to enable idempotency checking
   * Default: false
   */
  readonly idempotent?: boolean;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /**
   * Maximum number of retry attempts
   * Default: 3
   */
  readonly maxAttempts: number;

  /**
   * Backoff strategy
   * - exponential: delay doubles each attempt
   * - linear: delay increases by initialDelay
   * - fixed: constant delay
   */
  readonly backoff: 'exponential' | 'linear' | 'fixed';

  /**
   * Initial delay in milliseconds
   * Default: 1000
   */
  readonly initialDelay: number;

  /**
   * Maximum delay in milliseconds
   * Default: 30000 (30 seconds)
   */
  readonly maxDelay?: number;

  /**
   * Custom function to determine if error should trigger retry
   * Default: all errors trigger retry
   */
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}
