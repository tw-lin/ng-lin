import { Injectable } from '@angular/core';

import { SerializationError, EventDeserializationError, InvalidJsonError } from '../errors/serialization.error';
import { DomainEvent } from '../models/base-event';

// Create aliases for backward compatibility
const DeserializationError = EventDeserializationError;
const InvalidEventFormatError = InvalidJsonError;

/**
 * Event Serializer Service
 *
 * Responsibilities:
 * - Serialize events to JSON strings
 * - Deserialize JSON strings back to event objects
 * - Handle complex types (Date, Map, Set, etc.)
 * - Preserve type information for proper reconstruction
 * - Validate serialized data structure
 *
 * @example
 * ```typescript
 * const serializer = inject(EventSerializerService);
 *
 * // Serialize
 * const json = serializer.serialize(event);
 *
 * // Deserialize
 * const event = serializer.deserialize(json, TaskCreatedEvent);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventSerializerService {
  /**
   * Serialize a domain event to JSON string
   *
   * Handles special types:
   * - Date → ISO string with __type marker
   * - Map → Array of entries with __type marker
   * - Set → Array with __type marker
   * - undefined → null (JSON compatible)
   *
   * @param event - The event to serialize
   * @returns JSON string representation
   * @throws SerializationError if serialization fails
   */
  serialize(event: DomainEvent): string {
    try {
      return JSON.stringify(event, this.replacer);
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize event ${event.eventType}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Deserialize JSON string to domain event
   *
   * Reconstructs special types:
   * - ISO strings with __type='Date' → Date objects
   * - Arrays with __type='Map' → Map objects
   * - Arrays with __type='Set' → Set objects
   *
   * @param json - JSON string to deserialize
   * @param EventClass - Optional event class constructor for type checking
   * @returns Reconstructed event object
   * @throws DeserializationError if deserialization fails
   * @throws InvalidEventFormatError if data doesn't match expected structure
   */
  deserialize<T extends DomainEvent>(json: string, EventClass?: new (...args: any[]) => T): T {
    try {
      const parsed = JSON.parse(json, this.reviver);

      // Validate basic event structure
      this.validateEventStructure(parsed);

      // If EventClass provided, perform additional validation
      if (EventClass) {
        this.validateEventType(parsed, EventClass);
      }

      return parsed as T;
    } catch (error) {
      if (error instanceof InvalidEventFormatError || error instanceof DeserializationError) {
        throw error;
      }

      throw new DeserializationError(
        `Failed to deserialize event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Serialize event to Buffer (for binary protocols)
   */
  serializeToBuffer(event: DomainEvent): Uint8Array {
    const json = this.serialize(event);
    return new TextEncoder().encode(json);
  }

  /**
   * Deserialize event from Buffer
   */
  deserializeFromBuffer<T extends DomainEvent>(buffer: Uint8Array, EventClass?: new (...args: any[]) => T): T {
    const json = new TextDecoder().decode(buffer);
    return this.deserialize(json, EventClass);
  }

  /**
   * JSON replacer function for serialization
   * Handles Date, Map, Set, and other special types
   */
  private replacer(key: string, value: any): any {
    // Handle Date objects
    if (value instanceof Date) {
      return {
        __type: 'Date',
        value: value.toISOString()
      };
    }

    // Handle Map objects
    if (value instanceof Map) {
      return {
        __type: 'Map',
        value: Array.from(value.entries())
      };
    }

    // Handle Set objects
    if (value instanceof Set) {
      return {
        __type: 'Set',
        value: Array.from(value)
      };
    }

    // Handle undefined (JSON doesn't support undefined)
    if (value === undefined) {
      return null;
    }

    return value;
  }

  /**
   * JSON reviver function for deserialization
   * Reconstructs Date, Map, Set, and other special types
   */
  private reviver(key: string, value: any): any {
    // Check if this is a typed object
    if (value && typeof value === 'object' && '__type' in value) {
      switch (value['__type']) {
        case 'Date':
          return new Date(value['value']);

        case 'Map':
          return new Map(value['value']);

        case 'Set':
          return new Set(value['value']);

        default:
          // Unknown type, return as-is
          return value;
      }
    }

    return value;
  }

  /**
   * Validate basic event structure
   */
  private validateEventStructure(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new InvalidJsonError(JSON.stringify(data), new Error('Event data must be a non-null object'));
    }

    const required = ['eventId', 'eventType', 'timestamp'];
    for (const field of required) {
      if (!(field in data)) {
        throw new InvalidJsonError(JSON.stringify(data), new Error(`Missing required field: ${field}`));
      }
    }

    // Validate eventId is string
    if (typeof data['eventId'] !== 'string') {
      throw new InvalidJsonError(JSON.stringify(data), new Error('eventId must be a string'));
    }

    // Validate eventType is string
    if (typeof data['eventType'] !== 'string') {
      throw new InvalidJsonError(JSON.stringify(data), new Error('eventType must be a string'));
    }

    // Validate timestamp (should be Date object after reviver)
    if (!(data['timestamp'] instanceof Date)) {
      throw new InvalidJsonError(JSON.stringify(data), new Error('timestamp must be a Date object'));
    }
  }

  /**
   * Validate event matches expected type
   */
  private validateEventType<T extends DomainEvent>(data: any, EventClass: new (...args: any[]) => T): void {
    // Create a temporary instance to get the expected eventType
    // Note: This assumes EventClass has a default constructor or handles missing args
    // For stricter validation, we could require EventClass to have a static eventType property
    const expectedType = (EventClass as any).eventType;

    if (expectedType && data['eventType'] !== expectedType) {
      throw new InvalidJsonError(
        JSON.stringify(data),
        new Error(`Event type mismatch: expected ${expectedType}, got ${data['eventType']}`)
      );
    }
  }
}
