/**
 * Base Domain Event
 *
 * All events in the system extend from this base class.
 * Events are immutable records of something that happened in the system.
 *
 * @template TPayload - Type of the event payload
 */
export abstract class DomainEvent<TPayload = unknown> {
  /** Unique identifier for this event */
  readonly eventId: string;

  /** When the event occurred */
  readonly timestamp: Date;

  /** ID of the aggregate (entity) that this event relates to */
  readonly aggregateId: string;

  /** Type of the aggregate (e.g., 'issue', 'pull_request', 'repository') */
  readonly aggregateType: string;

  /** Event type identifier (e.g., 'issues.opened', 'pull_request.merged') */
  abstract readonly eventType: string;

  /** Event payload - the actual data of what happened */
  readonly payload: TPayload;

  /** Metadata about the event */
  readonly metadata: Readonly<{
    /** Event schema version for backward compatibility */
    readonly version: string;
    /** Source system/service that generated the event */
    readonly source: string;
    /** ID to correlate related events across the system */
    readonly correlationId?: string;
    /** ID of the event that caused this event */
    readonly causationId?: string;
  }>;

  /**
   * Constructor for base event
   * Supports two call patterns:
   * 1. constructor(payload, metadata) - For event classes
   * 2. constructor({ aggregateId, aggregateType, ...}) - For direct instantiation
   */
  constructor(
    payloadOrData:
      | TPayload
      | {
          eventId?: string;
          timestamp?: Date;
          aggregateId: string;
          aggregateType: string;
          metadata?: {
            version?: string;
            source?: string;
            correlationId?: string;
            causationId?: string;
          };
        },
    metadata?: {
      aggregateId: string;
      aggregateType: string;
      aggregateVersion?: number;
      version?: string;
      source?: string;
      correlationId?: string;
      causationId?: string;
    }
  ) {
    // Two-parameter pattern: constructor(payload, metadata)
    if (metadata) {
      this.payload = payloadOrData as TPayload;
      this.aggregateId = metadata.aggregateId;
      this.aggregateType = metadata.aggregateType;
      this.eventId = this.generateEventId();
      this.timestamp = new Date();
      this.metadata = {
        version: metadata.version ?? (metadata.aggregateVersion ? `${metadata.aggregateVersion}.0` : '1.0'),
        source: metadata.source ?? 'unknown',
        correlationId: metadata.correlationId,
        causationId: metadata.causationId
      };
    }
    // Single-parameter pattern: constructor(data)
    else {
      const data = payloadOrData as any;
      this.payload = data.payload;
      this.eventId = data.eventId ?? this.generateEventId();
      this.timestamp = data.timestamp ?? new Date();
      this.aggregateId = data.aggregateId;
      this.aggregateType = data.aggregateType;
      this.metadata = {
        version: data.metadata?.version ?? '1.0',
        source: data.metadata?.source ?? 'unknown',
        correlationId: data.metadata?.correlationId,
        causationId: data.metadata?.causationId
      };
    }
  }

  /**
   * Generate a unique event ID
   * Uses timestamp + random string for uniqueness
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Get a string representation of the event
   */
  toString(): string {
    return `${this.eventType}[${this.eventId}] on ${this.aggregateType}:${this.aggregateId}`;
  }
}
