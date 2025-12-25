/**
 * Cloud Module - Public API
 * 雲端模組 - 公開 API
 *
 * Feature-Based Architecture (功能導向架構)
 * - High Cohesion (高內聚性)
 * - Low Coupling (低耦合性)
 * - Extensibility (可擴展性)
 */

// Main Orchestrator
export { CloudModuleViewComponent } from './cloud-module-view-refactored.component';

// Feature Exports
export * from './features/statistics';
export * from './features/folder-management';
export * from './features/file-list';
export * from './features/file-details';
export * from './features/upload';

// Shared Utilities
export * from './shared';

// Domain
export * from './cloud.model';
export * from './cloud.repository';
export * from './cloud.service';
