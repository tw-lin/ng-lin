/**
 * Global Event Bus Public API
 * 
 * Complete enterprise-grade event bus implementation following GitHub architecture.
 * Supports multiple backends (in-memory, Firebase, Supabase, Kafka).
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

// Examples (for reference and testing)
export * from './examples';
