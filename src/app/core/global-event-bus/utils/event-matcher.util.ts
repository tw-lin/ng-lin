import { Injectable } from '@angular/core';
import type { DomainEvent } from '../models/base-event';

/**
 * Event pattern matching types
 */
export type MatchPattern = string | RegExp;

/**
 * Compiled pattern for performance optimization
 */
interface CompiledPattern {
  original: string;
  regex: RegExp;
  isWildcard: boolean;
}

/**
 * Event Matcher Utility Service
 * 
 * Provides pattern matching for event types with support for:
 * - Exact matching: "task.created"
 * - Wildcard matching: "task.*", "*.created", "**"
 * - Regex matching: /^task\.(created|updated)$/
 * 
 * @example
 * ```typescript
 * const matcher = inject(EventMatcherUtil);
 * 
 * // Exact match
 * matcher.matches("task.created", "task.created"); // true
 * 
 * // Wildcard
 * matcher.matches("task.created", "task.*"); // true
 * matcher.matches("task.updated", "*.updated"); // true
 * 
 * // Match all
 * matcher.matches("any.event", "**"); // true
 * 
 * // Filter events
 * const events = [
 *   { eventType: "task.created" },
 *   { eventType: "user.created" },
 *   { eventType: "task.updated" }
 * ];
 * const taskEvents = matcher.filterEvents(events, ["task.*"]);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventMatcherUtil {
  private compiledPatterns = new Map<string, CompiledPattern>();

  /**
   * Check if an event type matches a pattern
   */
  matches(eventType: string, pattern: MatchPattern): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(eventType);
    }

    // Exact match
    if (eventType === pattern) {
      return true;
    }

    // Match all pattern
    if (pattern === '**' || pattern === '*') {
      return true;
    }

    // Wildcard pattern
    if (pattern.includes('*')) {
      const compiled = this.compilePattern(pattern);
      return compiled.regex.test(eventType);
    }

    return false;
  }

  /**
   * Check if an event matches any of the patterns
   */
  matchesAny(eventType: string, patterns: MatchPattern[]): boolean {
    return patterns.some((pattern) => this.matches(eventType, pattern));
  }

  /**
   * Check if an event matches all patterns
   */
  matchesAll(eventType: string, patterns: MatchPattern[]): boolean {
    return patterns.every((pattern) => this.matches(eventType, pattern));
  }

  /**
   * Filter events by patterns
   */
  filterEvents<T extends DomainEvent<any>>(
    events: T[],
    patterns: MatchPattern[]
  ): T[] {
    return events.filter((event) => this.matchesAny(event.eventType, patterns));
  }

  /**
   * Group events by pattern matching
   * Returns a map of pattern -> matching events
   */
  groupByPattern<T extends DomainEvent<any>>(
    events: T[],
    patterns: string[]
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();

    for (const pattern of patterns) {
      groups.set(pattern, []);
    }

    for (const event of events) {
      for (const pattern of patterns) {
        if (this.matches(event.eventType, pattern)) {
          groups.get(pattern)!.push(event);
        }
      }
    }

    return groups;
  }

  /**
   * Compile a wildcard pattern to regex for performance
   * Caches compiled patterns for reuse
   */
  private compilePattern(pattern: string): CompiledPattern {
    // Check cache first
    if (this.compiledPatterns.has(pattern)) {
      return this.compiledPatterns.get(pattern)!;
    }

    // Escape regex special characters except * and .
    let regexStr = pattern
      .replace(/[\\^$+?()[\]{}|]/g, '\\$&')
      .replace(/\./g, '\\.');

    // Convert wildcards to regex
    // ** matches everything
    if (regexStr === '\\*\\*') {
      regexStr = '.*';
    } else {
      // * matches anything except dots (single segment)
      regexStr = regexStr.replace(/\\\*/g, '[^.]+');
    }

    const regex = new RegExp(`^${regexStr}$`);
    const compiled: CompiledPattern = {
      original: pattern,
      regex,
      isWildcard: pattern.includes('*'),
    };

    this.compiledPatterns.set(pattern, compiled);
    return compiled;
  }

  /**
   * Clear the pattern cache
   * Useful for memory management in long-running applications
   */
  clearCache(): void {
    this.compiledPatterns.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; patterns: string[] } {
    return {
      size: this.compiledPatterns.size,
      patterns: Array.from(this.compiledPatterns.keys()),
    };
  }

  /**
   * Extract namespace from event type
   * e.g., "task.created" -> "task"
   */
  extractNamespace(eventType: string): string {
    const parts = eventType.split('.');
    return parts[0] || '';
  }

  /**
   * Extract action from event type
   * e.g., "task.created" -> "created"
   */
  extractAction(eventType: string): string {
    const parts = eventType.split('.');
    return parts[1] || '';
  }

  /**
   * Build event type from namespace and action
   */
  buildEventType(namespace: string, action: string): string {
    return `${namespace}.${action}`;
  }

  /**
   * Validate event type format (namespace.action)
   */
  isValidEventType(eventType: string): boolean {
    const pattern = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i;
    return pattern.test(eventType);
  }
}
