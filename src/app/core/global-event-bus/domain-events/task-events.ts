/**
 * Task Domain Events
 * 
 * Defines all events related to task lifecycle and operations.
 * 
 * @module DomainEvents/Task
 */

import { DomainEvent } from '../models/base-event';

/**
 * Task payload interface
 */
export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'archived';
  readonly assigneeId?: string;
  readonly assigneeType?: 'user' | 'team' | 'partner';
  readonly blueprintId: string;
  readonly dueDate?: Date;
  readonly priority?: 'low' | 'medium' | 'high';
  readonly tags?: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Event: Task Created
 * 
 * Published when a new task is created in the system.
 * 
 * @example
 * ```typescript
 * const event = new TaskCreatedEvent({
 *   task: {
 *     id: 'task-123',
 *     title: 'Implement feature',
 *     blueprintId: 'blueprint-1',
 *     status: 'pending'
 *   },
 *   userId: 'user-456'
 * });
 * await eventBus.publish(event);
 * ```
 */
export class TaskCreatedEvent extends DomainEvent<{
  task: Task;
  userId: string;
}> {
  readonly eventType = 'task.created' as const;

  constructor(payload: { task: Task; userId: string }) {
    super(payload, {
      aggregateId: payload.task.id,
      aggregateType: 'Task',
      aggregateVersion: 1
    });
  }
}

/**
 * Event: Task Updated
 * 
 * Published when task properties are modified.
 */
export class TaskUpdatedEvent extends DomainEvent<{
  taskId: string;
  changes: Partial<Task>;
  previousValues: Partial<Task>;
  userId: string;
}> {
  readonly eventType = 'task.updated' as const;

  constructor(payload: {
    taskId: string;
    changes: Partial<Task>;
    previousValues: Partial<Task>;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.taskId,
      aggregateType: 'Task'
    });
  }
}

/**
 * Event: Task Status Changed
 * 
 * Published when task status transitions.
 */
export class TaskStatusChangedEvent extends DomainEvent<{
  taskId: string;
  previousStatus: Task['status'];
  newStatus: Task['status'];
  userId: string;
}> {
  readonly eventType = 'task.status.changed' as const;

  constructor(payload: {
    taskId: string;
    previousStatus: Task['status'];
    newStatus: Task['status'];
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.taskId,
      aggregateType: 'Task'
    });
  }
}

/**
 * Event: Task Assigned
 * 
 * Published when task is assigned to a user, team, or partner.
 */
export class TaskAssignedEvent extends DomainEvent<{
  taskId: string;
  assigneeId: string;
  assigneeType: 'user' | 'team' | 'partner';
  previousAssigneeId?: string;
  userId: string;
}> {
  readonly eventType = 'task.assigned' as const;

  constructor(payload: {
    taskId: string;
    assigneeId: string;
    assigneeType: 'user' | 'team' | 'partner';
    previousAssigneeId?: string;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.taskId,
      aggregateType: 'Task'
    });
  }
}

/**
 * Event: Task Deleted
 * 
 * Published when task is deleted (soft or hard delete).
 */
export class TaskDeletedEvent extends DomainEvent<{
  taskId: string;
  blueprintId: string;
  soft: boolean;
  userId: string;
}> {
  readonly eventType = 'task.deleted' as const;

  constructor(payload: {
    taskId: string;
    blueprintId: string;
    soft: boolean;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.taskId,
      aggregateType: 'Task'
    });
  }
}

/**
 * Event: Task Completed
 * 
 * Published when task is marked as completed.
 */
export class TaskCompletedEvent extends DomainEvent<{
  taskId: string;
  completedAt: Date;
  userId: string;
}> {
  readonly eventType = 'task.completed' as const;

  constructor(payload: {
    taskId: string;
    completedAt: Date;
    userId: string;
  }) {
    super(payload, {
      aggregateId: payload.taskId,
      aggregateType: 'Task'
    });
  }
}
