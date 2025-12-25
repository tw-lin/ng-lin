/**
 * Blueprint Event
 *
 * Standard event format for all events in the blueprint system.
 * Provides complete context and traceability for event-driven communication.
 *
 * @template T - Type of the event payload
 */
export interface IBlueprintEvent<T = any> {
  /**
   * Event type identifier
   * Should be a unique string identifying the event type
   */
  type: string;

  /**
   * Event payload data
   * Contains the actual data being transmitted with the event
   */
  payload: T;

  /**
   * Unix timestamp (milliseconds) when the event was created
   */
  timestamp: number;

  /**
   * ID of the module that emitted this event
   */
  source: string;

  /**
   * Execution context information
   */
  context: {
    /** Blueprint ID where this event occurred */
    blueprintId: string;

    /** User ID who triggered the event */
    userId: string;
  };

  /**
   * Unique identifier for this event instance
   * Format: `${timestamp}-${random}`
   */
  id: string;
}

/**
 * Event Handler Function
 *
 * Function signature for event handlers.
 * Can be synchronous or asynchronous.
 *
 * @template T - Type of the event payload
 */
export type EventHandler<T = any> = (event: IBlueprintEvent<T>) => void | Promise<void>;

/**
 * Event Bus Interface
 *
 * Provides publish-subscribe mechanism for module communication.
 * Ensures zero-coupling between modules while enabling rich interaction.
 *
 * @example
 * ```typescript
 * // Emit an event
 * eventBus.emit('TASK_CREATED', { taskId: '123', name: 'New Task' }, 'tasks');
 *
 * // Subscribe to an event
 * const unsubscribe = eventBus.on('TASK_CREATED', (event) => {
 *   console.log('Task created:', event.payload);
 * });
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export interface IEventBus {
  /**
   * Emit an event
   *
   * Publishes an event to all subscribed listeners.
   *
   * @param type - Event type identifier
   * @param payload - Event data
   * @param source - ID of the module emitting the event
   */
  emit<T>(type: string, payload: T, source: string): void;

  /**
   * Subscribe to an event
   *
   * Registers a handler to be called when events of the specified type are emitted.
   * Returns an unsubscribe function.
   *
   * @param type - Event type to subscribe to
   * @param handler - Function to call when event occurs
   * @returns Unsubscribe function
   */
  on<T>(type: string, handler: EventHandler<T>): () => void;

  /**
   * Unsubscribe from an event
   *
   * Removes a previously registered event handler.
   *
   * @param type - Event type
   * @param handler - Handler function to remove
   */
  off<T>(type: string, handler: EventHandler<T>): void;

  /**
   * Subscribe to an event once
   *
   * Handler will be called only for the first occurrence of the event,
   * then automatically unsubscribed.
   *
   * @param type - Event type to subscribe to
   * @param handler - Function to call when event occurs
   * @returns Unsubscribe function
   */
  once<T>(type: string, handler: EventHandler<T>): () => void;

  /**
   * Get event history
   *
   * Retrieves past events for auditing or replay.
   *
   * @param type - Optional: Filter by event type
   * @param limit - Maximum number of events to return (default: 100)
   * @returns Array of historical events
   */
  getHistory(type?: string, limit?: number): IBlueprintEvent[];

  /**
   * Dispose of the event bus
   *
   * Unsubscribes all handlers and clears history.
   * Should be called when the blueprint is being destroyed.
   */
  dispose(): void;
}
