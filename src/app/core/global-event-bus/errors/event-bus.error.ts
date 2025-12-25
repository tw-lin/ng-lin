/**
 * Event Bus Error Classes
 *
 * Custom error types for event bus operations.
 */

/**
 * Base error class for all event bus errors
 */
export class EventBusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EventBusError';
    Object.setPrototypeOf(this, EventBusError.prototype);
  }
}

/**
 * Event publishing failed
 */
export class EventPublishError extends EventBusError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'EVENT_PUBLISH_FAILED', context);
    this.name = 'EventPublishError';
    Object.setPrototypeOf(this, EventPublishError.prototype);
  }
}

/**
 * Event subscription failed
 */
export class EventSubscriptionError extends EventBusError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'EVENT_SUBSCRIPTION_FAILED', context);
    this.name = 'EventSubscriptionError';
    Object.setPrototypeOf(this, EventSubscriptionError.prototype);
  }
}

/**
 * Event not found in store
 */
export class EventNotFoundError extends EventBusError {
  constructor(eventId: string, context?: Record<string, any>) {
    super(`Event not found: ${eventId}`, 'EVENT_NOT_FOUND', {
      ...context,
      eventId
    });
    this.name = 'EventNotFoundError';
    Object.setPrototypeOf(this, EventNotFoundError.prototype);
  }
}

/**
 * Event store is full
 */
export class EventStoreFullError extends EventBusError {
  constructor(maxEvents: number, context?: Record<string, any>) {
    super(`Event store is full (max: ${maxEvents} events)`, 'EVENT_STORE_FULL', { ...context, maxEvents });
    this.name = 'EventStoreFullError';
    Object.setPrototypeOf(this, EventStoreFullError.prototype);
  }
}

/**
 * Invalid event format
 */
export class InvalidEventError extends EventBusError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INVALID_EVENT', context);
    this.name = 'InvalidEventError';
    Object.setPrototypeOf(this, InvalidEventError.prototype);
  }
}

/**
 * Subscription already exists
 */
export class DuplicateSubscriptionError extends EventBusError {
  constructor(subscriptionId: string, context?: Record<string, any>) {
    super(`Subscription already exists: ${subscriptionId}`, 'DUPLICATE_SUBSCRIPTION', { ...context, subscriptionId });
    this.name = 'DuplicateSubscriptionError';
    Object.setPrototypeOf(this, DuplicateSubscriptionError.prototype);
  }
}

/**
 * Subscription not found
 */
export class SubscriptionNotFoundError extends EventBusError {
  constructor(subscriptionId: string, context?: Record<string, any>) {
    super(`Subscription not found: ${subscriptionId}`, 'SUBSCRIPTION_NOT_FOUND', { ...context, subscriptionId });
    this.name = 'SubscriptionNotFoundError';
    Object.setPrototypeOf(this, SubscriptionNotFoundError.prototype);
  }
}

/**
 * Event bus not initialized
 */
export class EventBusNotInitializedError extends EventBusError {
  constructor(context?: Record<string, any>) {
    super('Event bus not initialized', 'EVENT_BUS_NOT_INITIALIZED', context);
    this.name = 'EventBusNotInitializedError';
    Object.setPrototypeOf(this, EventBusNotInitializedError.prototype);
  }
}

/**
 * Event bus already initialized
 */
export class EventBusAlreadyInitializedError extends EventBusError {
  constructor(context?: Record<string, any>) {
    super('Event bus already initialized', 'EVENT_BUS_ALREADY_INITIALIZED', context);
    this.name = 'EventBusAlreadyInitializedError';
    Object.setPrototypeOf(this, EventBusAlreadyInitializedError.prototype);
  }
}
