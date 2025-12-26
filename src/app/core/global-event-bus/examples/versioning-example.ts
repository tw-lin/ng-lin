/**
 * Event Versioning Examples
 *
 * Demonstrates event version evolution and upcasting strategies
 *
 * @see docs/event-bus(Global Event Bus)-4.md for versioning patterns
 */

import { DomainEvent } from '../models/base-event';
import { BaseEventUpcaster } from '../versioning/event-upcaster.base';

// ========================================
// Example: TaskCreated Event Evolution
// ========================================

/**
 * Version 1.0: Initial version
 */
export interface TaskCreatedPayloadV1_0 {
  task: {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
  };
  creator: {
    id: string;
    name: string;
  };
}

export class TaskCreatedEventV1_0 extends DomainEvent<TaskCreatedPayloadV1_0> {
  readonly eventType = 'task.created' as const;

  constructor(payload: TaskCreatedPayloadV1_0) {
    super({
      aggregateId: payload.task.id,
      aggregateType: 'task',
      metadata: { version: '1.0' }
    });
    this.payload = payload;
  }
}

/**
 * Version 1.1: Added optional fields (backward compatible)
 */
export interface TaskCreatedPayloadV1_1 {
  task: {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    description?: string; // NEW: Optional field
    priority?: 'low' | 'medium' | 'high'; // NEW: Optional field
  };
  creator: {
    id: string;
    name: string;
    email?: string; // NEW: Optional field
  };
}

export class TaskCreatedEventV1_1 extends DomainEvent<TaskCreatedPayloadV1_1> {
  readonly eventType = 'task.created' as const;

  constructor(payload: TaskCreatedPayloadV1_1) {
    super({
      aggregateId: payload.task.id,
      aggregateType: 'task',
      metadata: { version: '1.1' }
    });
    this.payload = payload;
  }
}

/**
 * Version 2.0: Breaking changes
 */
export interface TaskCreatedPayloadV2_0 {
  task: {
    id: string;
    title: string;
    // BREAKING: Status restructured
    state: {
      status: 'pending' | 'in-progress' | 'completed' | 'archived';
      subStatus?: string;
      transitions: Array<{ from: string; to: string; at: Date }>;
    };
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  // BREAKING: Renamed from creator to createdBy
  createdBy: {
    id: string;
    name: string;
    email: string; // BREAKING: Now required
    role: string; // NEW: Required field
  };
  // NEW: Blueprint context
  blueprint: {
    id: string;
    name: string;
  };
}

export class TaskCreatedEventV2_0 extends DomainEvent<TaskCreatedPayloadV2_0> {
  readonly eventType = 'task.created' as const;

  constructor(payload: TaskCreatedPayloadV2_0) {
    super({
      aggregateId: payload.task.id,
      aggregateType: 'task',
      metadata: { version: '2.0' }
    });
    this.payload = payload;
  }
}

// ========================================
// Upcasters
// ========================================

/**
 * Upcast from V1.0 to V1.1
 *
 * Adds optional fields with default values
 */
export class TaskCreatedUpcaster_1_0_to_1_1 extends BaseEventUpcaster<TaskCreatedEventV1_0, TaskCreatedEventV1_1> {
  readonly fromVersion = '1.0';
  readonly toVersion = '1.1';
  readonly eventType = 'task.created';

  protected transform(event: TaskCreatedEventV1_0): TaskCreatedEventV1_1 {
    return new TaskCreatedEventV1_1({
      task: {
        ...event.payload.task,
        description: undefined, // Add optional field
        priority: undefined // Add optional field
      },
      creator: {
        ...event.payload.creator,
        email: undefined // Add optional field
      }
    });
  }
}

/**
 * Upcast from V1.1 to V2.0
 *
 * Handles breaking changes:
 * - Restructure status to state
 * - Rename creator to createdBy
 * - Make email required (with default)
 * - Add role field
 * - Add blueprint context
 */
export class TaskCreatedUpcaster_1_1_to_2_0 extends BaseEventUpcaster<TaskCreatedEventV1_1, TaskCreatedEventV2_0> {
  readonly fromVersion = '1.1';
  readonly toVersion = '2.0';
  readonly eventType = 'task.created';

