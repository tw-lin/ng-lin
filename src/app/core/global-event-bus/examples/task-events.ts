import { DomainEvent } from '../models';

/**
 * Example: Task Created Event
 *
 * This event is published when a new task is created in the system.
 */
export class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  readonly aggregateType = 'task' as const;

  readonly payload: Readonly<{
    task: Readonly<{
      id: string;
      title: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed';
      assigneeId?: string;
      blueprintId: string;
      createdAt: Date;
    }>;
    creator: Readonly<{
      id: string;
      name: string;
    }>;
  }>;

  constructor(data: {
    task: {
      id: string;
      title: string;
      description: string;
      status: 'pending' | 'in-progress' | 'completed';
      assigneeId?: string;
      blueprintId: string;
      createdAt: Date;
    };
    creator: {
      id: string;
      name: string;
    };
  }) {
    super({
      aggregateId: data.task.id,
      aggregateType: 'task',
      metadata: {
        version: '1.0',
        source: 'task-service'
      }
    });

    this.payload = {
      task: { ...data.task },
      creator: { ...data.creator }
    };
  }
}

/**
 * Example: Task Updated Event
 *
 * This event is published when a task is updated.
 */
export class TaskUpdatedEvent extends DomainEvent {
  readonly eventType = 'task.updated' as const;
  readonly aggregateType = 'task' as const;

  readonly payload: Readonly<{
    taskId: string;
    changes: Readonly<Record<string, unknown>>;
    updatedBy: Readonly<{
      id: string;
      name: string;
    }>;
  }>;

  constructor(data: {
    taskId: string;
    changes: Record<string, unknown>;
    updatedBy: {
      id: string;
      name: string;
    };
  }) {
    super({
      aggregateId: data.taskId,
      aggregateType: 'task',
      metadata: {
        version: '1.0',
        source: 'task-service'
      }
    });

    this.payload = {
      taskId: data.taskId,
      changes: { ...data.changes },
      updatedBy: { ...data.updatedBy }
    };
  }
}

/**
 * Example: Task Completed Event
 *
 * This event is published when a task is marked as completed.
 */
export class TaskCompletedEvent extends DomainEvent {
  readonly eventType = 'task.completed' as const;
  readonly aggregateType = 'task' as const;

  readonly payload: Readonly<{
    taskId: string;
    completedBy: Readonly<{
      id: string;
      name: string;
    }>;
    completedAt: Date;
  }>;

  constructor(data: {
    taskId: string;
    completedBy: {
      id: string;
      name: string;
    };
    completedAt: Date;
  }) {
    super({
      aggregateId: data.taskId,
      aggregateType: 'task',
      metadata: {
        version: '1.0',
        source: 'task-service'
      }
    });

    this.payload = {
      taskId: data.taskId,
      completedBy: { ...data.completedBy },
      completedAt: data.completedAt
    };
  }
}
