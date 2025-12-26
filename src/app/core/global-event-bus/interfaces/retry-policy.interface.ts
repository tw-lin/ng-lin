/**
 * Retry Policy Interface
 *
 * Defines retry behavior for failed event handlers.
 * Supports exponential, linear, and fixed backoff strategies.
 */

/**
 * Retry policy interface
 *
 * Configures retry behavior for event handlers
 */
export interface IRetryPolicy {
  /**
   * Maximum number of retry attempts
   * Set to 0 to disable retries
   *
   * @default 3
   */
  readonly maxAttempts: number;

  /**
   * Backoff strategy for retry delays
   *
   * - exponential: delay = initialDelay * (2 ^ attempt)
   * - linear: delay = initialDelay * (attempt + 1)
   * - fixed: delay = initialDelay
   *
   * @default 'exponential'
   */
  readonly backoff: 'exponential' | 'linear' | 'fixed';

  /**
   * Initial delay in milliseconds before first retry
   *
   * @default 1000
   */
  readonly initialDelay: number;

  /**
   * Maximum delay in milliseconds
   * Prevents exponential backoff from becoming too large
   *
   * @default 30000 (30 seconds)
   */
  readonly maxDelay?: number;

  /**
   * Custom function to determine if error should trigger retry
   *
   * Return true to retry, false to give up
   * Default behavior retries all errors
   *
   * @param error - The error that occurred
   * @param attempt - Current attempt number (0-indexed)
   * @returns true to retry, false to give up
   */
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Jitter factor to add randomness to delays
   * Helps prevent thundering herd problem
   *
   * Value between 0 and 1
   * - 0: no jitter
   * - 0.1: up to 10% random variance
   * - 1: up to 100% random variance
   *
   * @default 0.1
   */
  readonly jitter?: number;
}

/**
 * Retry attempt information
 * Passed to retry callbacks
 */
export interface RetryAttempt {
  /**
   * Current attempt number (0-indexed)
   */
  readonly attempt: number;

  /**
   * Total attempts allowed
   */
  readonly maxAttempts: number;

  /**
   * Error from previous attempt
   */
  readonly error: Error;

  /**
   * Delay before next retry (ms)
   */
  readonly delayMs: number;

  /**
   * Timestamp of this attempt
   */
  readonly timestamp: Date;
}

/**
 * Retry result
 * Returned after retry sequence completes
 */
export interface RetryResult<T = void> {
  /**
   * Whether operation succeeded
   */
  readonly success: boolean;

  /**
   * Result value if successful
   */
  readonly value?: T;

  /**
   * Final error if all retries failed
   */
  readonly error?: Error;

  /**
   * Number of attempts made
   */
  readonly attempts: number;

  /**
   * Total time spent retrying (ms)
   */
  readonly totalTimeMs: number;
}