  protected transform(event: TaskCreatedEventV1_1): TaskCreatedEventV2_0 {
    return new TaskCreatedEventV2_0({
      task: {
        id: event.payload.task.id,
        title: event.payload.task.title,
        // Restructure status -> state
        state: {
          status: event.payload.task.status,
          subStatus: undefined,
          transitions: []
        },
        description: event.payload.task.description,
        priority: event.payload.task.priority
      },
      // Rename creator -> createdBy
      createdBy: {
        id: event.payload.creator.id,
        name: event.payload.creator.name,
        email: event.payload.creator.email || 'unknown@example.com', // Default value
        role: 'member' // Default role
      },
      // Add blueprint context (requires external data or defaults)
      blueprint: {
        id: 'unknown',
        name: 'Unknown Blueprint'
      }
    });
  }
}

/**
 * Combined upcaster (V1.0 -> V2.0)
 *
 * Directly upcast from V1.0 to V2.0 for performance
 * (avoids intermediate V1.1 transformation)
 */
export class TaskCreatedUpcaster_1_0_to_2_0 extends BaseEventUpcaster<TaskCreatedEventV1_0, TaskCreatedEventV2_0> {
  readonly fromVersion = '1.0';
  readonly toVersion = '2.0';
  readonly eventType = 'task.created';

  protected transform(event: TaskCreatedEventV1_0): TaskCreatedEventV2_0 {
    return new TaskCreatedEventV2_0({
      task: {
        id: event.payload.task.id,
        title: event.payload.task.title,
        state: {
          status: event.payload.task.status,
          subStatus: undefined,
          transitions: []
        },
        description: undefined,
        priority: undefined
      },
      createdBy: {
        id: event.payload.creator.id,
        name: event.payload.creator.name,
        email: 'unknown@example.com',
        role: 'member'
      },
      blueprint: {
        id: 'unknown',
        name: 'Unknown Blueprint'
      }
    });
  }
}

// ========================================
// Usage Example
// ========================================

/**
 * Example: Using versioned events with upcasters
 *
 * ```typescript
 * import { inject } from '@angular/core';
 * import { UpcasterChain } from '../versioning/upcaster-chain';
 * import { VersionedEventBus } from '../versioning/versioned-event-bus';
 *
 * // Setup
 * const upcasterChain = inject(UpcasterChain);
 * const versionedBus = inject(VersionedEventBus);
 *
 * // Register upcasters
 * upcasterChain.register(new TaskCreatedUpcaster_1_0_to_1_1());
 * upcasterChain.register(new TaskCreatedUpcaster_1_1_to_2_0());
 * // Or use direct upcaster for performance
 * upcasterChain.register(new TaskCreatedUpcaster_1_0_to_2_0());
 *
 * // Publish V1.0 event
 * const eventV1 = new TaskCreatedEventV1_0({
 *   task: { id: 'task-1', title: 'Test Task', status: 'pending' },
 *   creator: { id: 'user-1', name: 'John Doe' }
 * });
 *
 * await versionedBus.publish(eventV1);
 *
 * // Subscribe with automatic upcasting to latest (V2.0)
 * await versionedBus.subscribe('task.created', (event: TaskCreatedEventV2_0) => {
 *   // event is automatically upcasted to V2.0
 *   console.log(event.payload.createdBy.role); // 'member'
 *   console.log(event.payload.task.state.status); // 'pending'
 * }, { targetVersion: 'latest' });
 *
 * // Subscribe to specific version
 * await versionedBus.subscribe('task.created', (event: TaskCreatedEventV1_1) => {
 *   // event is upcasted to V1.1 only
 *   console.log(event.payload.creator.name); // 'John Doe'
 * }, { targetVersion: '1.1' });
 * ```
 */
