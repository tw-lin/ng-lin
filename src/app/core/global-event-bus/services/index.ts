/**
 * Public API for event bus services
 * 
 * NOTE: InMemoryEventBus and InMemoryEventStore are re-exported from implementations
 * for backwards compatibility. New code should import from implementations/in-memory.
 */

// Re-export implementations for backwards compatibility
export * from '../implementations/in-memory';

// Export base consumer class
export * from './event-consumer.base';
