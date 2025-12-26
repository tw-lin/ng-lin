import { Injectable } from '@angular/core';

import { HandlerValidationError, EventHandlerError } from '../errors/event-handler.error';
import { SchemaValidationError, EventVersionMismatchError } from '../errors/serialization.error';
import { DomainEvent } from '../models/base-event';

// Create aliases for backward compatibility
const ValidationError = HandlerValidationError;
const InvalidEventSchemaError = SchemaValidationError;
const InvalidEventVersionError = EventVersionMismatchError;

/**
 * Validation result structure
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Event Validator Service
 *
 * Responsibilities:
 * - Validate event structure and required fields
 * - Validate event content and business rules
 * - Validate event version compatibility
 * - Provide detailed validation errors
 *
 * @example
 * ```typescript
 * const validator = inject(EventValidatorService);
 *
 * const result = validator.validate(event);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventValidatorService {
  /**
   * Validate a domain event
   *
   * Performs comprehensive validation:
   * 1. Schema validation (required fields, types)
   * 2. Content validation (payload structure)
   * 3. Version validation (compatibility)
   *
   * @param event - The event to validate
   * @param options - Validation options
   * @returns Validation result with errors and warnings
   */
  validate(
    event: DomainEvent,
    options?: {
      strict?: boolean;
      allowedVersions?: string[];
      customRules?: Array<(event: DomainEvent) => string | null>;
    }
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Schema validation
    try {
      this.validateSchema(event, options?.strict ?? false);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    // 2. Content validation
    const contentErrors = this.validateContent(event);
    errors.push(...contentErrors);

    // 3. Version validation
    if (options?.allowedVersions) {
      try {
        this.validateVersion(event, options.allowedVersions);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error.message);
        }
      }
    }

    // 4. Custom rules
    if (options?.customRules) {
      for (const rule of options.customRules) {
        const error = rule(event);
        if (error) {
          errors.push(error);
        }
      }
    }

    // 5. Best practice warnings
    const practiceWarnings = this.checkBestPractices(event);
    warnings.push(...practiceWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate event schema (structure and required fields)
   *
   * @param event - The event to validate
   * @param strict - Enable strict mode (validates all optional fields)
   * @throws InvalidEventSchemaError if validation fails
   */
  validateSchema(event: DomainEvent, strict = false): boolean {
    // Check event is object
    if (!event || typeof event !== 'object') {
      throw new InvalidEventSchemaError('Event must be a non-null object', ['Event is null or not an object']);
    }

    const errors: string[] = [];

    // Required fields
    const requiredFields = ['eventId', 'eventType', 'timestamp'];

    for (const field of requiredFields) {
      if (!(field in event)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type validation
    if ('eventId' in event && typeof event.eventId !== 'string') {
      errors.push('eventId must be a string');
    }

    if ('eventType' in event && typeof event.eventType !== 'string') {
      errors.push('eventType must be a string');
    }

    if ('timestamp' in event && !(event.timestamp instanceof Date)) {
      errors.push('timestamp must be a Date object');
    }

    // EventId format validation
    if ('eventId' in event && typeof event.eventId === 'string' && event.eventId.length === 0) {
      errors.push('eventId cannot be empty');
    }

    // EventType format validation
    if ('eventType' in event && typeof event.eventType === 'string' && !this.isValidEventType(event.eventType)) {
      errors.push(`eventType "${event.eventType}" has invalid format (expected: namespace.action format)`);
    }

    // Optional fields (strict mode)
    if (strict) {
      if ('aggregateId' in event && typeof event.aggregateId !== 'string') {
        errors.push('aggregateId must be a string');
      }

      if ('aggregateType' in event && typeof event.aggregateType !== 'string') {
        errors.push('aggregateType must be a string');
      }

      if ('metadata' in event && typeof event.metadata !== 'object') {
        errors.push('metadata must be an object');
      }
    }

    if (errors.length > 0) {
      throw new InvalidEventSchemaError('Event schema validation failed', errors);
    }

    return true;
  }

  /**
   * Validate event content (payload structure and business rules)
   */
  private validateContent(event: DomainEvent): string[] {
    const errors: string[] = [];

    // Check payload exists
    if (!('payload' in event) || event.payload === undefined) {
      errors.push('Event payload is missing');
      return errors;
    }

    // Payload should be object or primitive
    const payloadType = typeof event.payload;
    if (payloadType !== 'object' && payloadType !== 'string' && payloadType !== 'number' && payloadType !== 'boolean') {
      errors.push(`Invalid payload type: ${payloadType}`);
    }

    // If payload is object, check it's not null
    if (payloadType === 'object' && event.payload === null) {
      errors.push('Payload cannot be null (use undefined or empty object)');
    }

    return errors;
  }

  /**
   * Validate event version compatibility
   *
   * @param event - The event to validate
   * @param allowedVersions - List of allowed version strings
   * @throws InvalidEventVersionError if version is not allowed
   */
  validateVersion(event: DomainEvent, allowedVersions: string[]): boolean {
    const eventVersion = event.metadata?.version ?? '1.0.0';

    if (!allowedVersions.includes(eventVersion)) {
      throw new InvalidEventVersionError(event.eventType, allowedVersions.join(' | '), eventVersion, event);
    }

    return true;
  }

  /**
   * Check best practices and generate warnings
   */
  private checkBestPractices(event: DomainEvent): string[] {
    const warnings: string[] = [];

    // Check metadata exists
    if (!event.metadata) {
      warnings.push('Event metadata is missing (recommended for traceability)');
    }

    // Check correlation ID
    if (event.metadata && !event.metadata.correlationId) {
      warnings.push('correlationId is missing (recommended for event correlation)');
    }

    // Check source
    if (event.metadata && !event.metadata.source) {
      warnings.push('source is missing (recommended for debugging)');
    }

    // Check aggregate info
    if (!event.aggregateId) {
      warnings.push('aggregateId is missing (recommended for Event Sourcing)');
    }

    if (!event.aggregateType) {
      warnings.push('aggregateType is missing (recommended for Event Sourcing)');
    }

    // Check timestamp is recent (within 1 hour)
    const now = new Date();
    const eventTime = event.timestamp;
    const hourInMs = 60 * 60 * 1000;

    if (now.getTime() - eventTime.getTime() > hourInMs) {
      warnings.push('Event timestamp is more than 1 hour old');
    }

    return warnings;
  }

  /**
   * Validate event type format
   * Expected format: namespace.action (e.g., 'task.created', 'user.updated')
   */
  private isValidEventType(eventType: string): boolean {
    // Must contain at least one dot
    if (!eventType.includes('.')) {
      return false;
    }

    // Must not start or end with dot
    if (eventType.startsWith('.') || eventType.endsWith('.')) {
      return false;
    }

    // Must not have consecutive dots
    if (eventType.includes('..')) {
      return false;
    }

    // Should only contain lowercase letters, numbers, dots, and hyphens
    const validPattern = /^[a-z0-9]+([-.]?[a-z0-9]+)*$/;
    return validPattern.test(eventType);
  }
}
