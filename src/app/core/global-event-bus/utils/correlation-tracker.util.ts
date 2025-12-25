import { Injectable, signal } from '@angular/core';

/**
 * Correlation Tracker Utility Service
 *
 * Manages correlation IDs for tracing related events across async operations.
 * Uses AsyncLocalStorage pattern for thread-local context.
 *
 * @example
 * ```typescript
 * const tracker = inject(CorrelationTrackerUtil);
 *
 * // Create correlation context
 * const correlationId = tracker.createContext();
 *
 * // Run operations in context
 * await tracker.runInContext(correlationId, async () => {
 *   await eventBus.publish(event); // Auto-injected correlationId
 *   const current = tracker.getCurrentCorrelationId(); // Same ID
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CorrelationTrackerUtil {
  private currentCorrelationId = signal<string | null>(null);
  private contextStack: string[] = [];

  /**
   * Generate a new correlation ID (UUID v4)
   */
  generateCorrelationId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create a new correlation context
   * Returns the generated correlation ID
   */
  createContext(): string {
    const correlationId = this.generateCorrelationId();
    this.currentCorrelationId.set(correlationId);
    this.contextStack.push(correlationId);
    return correlationId;
  }

  /**
   * Get the current correlation ID
   */
  getCurrentCorrelationId(): string | null {
    return this.currentCorrelationId();
  }

  /**
   * Set correlation ID manually
   */
  setCorrelationId(correlationId: string): void {
    this.currentCorrelationId.set(correlationId);
    this.contextStack.push(correlationId);
  }

  /**
   * Clear the correlation context
   */
  clearContext(): void {
    this.contextStack.pop();
    const previous = this.contextStack[this.contextStack.length - 1] || null;
    this.currentCorrelationId.set(previous);
  }

  /**
   * Run an async operation within a correlation context
   */
  async runInContext<T>(correlationId: string, fn: () => Promise<T>): Promise<T> {
    this.setCorrelationId(correlationId);
    try {
      return await fn();
    } finally {
      this.clearContext();
    }
  }
}
