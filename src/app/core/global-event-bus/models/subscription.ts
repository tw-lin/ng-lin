import { DomainEvent } from './base-event';

/**
 * Event Handler
 * 
 * Function signature for handling events
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

/**
 * Subscribe Options
 * 
 * Configuration options for event subscription
 */
export interface SubscribeOptions {
  /** Maximum number of concurrent event handlers */
  concurrency?: number;
  
  /** Retry policy for failed handlers */
  retryPolicy?: RetryPolicy;
  
  /** Dead letter queue for permanently failed events */
  deadLetterQueue?: string;
  
  /** Filter events before passing to handler */
  filter?: (event: DomainEvent) => boolean;
}

/**
 * Retry Policy
 * 
 * Configuration for retrying failed event handlers
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Backoff strategy between retries */
  backoff: 'exponential' | 'linear' | 'fixed';
  
  /** Initial delay in milliseconds */
  initialDelay: number;
  
  /** Maximum delay in milliseconds (for exponential backoff) */
  maxDelay?: number;
}

/**
 * Subscription
 * 
 * Represents an active event subscription
 */
export interface Subscription {
  /** Event type being subscribed to */
  eventType: string;
  
  /** The event handler function */
  handler: EventHandler;
  
  /** Unsubscribe from this subscription */
  unsubscribe: () => void;
  
  /** Unique subscription ID */
  id?: string;
}
