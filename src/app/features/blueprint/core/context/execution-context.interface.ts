import type { LoggerService } from '@core';

import type { SharedContext } from './shared-context';
import type { TenantInfo } from './tenant-info.interface';
import type { IBlueprintConfig } from '../config/blueprint-config.interface';
import type { IResourceProvider } from '../container/resource-provider.interface';
import type { IEventBus } from '../events/event-bus.interface';

/**
 * Context Type
 *
 * Defines the scope level of the execution context.
 */
export enum ContextType {
  ORGANIZATION = 'organization',
  TEAM = 'team',
  USER = 'user'
}

/**
 * Execution Context Interface
 *
 * Provides modules with access to all shared resources and services
 * they need to operate within a blueprint.
 *
 * This is the primary integration point between modules and the container.
 *
 * @example
 * ```typescript
 * async init(context: IExecutionContext): Promise<void> {
 *   // Access event bus
 *   context.eventBus.on('SOME_EVENT', this.handler);
 *
 *   // Access Firestore
 *   const firestore = context.resources.get<Firestore>('firestore');
 *
 *   // Access shared context
 *   context.sharedContext.setState('myModule.data', { value: 42 });
 * }
 * ```
 */
export interface IExecutionContext {
  /**
   * Blueprint ID
   * Unique identifier of the current blueprint instance
   */
  blueprintId: string;

  /**
   * Context Type
   * The scope level of this execution context
   */
  contextType: ContextType;

  /**
   * Tenant Information
   * Multi-tenant scope and access control information
   */
  tenant?: TenantInfo;

  /**
   * Event Bus
   * Pub/sub system for module communication
   */
  eventBus: IEventBus;

  /**
   * Resource Provider
   * Access to shared resources via dependency injection
   */
  resources: IResourceProvider;

  /**
   * Shared Context
   * Shared state management across modules
   */
  sharedContext: SharedContext;
}
