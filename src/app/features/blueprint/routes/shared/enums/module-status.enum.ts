/**
 * Module Lifecycle Status
 *
 * Represents the current state of a module in its lifecycle.
 * Follows a strict state machine pattern for predictable behavior.
 */
export enum ModuleStatus {
  /** Module has been instantiated but not initialized */
  UNINITIALIZED = 'uninitialized',

  /** Module is currently initializing (init() in progress) */
  INITIALIZING = 'initializing',

  /** Module has completed initialization */
  INITIALIZED = 'initialized',

  /** Module is ready to start */
  READY = 'ready',

  /** Module is currently starting (start() in progress) */
  STARTING = 'starting',

  /** Module has started */
  STARTED = 'started',

  /** Module is running and operational */
  RUNNING = 'running',

  /** Module is currently stopping (stop() in progress) */
  STOPPING = 'stopping',

  /** Module has been stopped */
  STOPPED = 'stopped',

  /** Module has been disposed */
  DISPOSED = 'disposed',

  /** Module encountered an error and is in an error state */
  ERROR = 'error'
}
