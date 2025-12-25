import { Injectable, inject } from '@angular/core';
import { DomainEvent } from '../models/base-event';
import { EventHandler } from '../interfaces/event-handler.interface';
import { RetryManagerService } from './retry-manager.service';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { EventEnvelope } from '../models/event-envelope';
import {
  HandlerExecutionError,
  HandlerTimeoutError,
} from '../errors/event-handler.error';

/**
 * Event Dispatcher Service
 *
 * Responsibilities:
 * - Dispatch events to all subscribers
 * - Manage parallel execution
 * - Handle error isolation (one failing handler doesn't affect others)
 * - Integrate with retry manager for failed handlers
 * - Send failed events to dead letter queue after exhausting retries
 *
 * @example
 * ```typescript
 * const dispatcher = inject(EventDispatcherService);
 * await dispatcher.dispatch(event, handlers);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventDispatcherService {
  private readonly retryManager = inject(RetryManagerService);
  private readonly deadLetterQueue = inject(DeadLetterQueueService);

  /**
   * Dispatch event to all handlers in parallel
   *
   * Error Isolation Strategy:
   * - Each handler executes independently
   * - Handler failures don't affect other handlers
   * - Failed handlers trigger retry logic
   * - After max retries, event sent to dead letter queue
   *
   * @param event - The event to dispatch
   * @param handlers - Array of handlers to receive the event
   * @param options - Dispatch options (timeout, concurrency limit)
   */
  async dispatch<T extends DomainEvent>(
    event: T,
    handlers: Array<{ handler: EventHandler<T>; retryPolicy?: any }>,
    options?: { timeout?: number; maxConcurrency?: number }
  ): Promise<void> {
    if (handlers.length === 0) {
      return;
    }

    const timeout = options?.timeout ?? 30000; // Default 30s
    const maxConcurrency = options?.maxConcurrency ?? Infinity;

    // Process handlers with concurrency control
    const results = await this.processConcurrently(
      handlers,
      async handlerConfig => {
        await this.dispatchToHandler(
          handlerConfig.handler,
          event,
          handlerConfig.retryPolicy,
          timeout
        );
      },
      maxConcurrency
    );

    // Log any failures (all failed events already sent to DLQ)
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(
        `[EventDispatcher] ${failures.length}/${handlers.length} handlers failed for event ${event.eventType}`
      );
    }
  }

  /**
   * Dispatch event to a single handler with retry logic
   *
   * @param handler - Event handler function
   * @param event - The event to handle
   * @param retryPolicy - Retry configuration
   * @param timeout - Handler execution timeout in milliseconds
   */
  async dispatchToHandler<T extends DomainEvent>(
    handler: EventHandler<T>,
    event: T,
    retryPolicy?: any,
    timeout?: number
  ): Promise<void> {
    const envelope = EventEnvelope.wrap(event);

    try {
      if (retryPolicy) {
        // Execute with retry logic
        await this.retryManager.executeWithRetry(
          () => this.executeHandlerWithTimeout(handler, event, timeout),
          retryPolicy
        );
      } else {
        // Execute once without retry
        await this.executeHandlerWithTimeout(handler, event, timeout);
      }
    } catch (error) {
      // After all retries exhausted or immediate failure, send to DLQ
      envelope.markFailed(
        error instanceof Error ? error : new Error(String(error))
      );
      await this.deadLetterQueue.send(envelope);

      // Re-throw to maintain error isolation at caller level
      throw new HandlerExecutionError(
        `Handler failed for event ${event.eventType}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute handler with timeout protection
   */
  private async executeHandlerWithTimeout<T extends DomainEvent>(
    handler: EventHandler<T>,
    event: T,
    timeout?: number
  ): Promise<void> {
    if (!timeout) {
      await handler(event);
      return;
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new HandlerTimeoutError(
            `Handler timeout after ${timeout}ms`,
            timeout
          )
        );
      }, timeout);
    });

    await Promise.race([handler(event), timeoutPromise]);
  }

  /**
   * Process items concurrently with max concurrency limit
   */
  private async processConcurrently<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number
  ): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: R; reason?: any }>> {
    const results: Array<{
      status: 'fulfilled' | 'rejected';
      value?: R;
      reason?: any;
    }> = [];

    if (maxConcurrency === Infinity) {
      // No limit - process all in parallel
      const settled = await Promise.allSettled(items.map(processor));
      return settled.map(result => ({
        status: result.status,
        ...(result.status === 'fulfilled'
          ? { value: result.value }
          : { reason: result.reason }),
      }));
    }

    // Process with concurrency limit
    const queue = [...items];
    const executing: Array<Promise<void>> = [];

    while (queue.length > 0 || executing.length > 0) {
      while (executing.length < maxConcurrency && queue.length > 0) {
        const item = queue.shift()!;
        const promise = processor(item)
          .then(value => {
            results.push({ status: 'fulfilled', value });
          })
          .catch(reason => {
            results.push({ status: 'rejected', reason });
          })
          .finally(() => {
            const index = executing.indexOf(promise);
            if (index > -1) {
              executing.splice(index, 1);
            }
          });

        executing.push(promise);
      }

      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }

    return results;
  }
}
