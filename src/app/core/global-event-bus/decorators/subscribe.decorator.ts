import 'reflect-metadata';
import { SubscribeOptions } from '../models';

/**
 * Subscribe Decorator
 *
 * Decorator for marking methods as event handlers.
 * The decorated method will be automatically subscribed when the consumer is initialized.
 *
 * @param eventType The event type to subscribe to (e.g., 'issues.opened')
 * @param options Optional subscription configuration
 *
 * @example
 * ```typescript
 * class MyConsumer extends EventConsumer {
 *   @Subscribe('issues.opened', {
 *     retryPolicy: {
 *       maxAttempts: 3,
 *       backoff: 'exponential',
 *       initialDelay: 1000
 *     }
 *   })
 *   async handleIssueOpened(event: IssueOpenedEvent) {
 *     // Handle event
 *   }
 * }
 * ```
 */
export function Subscribe(eventType: string, options?: SubscribeOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Get existing subscriptions or create new array
    const subscriptions = Reflect.getMetadata('subscriptions', target.constructor) || [];

    // Add this subscription
    subscriptions.push({
      eventType,
      methodName: propertyKey,
      options
    });

    // Store updated subscriptions
    Reflect.defineMetadata('subscriptions', subscriptions, target.constructor);

    return descriptor;
  };
}
