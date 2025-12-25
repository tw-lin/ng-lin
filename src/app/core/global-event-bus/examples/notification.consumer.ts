import { Injectable, OnInit, inject } from '@angular/core';

import { EventConsumer, Subscribe } from '../';
import { TaskCreatedEvent, TaskUpdatedEvent, TaskCompletedEvent } from './task-events';

/**
 * Example: Notification Consumer
 *
 * Demonstrates how to consume events using @Subscribe decorator.
 * This consumer sends notifications when tasks are created, updated, or completed.
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleNotificationConsumer extends EventConsumer implements OnInit {
  async ngOnInit(): Promise<void> {
    // Initialize event subscriptions
    await this.initialize();
    console.log('NotificationConsumer initialized');
  }

  /**
   * Handle task created events
   * Sends notification to relevant users
   */
  @Subscribe('task.created', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000
    }
  })
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    console.log('📧 Sending notification: New task created');
    console.log('  Task:', event.payload.task.title);
    console.log('  Creator:', event.payload.creator.name);

    // Simulate notification sending
    await this.simulateDelay(100);

    console.log('✅ Notification sent successfully');
  }

  /**
   * Handle task updated events
   * Sends notification about task changes
   */
  @Subscribe('task.updated')
  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    console.log('📧 Sending notification: Task updated');
    console.log('  Task ID:', event.payload.taskId);
    console.log('  Changes:', Object.keys(event.payload.changes).join(', '));
    console.log('  Updated by:', event.payload.updatedBy.name);

    // Simulate notification sending
    await this.simulateDelay(100);

    console.log('✅ Notification sent successfully');
  }

  /**
   * Handle task completed events
   * Sends notification about task completion
   */
  @Subscribe('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    console.log('🎉 Sending notification: Task completed');
    console.log('  Task ID:', event.payload.taskId);
    console.log('  Completed by:', event.payload.completedBy.name);
    console.log('  Completed at:', event.payload.completedAt);

    // Simulate notification sending
    await this.simulateDelay(100);

    console.log('✅ Notification sent successfully');
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
