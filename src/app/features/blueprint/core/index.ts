/**
 * Blueprint Core System
 *
 * Core interfaces, types, and abstractions for the GigHub Blueprint System V2.0.
 *
 * This module provides the foundation for building infinitely extensible,
 * event-driven, and enterprise-grade module systems.
 *
 * ## Architecture Overview
 *
 * The blueprint system consists of:
 * - **Modules**: Self-contained units of functionality implementing IBlueprintModule
 * - **Events**: Zero-coupling communication via publish/subscribe (IEventBus)
 * - **Context**: Shared execution environment providing resources to modules
 * - **Config**: Blueprint and module configuration management
 * - **Container**: Lifecycle management and dependency injection
 *
 * ## Key Features
 *
 * - ✅ **Infinite Extensibility**: Add unlimited modules dynamically
 * - ✅ **Zero Coupling**: Modules communicate only via events
 * - ✅ **Unified Lifecycle**: init → start → ready → stop → dispose
 * - ✅ **Multi-tenant Isolation**: Organization/Team/User level separation
 * - ✅ **Event Sourcing**: Complete audit trail via event history
 * - ✅ **Modern Angular**: Signals, Standalone Components, TypeScript 5.9
 * - ✅ **Enterprise Ready**: Type-safe, testable, maintainable
 *
 * @packageDocumentation
 */

// Models
export * from './models';

// Domain Layer (Models, Types, Utils)
export * from './domain';

// Errors
export * from './errors';

// Module System
export * from './modules';

// Event System
export * from './events';

// Execution Context
export * from './context';

// Configuration
export * from './config';

// Container
export * from './container';

// Repositories
export * from './repositories';

// Services
export * from './services';
