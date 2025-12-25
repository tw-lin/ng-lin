/**
 * Members Module - Public API
 * 成員模組 - 公開 API
 *
 * Feature-Based Architecture (功能導向架構)
 * - High Cohesion (高內聚性): All member functionality in one module
 * - Low Coupling (低耦合性): Clear interfaces via barrel exports
 * - Extensibility (可擴展性): Easy to add new features
 *
 * Module Structure:
 * - Main Orchestrator: MembersModuleViewComponent
 * - Features:
 *   - member-list: Display and manage member list
 *   - member-form: Add/edit member form
 * - Shared: Common utilities and helpers
 *
 * Extension Guidelines:
 * 1. Add new features in features/ directory
 * 2. Export via feature's index.ts
 * 3. Import in main orchestrator if needed
 * 4. Keep features independent and focused
 */

// Main Orchestrator
export { MembersModuleViewComponent } from './members-module-view.component';

// Feature Exports
export * from './features/member-list';
export * from './features/member-form';

// Shared Utilities
export * from './shared';

// Domain
export * from './members.model';
export * from './members.repository';
export * from './members.service';
