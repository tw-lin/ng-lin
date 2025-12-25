import { Injectable, OnInit, signal } from '@angular/core';

import { EventConsumer, Subscribe } from '../';
import { TaskCreatedEvent, TaskCompletedEvent } from './task-events';

/**
 * Example: Analytics Consumer
 *
 * Demonstrates how to consume events for analytics purposes.
 * Uses Signals to track metrics.
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleAnalyticsConsumer extends EventConsumer implements OnInit {
  // Signals for tracking metrics
  readonly totalTasksCreated = signal(0);
  readonly totalTasksCompleted = signal(0);

  async ngOnInit(): Promise<void> {
    // Initialize event subscriptions
    await this.initialize();
    console.log('AnalyticsConsumer initialized');
  }

  /**
   * Track task creation metrics
   */
  @Subscribe('task.created')
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    // Update metrics
    this.totalTasksCreated.update(count => count + 1);

    console.log('📊 Analytics: Task created');
    console.log('  Total tasks created:', this.totalTasksCreated());

    // Send to analytics service (simulated)
    await this.trackEvent('task_created', {
      taskId: event.payload.task.id,
      blueprintId: event.payload.task.blueprintId,
      creatorId: event.payload.creator.id
    });
  }

  /**
   * Track task completion metrics
   */
  @Subscribe('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    // Update metrics
    this.totalTasksCompleted.update(count => count + 1);

    console.log('📊 Analytics: Task completed');
    console.log('  Total tasks completed:', this.totalTasksCompleted());
    console.log('  Completion rate:', this.getCompletionRate());

    // Send to analytics service (simulated)
    await this.trackEvent('task_completed', {
      taskId: event.payload.taskId,
      completedById: event.payload.completedBy.id
    });
  }

  /**
   * Calculate completion rate
   */
  private getCompletionRate(): string {
    const created = this.totalTasksCreated();
    const completed = this.totalTasksCompleted();

    if (created === 0) return '0%';

    const rate = (completed / created) * 100;
    return `${rate.toFixed(1)}%`;
  }

  /**
   * Send event to analytics service (simulated)
   */
  private async trackEvent(eventName: string, properties: Record<string, unknown>): Promise<void> {
    console.log(`  📈 Tracking: ${eventName}`, properties);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
