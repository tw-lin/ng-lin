/**
 * Core Audit Module - Public API
 * 
 * Centralized exports for the Global Audit System.
 * Provides access to all audit models, collectors, services, repositories, and query utilities.
 * 
 * Module Structure:
 * - models/: TypeScript interfaces and enums for audit events
 * - collectors/: Event Collector Service (Layer 3)
 * - services/: Classification Engine Service (Layer 4)
 * - repositories/: Audit Event Repository (Layer 5)
 * - query/: Advanced Query Service (Layer 6)
 * 
 * Usage:
 * ```typescript
 * import { 
 *   AuditEvent, 
 *   AuditCategory,
 *   AuditCollectorEnhancedService,
 *   ClassificationEngineService,
 *   AuditEventRepository,
 *   AuditQueryService 
 * } from '@core/audit';
 * ```
 * 
 * @see docs/⭐️/AUDIT_SYSTEM_IMPLEMENTATION_ROADMAP.md
 */

// Models (Layer 0)
export * from './models';

// Collectors (Layer 3)
export * from './collectors';

// Services (Layer 4)
export * from './services';

// Repositories (Layer 5)
export * from './repositories';

// Query Services (Layer 6)
export * from './query';
