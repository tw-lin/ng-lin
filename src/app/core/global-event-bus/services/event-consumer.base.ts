import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EVENT_BUS } from '../constants/event-bus-tokens';
import { IEventBus } from '../interfaces';
import { DomainEvent, Subscription } from '../models';

/**
 * Subscription Metadata
 *
 * Metadata stored for @Subscribe decorated methods
 */
interface SubscriptionMetadata {
  eventType: string;
  methodName: string;
  options?: {
    retryPolicy?: {
      maxAttempts: number;
      backoff: 'exponential' | 'linear' | 'fixed';
      initialDelay: number;
      maxDelay?: number;
    };
  };
}

/**
 * Event Consumer Base Class
 *
 * Base class for event consumers that handle domain events.
 * Provides automatic subscription management and lifecycle handling.
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * class MyConsumer extends EventConsumer {
 *   constructor(eventBus: IEventBus) {
 *     super(eventBus);
 *   }
 *
 *   @Subscribe('issues.opened')
 *   async handleIssueOpened(event: IssueOpenedEvent) {
 *     // Handle event
 *   }
 * }
 * ```
 */
export abstract class EventConsumer {
  protected readonly eventBus = inject(EVENT_BUS, { optional: false });
  private readonly destroyRef = inject(DestroyRef);
  private readonly subscriptions: Subscription[] = [];

  /**
   * Initialize the consumer and subscribe to events
   * Call this method after construction (e.g., in ngOnInit)
   */
  async initialize(): Promise<void> {
    const metadata = this.getSubscriptionMetadata();

    for (const meta of metadata) {
      try {
        const handler = (this as any)[meta.methodName].bind(this);
        const subscription = await this.eventBus.subscribe(meta.eventType, handler, {
          retryPolicy: meta.options?.retryPolicy
        });

        this.subscriptions.push(subscription);
      } catch (error) {
        console.error(`[EventConsumer] Failed to subscribe to ${meta.eventType}:`, error);
      }
    }

    // Auto-cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroy();
    });
  }

  /**
   * Clean up subscriptions
   */
  async destroy(): Promise<void> {
    for (const subscription of this.subscriptions) {
      await this.eventBus.unsubscribe(subscription);
    }
    this.subscriptions.length = 0;
  }

  /**
   * Get subscription metadata from decorated methods
   */
  private getSubscriptionMetadata(): SubscriptionMetadata[] {
    // Note: Reflect metadata API is not available in this environment
    // Decorator-based subscriptions are not currently supported
    // Use manual subscription via subscribe() method instead
    return [];
  }

  /**
   * Subscribe to an event stream using RxJS
   * Useful for reactive patterns
   */
  protected subscribeToStream<T extends DomainEvent>(eventType: string, handler: (event: T) => void): void {
    this.eventBus
      .observe<T>(eventType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: handler,
        error: error => {
          console.error(`[EventConsumer] Stream error for ${eventType}:`, error);
        }
      });
  }
}
