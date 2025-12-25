/**
 * Global Event Bus Public API
 *
 * Complete enterprise-grade event bus implementation following GitHub architecture.
 * Supports multiple backends (in-memory, Firebase, Supabase, Kafka).
 *
 * Phase 5: Domain Integration
 * - Domain event definitions for core entities
 * - Production-ready consumer implementations
 * - Full integration examples
 */

// Core models
export * from './models';

// Interfaces
export * from './interfaces';

// Implementations
export * from './implementations';

// Services (includes base consumer and re-exports of implementations)
export * from './services';

// Decorators
export * from './decorators';

// Constants
export * from './constants';

// Errors
export * from './errors';

// Domain Events (Phase 5)
export * from './domain-events';

// Consumers (Phase 5)
export * from './consumers';

// Utils
export * from './utils';

// Testing
export * from './testing';

// Examples (for reference and testing)
export * from './examples';
