/**
 * Event Envelope Model
 *
 * Wraps domain events with retry tracking and error information.
 * Used internally by event bus for reliable delivery.
 */

import { DomainEvent } from './base-event';

/**
 * Event envelope
 *
 * Wraps a domain event with metadata for retry and error tracking.
 * Used internally by the event bus infrastructure.
 */
export class EventEnvelope<T extends DomainEvent = DomainEvent> {
  /**
   * The wrapped domain event
   */
  readonly event: T;

  /**
   * Number of delivery attempts
   */
  readonly retryCount: number;

  /**
   * Timestamp of last delivery attempt
   */
  readonly lastAttempt?: Date;

  /**
   * Error from last failed attempt
   */
  readonly error?: Error;

  /**
   * Timestamp when envelope was created
   */
  readonly createdAt: Date;

  /**
   * Whether this is a dead letter (exceeded max retries)
   */
  readonly isDeadLetter: boolean;

  /**
   * Original event type (for deserialization)
   */
  readonly originalEventType: string;

  constructor(params: { event: T; retryCount?: number; lastAttempt?: Date; error?: Error; createdAt?: Date; isDeadLetter?: boolean }) {
    this.event = params.event;
    this.retryCount = params.retryCount ?? 0;
    this.lastAttempt = params.lastAttempt;
    this.error = params.error;
    this.createdAt = params.createdAt ?? new Date();
    this.isDeadLetter = params.isDeadLetter ?? false;
    this.originalEventType = params.event.eventType;
  }

  /**
   * Create envelope for first delivery attempt
   */
  static create<T extends DomainEvent>(event: T): EventEnvelope<T> {
    return new EventEnvelope({ event });
  }

  /**
   * Alias for create (for backward compatibility)
   */
  static wrap<T extends DomainEvent>(event: T): EventEnvelope<T> {
    return EventEnvelope.create(event);
  }

  /**
   * Create envelope with incremented retry count
   */
  withRetry(error: Error): EventEnvelope<T> {
    return new EventEnvelope({
      event: this.event,
      retryCount: this.retryCount + 1,
      lastAttempt: new Date(),
      error,
      createdAt: this.createdAt,
      isDeadLetter: this.isDeadLetter
    });
  }

  /**
   * Mark envelope as dead letter
   */
  asDeadLetter(error: Error): EventEnvelope<T> {
    return new EventEnvelope({
      event: this.event,
      retryCount: this.retryCount,
      lastAttempt: new Date(),
      error,
      createdAt: this.createdAt,
      isDeadLetter: true
    });
  }

  /**
   * Check if envelope has exceeded max retries
   */
  hasExceededMaxRetries(maxAttempts: number): boolean {
    return this.retryCount >= maxAttempts;
  }

  /**
   * Get time since last attempt in milliseconds
   */
  getTimeSinceLastAttempt(): number | null {
    if (!this.lastAttempt) {
      return null;
    }
    return Date.now() - this.lastAttempt.getTime();
  }

  /**
   * Get total age of envelope in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Convert to JSON (for serialization)
   */
  toJSON(): Record<string, any> {
    return {
      event: this.event,
      retryCount: this.retryCount,
      lastAttempt: this.lastAttempt?.toISOString(),
      error: this.error
        ? {
            name: this.error.name,
            message: this.error.message,
            stack: this.error.stack
          }
        : undefined,
      createdAt: this.createdAt.toISOString(),
      isDeadLetter: this.isDeadLetter,
      originalEventType: this.originalEventType
    };
  }

  /**
   * Create from JSON (for deserialization)
   */
  static fromJSON<T extends DomainEvent>(json: Record<string, any>): EventEnvelope<T> {
    const error = json['error']
      ? Object.assign(new Error(json['error']['message']), {
          name: json['error']['name'],
          stack: json['error']['stack']
        })
      : undefined;

    return new EventEnvelope({
      event: json['event'] as T,
      retryCount: json['retryCount'],
      lastAttempt: json['lastAttempt'] ? new Date(json['lastAttempt']) : undefined,
      error,
      createdAt: new Date(json['createdAt']),
      isDeadLetter: json['isDeadLetter']
    });
  }
}
