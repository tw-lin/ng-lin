/**
 * Event Handler Error Classes
 * 
 * Errors that occur during event handler execution.
 */

import { DomainEvent } from '../models/base-event';

/**
 * Base error for event handler failures
 */
export class EventHandlerError extends Error {
  constructor(
    message: string,
    public readonly event: DomainEvent,
    public readonly handlerName: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EventHandlerError';
    Object.setPrototypeOf(this, EventHandlerError.prototype);

    // Preserve original error stack
    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

/**
 * Event handler execution failed
 */
export class HandlerExecutionError extends EventHandlerError {
  constructor(
    event: DomainEvent,
    handlerName: string,
    originalError: Error
  ) {
    super(
      `Handler '${handlerName}' failed to process event '${event.eventType}'`,
      event,
      handlerName,
      originalError
    );
    this.name = 'HandlerExecutionError';
    Object.setPrototypeOf(this, HandlerExecutionError.prototype);
  }
}

/**
 * Event handler timeout
 */
export class HandlerTimeoutError extends EventHandlerError {
  constructor(
    event: DomainEvent,
    handlerName: string,
    public readonly timeoutMs: number
  ) {
    super(
      `Handler '${handlerName}' timed out after ${timeoutMs}ms processing event '${event.eventType}'`,
      event,
      handlerName
    );
    this.name = 'HandlerTimeoutError';
    Object.setPrototypeOf(this, HandlerTimeoutError.prototype);
  }
}

/**
 * Event handler validation failed
 */
export class HandlerValidationError extends EventHandlerError {
  constructor(
    event: DomainEvent,
    handlerName: string,
    public readonly validationErrors: string[]
  ) {
    super(
      `Handler '${handlerName}' validation failed: ${validationErrors.join(', ')}`,
      event,
      handlerName
    );
    this.name = 'HandlerValidationError';
    Object.setPrototypeOf(this, HandlerValidationError.prototype);
  }
}

/**
 * Event handler not found
 */
export class HandlerNotFoundError extends Error {
  constructor(
    public readonly eventType: string,
    public readonly handlerName?: string
  ) {
    super(
      handlerName
        ? `Handler '${handlerName}' not found for event type '${eventType}'`
        : `No handlers found for event type '${eventType}'`
    );
    this.name = 'HandlerNotFoundError';
    Object.setPrototypeOf(this, HandlerNotFoundError.prototype);
  }
}

/**
 * Event handler retry exhausted
 */
export class RetryExhaustedError extends EventHandlerError {
  constructor(
    event: DomainEvent,
    handlerName: string,
    public readonly attempts: number,
    public readonly errors: Error[]
  ) {
    super(
      `Handler '${handlerName}' failed after ${attempts} attempts processing event '${event.eventType}'`,
      event,
      handlerName,
      errors[errors.length - 1] // Last error
    );
    this.name = 'RetryExhaustedError';
    Object.setPrototypeOf(this, RetryExhaustedError.prototype);
  }

  /**
   * Get all error messages from retry attempts
   */
  getAllErrorMessages(): string[] {
    return this.errors.map(e => e.message);
  }
}

/**
 * Idempotency check failed
 */
export class IdempotencyError extends EventHandlerError {
  constructor(
    event: DomainEvent,
    handlerName: string,
    public readonly reason: string
  ) {
    super(
      `Idempotency check failed for handler '${handlerName}': ${reason}`,
      event,
      handlerName
    );
    this.name = 'IdempotencyError';
    Object.setPrototypeOf(this, IdempotencyError.prototype);
  }
}
