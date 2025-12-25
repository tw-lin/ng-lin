/**
 * Event Metadata
 *
 * Additional information about an event that's not part of the core payload
 */
export interface EventMetadata {
  /** Event schema version for backward compatibility */
  version: string;

  /** Source system/service that generated the event */
  source: string;

  /** ID to correlate related events across the system */
  correlationId?: string;

  /** ID of the event that caused this event */
  causationId?: string;

  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Event Context
 *
 * Runtime context information when the event was generated
 */
export interface EventContext {
  /** ID of the user who triggered the event */
  userId?: string;

  /** ID of the blueprint/project context */
  blueprintId?: string;

  /** ID of the organization context */
  organizationId?: string;

  /** Session or request ID for tracing */
  sessionId?: string;

  /** IP address of the request (if applicable) */
  ipAddress?: string;

  /** User agent information */
  userAgent?: string;
}
