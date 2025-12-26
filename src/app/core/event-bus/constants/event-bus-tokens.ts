/**
 * Dependency Injection Tokens for Event Bus
 * 
 * Provides DI tokens for multi-backend support.
 * Allows switching between in-memory, Firebase, Supabase implementations.
 */

import { InjectionToken } from '@angular/core';
import { IEventBus } from '../interfaces/event-bus.interface';
import { IEventStore } from '../interfaces/event-store.interface';

/**
 * Injection token for Event Bus implementation
 * 
 * Use this token to inject the event bus in your services/components.
 * The actual implementation can be configured at module level.
 * 
 * @example
 * ```typescript
 * export class MyService {
 *   private eventBus = inject(EVENT_BUS);
 * }
 * ```
 */
export const EVENT_BUS = new InjectionToken<IEventBus>('EVENT_BUS', {
  providedIn: 'root',
  factory: () => {
    // Default to in-memory implementation
    // Override in providers to use Firebase/Supabase
    throw new Error(
      'EVENT_BUS not provided. Configure event bus in app providers.'
    );
  },
});

/**
 * Injection token for Event Store implementation
 * 
 * Use this token to inject the event store in your services.
 * 
 * @example
 * ```typescript
 * export class MyService {
 *   private eventStore = inject(EVENT_STORE);
 * }
 * ```
 */
export const EVENT_STORE = new InjectionToken<IEventStore>('EVENT_STORE', {
  providedIn: 'root',
  factory: () => {
    throw new Error(
      'EVENT_STORE not provided. Configure event store in app providers.'
    );
  },
});

/**
 * Event bus configuration token
 * 
 * @example
 * ```typescript
 * {
 *   provide: EVENT_BUS_CONFIG,
 *   useValue: {
 *     retryPolicy: { maxAttempts: 5 },
 *     enableDeadLetterQueue: true
 *   }
 * }
 * ```
 */
export const EVENT_BUS_CONFIG = new InjectionToken<EventBusConfig>(
  'EVENT_BUS_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
      },
      enableDeadLetterQueue: true,
      enableEventStore: true,
      logErrors: true,
    }),
  }
);

/**
 * Event bus configuration interface
 */
export interface EventBusConfig {
  /**
   * Default retry policy for all handlers
   */
  readonly retryPolicy?: {
    readonly maxAttempts: number;
    readonly backoff: 'exponential' | 'linear' | 'fixed';
    readonly initialDelay: number;
    readonly maxDelay?: number;
  };

  /**
   * Enable dead letter queue for failed events
   * Default: true
   */
  readonly enableDeadLetterQueue?: boolean;

  /**
   * Enable event store persistence
   * Default: true
   */
  readonly enableEventStore?: boolean;

  /**
   * Log errors to console
   * Default: true
   */
  readonly logErrors?: boolean;

  /**
   * Maximum events to keep in memory (in-memory implementation only)
   * Default: 10000
   */
  readonly maxEventsInMemory?: number;
}
