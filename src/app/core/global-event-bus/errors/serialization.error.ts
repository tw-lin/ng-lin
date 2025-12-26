/**
 * Serialization Error Classes
 *
 * Errors that occur during event serialization/deserialization.
 */

/**
 * Base error for serialization failures
 */
export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly data?: any,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SerializationError';
    Object.setPrototypeOf(this, SerializationError.prototype);

    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

/**
 * Event serialization to JSON failed
 */
export class EventSerializationError extends SerializationError {
  constructor(event: any, originalError?: Error) {
    super(`Failed to serialize event: ${originalError?.message || 'Unknown error'}`, event, originalError);
    this.name = 'EventSerializationError';
    Object.setPrototypeOf(this, EventSerializationError.prototype);
  }
}

/**
 * Event deserialization from JSON failed
 */
export class EventDeserializationError extends SerializationError {
  constructor(json: string, originalError?: Error) {
    super(`Failed to deserialize event: ${originalError?.message || 'Unknown error'}`, json, originalError);
    this.name = 'EventDeserializationError';
    Object.setPrototypeOf(this, EventDeserializationError.prototype);
  }
}

/**
 * Event type not found during deserialization
 */
export class EventTypeNotFoundError extends SerializationError {
  constructor(
    public readonly eventType: string,
    json: string
  ) {
    super(`Event type not found: ${eventType}`, json);
    this.name = 'EventTypeNotFoundError';
    Object.setPrototypeOf(this, EventTypeNotFoundError.prototype);
  }
}

/**
 * Invalid JSON format
 */
export class InvalidJsonError extends SerializationError {
  constructor(json: string, originalError?: Error) {
    super(`Invalid JSON format: ${originalError?.message || 'Unknown error'}`, json, originalError);
    this.name = 'InvalidJsonError';
    Object.setPrototypeOf(this, InvalidJsonError.prototype);
  }
}

/**
 * Event schema validation failed
 */
export class SchemaValidationError extends SerializationError {
  constructor(
    public readonly eventType: string,
    public readonly validationErrors: string[],
    data?: any
  ) {
    super(`Schema validation failed for event type '${eventType}': ${validationErrors.join(', ')}`, data);
    this.name = 'SchemaValidationError';
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

/**
 * Event version mismatch
 */
export class EventVersionMismatchError extends SerializationError {
  constructor(
    public readonly eventType: string,
    public readonly expectedVersion: string,
    public readonly actualVersion: string,
    data?: any
  ) {
    super(`Event version mismatch for type '${eventType}': expected ${expectedVersion}, got ${actualVersion}`, data);
    this.name = 'EventVersionMismatchError';
    Object.setPrototypeOf(this, EventVersionMismatchError.prototype);
  }
}
