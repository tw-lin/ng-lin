import { inject, Injectable } from '@angular/core';

import { InMemoryEventBus } from '../services';
import { TaskCreatedEvent, TaskUpdatedEvent, TaskCompletedEvent } from './task-events';

/**
 * Example: Task Service
 *
 * Demonstrates how to publish domain events from a service.
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleTaskService {
  private readonly eventBus = inject(InMemoryEventBus);

  /**
   * Create a new task and publish TaskCreatedEvent
   */
  async createTask(data: {
    title: string;
    description: string;
    blueprintId: string;
    creatorId: string;
    creatorName: string;
  }): Promise<void> {
    // 1. Execute business logic (simulated)
    const task = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      status: 'pending' as const,
      blueprintId: data.blueprintId,
      createdAt: new Date()
    };

    console.log('Task created:', task);

    // 2. Publish domain event
    await this.eventBus.publish(
      new TaskCreatedEvent({
        task,
        creator: {
          id: data.creatorId,
          name: data.creatorName
        }
      })
    );

    console.log('TaskCreatedEvent published');
  }

  /**
   * Update a task and publish TaskUpdatedEvent
   */
  async updateTask(taskId: string, changes: Record<string, unknown>, updatedById: string, updatedByName: string): Promise<void> {
    // 1. Execute business logic (simulated)
    console.log('Task updated:', taskId, changes);

    // 2. Publish domain event
    await this.eventBus.publish(
      new TaskUpdatedEvent({
        taskId,
        changes,
        updatedBy: {
          id: updatedById,
          name: updatedByName
        }
      })
    );

    console.log('TaskUpdatedEvent published');
  }

  /**
   * Complete a task and publish TaskCompletedEvent
   */
  async completeTask(taskId: string, completedById: string, completedByName: string): Promise<void> {
    // 1. Execute business logic (simulated)
    console.log('Task completed:', taskId);

    // 2. Publish domain event
    await this.eventBus.publish(
      new TaskCompletedEvent({
        taskId,
        completedBy: {
          id: completedById,
          name: completedByName
        },
        completedAt: new Date()
      })
    );

    console.log('TaskCompletedEvent published');
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
