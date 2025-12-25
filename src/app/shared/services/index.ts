/**
 * Shared Services Module
 *
 * Exports UI-related shared services only.
 * Business logic services have been moved to @core.
 *
 * @module shared/services
 */

// Export TenantContextService from global-event-bus (replaces WorkspaceContextService)
export { TenantContextService, Workspace, TenantMetadata } from '@core/global-event-bus/services';

// Backward compatibility alias
export { TenantContextService as WorkspaceContextService } from '@core/global-event-bus/services';

export * from './menu-management.service';
export * from './breadcrumb.service';
export * from './permission/permission.service';
