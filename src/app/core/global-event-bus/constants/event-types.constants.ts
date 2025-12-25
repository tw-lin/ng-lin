/**
 * Event Type Constants
 * 
 * Centralized event type definitions.
 * Use these constants instead of magic strings.
 */

/**
 * System-level events
 */
export const SYSTEM_EVENTS = {
  /**
   * Fired when event bus is initialized
   */
  BUS_INITIALIZED: 'system.bus.initialized' as const,

  /**
   * Fired when event bus is shutdown
   */
  BUS_SHUTDOWN: 'system.bus.shutdown' as const,

  /**
   * Fired when an event handler fails after all retries
   */
  HANDLER_FAILED: 'system.handler.failed' as const,

  /**
   * Fired when an event is moved to dead letter queue
   */
  EVENT_DEAD_LETTERED: 'system.event.dead_lettered' as const,

  /**
   * Fired when event store is full
   */
  STORE_FULL: 'system.store.full' as const,
} as const;

/**
 * Domain event namespaces
 * 
 * Use these as prefixes for domain events:
 * `${DOMAIN_NAMESPACES.BLUEPRINT}.created`
 */
export const DOMAIN_NAMESPACES = {
  BLUEPRINT: 'blueprint' as const,
  TASK: 'task' as const,
  USER: 'user' as const,
  ORGANIZATION: 'organization' as const,
  TEAM: 'team' as const,
  PARTNER: 'partner' as const,
  NOTIFICATION: 'notification' as const,
  AUDIT: 'audit' as const,
  ANALYTICS: 'analytics' as const,
} as const;

/**
 * Common event suffixes
 */
export const EVENT_SUFFIXES = {
  CREATED: 'created' as const,
  UPDATED: 'updated' as const,
  DELETED: 'deleted' as const,
  ARCHIVED: 'archived' as const,
  RESTORED: 'restored' as const,
  ASSIGNED: 'assigned' as const,
  UNASSIGNED: 'unassigned' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  STARTED: 'started' as const,
  PAUSED: 'paused' as const,
  RESUMED: 'resumed' as const,
  CANCELLED: 'cancelled' as const,
} as const;

/**
 * Event type patterns for matching
 */
export const EVENT_PATTERNS = {
  /**
   * Match all events
   */
  ALL: '*' as const,

  /**
   * Match all events in a namespace
   * Example: 'task.*' matches 'task.created', 'task.updated', etc.
   */
  NAMESPACE_ALL: (namespace: string) => `${namespace}.*` as const,

  /**
   * Match specific action across namespaces
   * Example: '*.created' matches 'task.created', 'blueprint.created', etc.
   */
  ACTION_ALL: (action: string) => `*.${action}` as const,
} as const;

/**
 * Helper to build event type string
 * 
 * @param namespace - Event namespace
 * @param action - Event action
 * @returns Formatted event type string
 * 
 * @example
 * ```typescript
 * const eventType = buildEventType('task', 'created'); // 'task.created'
 * ```
 */
export function buildEventType(namespace: string, action: string): string {
  return `${namespace}.${action}`;
}

/**
 * Helper to check if event type matches pattern
 * 
 * @param eventType - Event type to check
 * @param pattern - Pattern to match against (supports * wildcard)
 * @returns true if matches, false otherwise
 * 
 * @example
 * ```typescript
 * matchesPattern('task.created', 'task.*') // true
 * matchesPattern('task.created', '*.created') // true
 * matchesPattern('task.created', 'blueprint.*') // false
 * ```
 */
export function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === EVENT_PATTERNS.ALL) {
    return true;
  }

  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // Escape dots
    .replace(/\*/g, '.*');  // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(eventType);
}
