/**
 * Shared Services Module
 *
 * Exports UI-related shared services only.
 * Business logic services have been moved to @core.
 *
 * @module shared/services
 */

// Export TenantContextService from event-bus (replaces WorkspaceContextService)
export { TenantContextService } from '@core/event-bus/services';
export type { Workspace, TenantMetadata } from '@core/event-bus/services';

// Backward compatibility alias
export { TenantContextService as WorkspaceContextService } from '@core/event-bus/services';

export * from './menu-management.service';
export * from './breadcrumb.service';
export * from './permission/permission.service';
