import { Injectable } from '@angular/core';
import { IRetryPolicy, RetryAttempt, RetryResult } from '../interfaces/retry-policy.interface';
import { RetryExhaustedError } from '../errors/event-handler.error';

/**
 * Retry Manager Service
 *
 * Responsibilities:
 * - Manage retry logic for failed operations
 * - Calculate retry delays based on backoff strategy
 * - Determine if operation should be retried
 * - Track retry attempts
 * - Provide retry execution wrapper
 *
 * Supported Backoff Strategies:
 * - exponential: delay = initialDelay * (2 ^ attempt)
 * - linear: delay = initialDelay + (attempt * initialDelay)
 * - fixed: delay = initialDelay
 *
 * @example
 * ```typescript
 * const retryManager = inject(RetryManagerService);
 *
 * const policy: IRetryPolicy = {
 *   maxAttempts: 3,
 *   backoff: 'exponential',
 *   initialDelay: 1000,
 *   maxDelay: 30000
 * };
 *
 * await retryManager.executeWithRetry(
 *   async () => await someOperation(),
 *   policy
 * );
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RetryManagerService {
  /**
   * Execute function with retry logic
   *
   * @param fn - Function to execute
   * @param policy - Retry policy configuration
   * @returns Promise resolving to function result
   * @throws RetryExhaustedError if all retry attempts fail
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: IRetryPolicy
  ): Promise<T> {
    const attempts: RetryAttempt[] = [];
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const attemptStart = new Date();

      try {
        const result = await fn();

        // Success - record successful attempt
        attempts.push({
          attempt,
          timestamp: attemptStart,
          error: new Error('Success'), // Placeholder error for successful attempt
          delayMs: 0,
          maxAttempts: policy.maxAttempts
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Calculate delay for next retry
        const delay = this.calculateDelay(attempt, policy);

        // Record failed attempt
        attempts.push({
          attempt,
          timestamp: attemptStart,
          error: lastError,
          delayMs: delay,
          maxAttempts: policy.maxAttempts
        });

        // Check if should retry
        if (attempt < policy.maxAttempts) {
          const shouldRetry = this.shouldRetry(lastError, attempt, policy);

          if (!shouldRetry) {
            throw new Error(
              `Operation failed and retry policy decided not to retry: ${lastError.message}`
            );
          }

          // Wait before next attempt
          await this.sleep(delay);
        }
      }
    }

    // All attempts exhausted
    throw new Error(
      `Operation failed after ${policy.maxAttempts} attempts: ${lastError?.message ?? 'Unknown error'}`
    );
  }

  /**
   * Determine if operation should be retried
   *
   * @param error - The error that occurred
   * @param attempt - Current attempt number
   * @param policy - Retry policy
   * @returns True if should retry, false otherwise
   */
  shouldRetry(error: Error, attempt: number, policy: IRetryPolicy): boolean {
    // Check custom shouldRetry function if provided
    if (policy.shouldRetry) {
      return policy.shouldRetry(error, attempt);
    }

    // Default behavior: retry on all errors except non-retryable ones
    return !this.isNonRetryableError(error);
  }

  /**
   * Calculate delay for next retry attempt
   *
   * @param attempt - Current attempt number (1-based)
   * @param policy - Retry policy
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number, policy: IRetryPolicy): number {
    const { backoff, initialDelay, maxDelay } = policy;

    let delay: number;

    switch (backoff) {
      case 'exponential':
        // Exponential backoff: delay = initialDelay * (2 ^ (attempt - 1))
        // attempt 1: 1x, attempt 2: 2x, attempt 3: 4x, etc.
        delay = initialDelay * Math.pow(2, attempt - 1);
        break;

      case 'linear':
        // Linear backoff: delay = initialDelay * attempt
        // attempt 1: 1x, attempt 2: 2x, attempt 3: 3x, etc.
        delay = initialDelay * attempt;
        break;

      case 'fixed':
      default:
        // Fixed delay: always use initialDelay
        delay = initialDelay;
        break;
    }

    // Apply max delay cap if specified
    if (maxDelay && delay > maxDelay) {
      delay = maxDelay;
    }

    // Add jitter (±10%) to avoid thundering herd
    const jitter = delay * 0.1;
    const randomJitter = (Math.random() * 2 - 1) * jitter;
    delay = Math.max(0, delay + randomJitter);

    return Math.floor(delay);
  }

  /**
   * Create retry result summary
   *
   * @param attempts - List of retry attempts
   * @param success - Whether operation ultimately succeeded
   * @returns Retry result summary
   */
  createRetryResult(attempts: RetryAttempt[], success: boolean): RetryResult {
    return {
      success,
      attempts: attempts.length,
      totalTimeMs: this.calculateTotalDuration(attempts),
    };
  }

  /**
   * Check if error is non-retryable
   *
   * Non-retryable errors:
   * - Validation errors
   * - Authentication/Authorization errors
   * - Not found errors
   * - Bad request errors
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      /validation/i,
      /invalid/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /bad request/i,
      /authentication/i,
      /permission/i,
    ];

    const errorMessage = error.message.toLowerCase();

    return nonRetryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate total duration of all attempts
   */
  private calculateTotalDuration(attempts: RetryAttempt[]): number {
    if (attempts.length === 0) return 0;

    const firstAttempt = attempts[0].timestamp.getTime();
    const lastAttempt = attempts[attempts.length - 1].timestamp.getTime();

    return lastAttempt - firstAttempt;
  }
}
