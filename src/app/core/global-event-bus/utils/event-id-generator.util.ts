import { Injectable } from '@angular/core';

/**
 * Event ID Generation Strategies
 */
export type IdGenerationStrategy = 'uuid' | 'ulid' | 'custom';

/**
 * Custom ID generator function type
 */
export type CustomIdGenerator = (timestamp?: number) => string;

/**
 * Event ID Generator Utility Service
 *
 * Provides multiple strategies for generating unique event IDs:
 * - UUID v4: Random-based, no ordering (default)
 * - ULID: Timestamp-ordered, lexicographically sortable
 * - Custom: User-defined generator function
 *
 * @example
 * ```typescript
 * const generator = inject(EventIdGeneratorUtil);
 *
 * // UUID v4 (default)
 * const id1 = generator.generate(); // "550e8400-e29b-41d4-a716-446655440000"
 *
 * // ULID (sortable)
 * const id2 = generator.generateULID(); // "01ARZ3NDEKTSV4RRFFQ69G5FAV"
 *
 * // Custom generator
 * generator.setCustomGenerator((ts) => `evt-${ts}`);
 * const id3 = generator.generate(); // "evt-1703462400000"
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventIdGeneratorUtil {
  private strategy: IdGenerationStrategy = 'uuid';
  private customGenerator?: CustomIdGenerator;

  /**
   * Generate a new event ID using the current strategy
   */
  generate(): string {
    switch (this.strategy) {
      case 'uuid':
        return this.generateUUID();
      case 'ulid':
        return this.generateULID();
      case 'custom':
        if (!this.customGenerator) {
          throw new Error('Custom generator not set. Call setCustomGenerator() first.');
        }
        return this.customGenerator(Date.now());
      default:
        return this.generateUUID();
    }
  }

  /**
   * Generate UUID v4 (random-based)
   * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate ULID (Universally Unique Lexicographically Sortable Identifier)
   * Format: 01ARZ3NDEKTSV4RRFFQ69G5FAV (26 characters)
   *
   * Structure:
   * - First 10 characters: Timestamp (milliseconds)
   * - Last 16 characters: Randomness
   *
   * Benefits:
   * - Sortable by creation time
   * - URL-safe
   * - Case-insensitive
   */
  generateULID(timestamp: number = Date.now()): string {
    // Crockford's Base32 alphabet (no I, L, O, U to avoid confusion)
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const ENCODING_LEN = ENCODING.length;

    // Encode timestamp (10 characters)
    let time = '';
    let ts = timestamp;
    for (let i = 10; i > 0; i--) {
      const mod = ts % ENCODING_LEN;
      time = ENCODING[mod] + time;
      ts = Math.floor(ts / ENCODING_LEN);
    }

    // Generate random part (16 characters)
    let random = '';
    for (let i = 0; i < 16; i++) {
      random += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
    }

    return time + random;
  }

  /**
   * Set the ID generation strategy
   */
  setStrategy(strategy: IdGenerationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get the current strategy
   */
  getStrategy(): IdGenerationStrategy {
    return this.strategy;
  }

  /**
   * Set a custom ID generator function
   *
   * @example
   * ```typescript
   * generator.setCustomGenerator((timestamp) => {
   *   return `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
   * });
   * ```
   */
  setCustomGenerator(generator: CustomIdGenerator): void {
    this.customGenerator = generator;
    this.strategy = 'custom';
  }

  /**
   * Validate if a string is a valid UUID v4
   */
  isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validate if a string is a valid ULID
   */
  isValidULID(id: string): boolean {
    // ULID is 26 characters, all uppercase letters and digits (Crockford's Base32)
    const ulidRegex = /^[0-9A-Z]{26}$/;
    return ulidRegex.test(id);
  }

  /**
   * Extract timestamp from ULID
   * Returns null if not a valid ULID
   */
  extractTimestampFromULID(ulid: string): number | null {
    if (!this.isValidULID(ulid)) {
      return null;
    }

    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const timeChars = ulid.substring(0, 10);

    let timestamp = 0;
    for (let i = 0; i < timeChars.length; i++) {
      const char = timeChars[i];
      const value = ENCODING.indexOf(char);
      if (value === -1) {
        return null;
      }
      timestamp = timestamp * ENCODING.length + value;
    }

    return timestamp;
  }
}
