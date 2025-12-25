/**
 * Issues Module - Public API
 * 問題模組 - 公開 API
 *
 * Feature-Based Architecture (功能導向架構)
 * - High Cohesion (高內聚性)
 * - Low Coupling (低耦合性)
 * - Extensibility (可擴展性)
 */

// Main Orchestrator
export { IssuesModuleViewComponent } from './issues-module-view.component';

// Feature Exports
export * from './features/issue-statistics';
export * from './features/issue-list';
export * from './features/issue-form';
export * from './features/issue-details';

// Shared Utilities
export * from './shared';
