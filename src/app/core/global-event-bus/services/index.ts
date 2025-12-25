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

// Core services (Phase 2)
export * from './event-dispatcher.service';
export * from './event-serializer.service';
export * from './event-validator.service';
export * from './retry-manager.service';
export * from './dead-letter-queue.service';

// Audit services (Phase 7A)
export * from './auth-audit.service';
export * from './permission-audit.service';

// Global Audit Log services (Phase 7B)
export * from './audit-log.service';
export * from './audit-collector.service';
