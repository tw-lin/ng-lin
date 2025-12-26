/**
 * Audit Models - Public API
 * 
 * Exports all audit model interfaces and enums for use throughout the application.
 * Provides centralized access to audit event structures, categories, severity levels,
 * and storage tier definitions.
 * 
 * Usage:
 * ```typescript
 * import { AuditEvent, AuditCategory, AuditLevel, StorageTier } from '@core/audit/models';
 * ```
 */

// Core audit event interface
export * from './audit-event.interface';

// Enumerations
export * from './event-category.enum';
export * from './event-severity.enum';
export * from './storage-tier.enum';
