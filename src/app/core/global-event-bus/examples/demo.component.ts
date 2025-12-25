import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { InMemoryEventBus } from '../services';
import { ExampleAnalyticsConsumer } from './analytics.consumer';
import { ExampleNotificationConsumer } from './notification.consumer';
import { TaskCreatedEvent, TaskCompletedEvent } from './task-events';
import { ExampleTaskService } from './task.service';

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

/**
 * Example: Event Bus Demo Component
 *
 * Demonstrates how to use the event bus in a component.
 * Shows both publishing events and subscribing to event streams.
 */
@Component({
  selector: 'app-event-bus-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <h2>Global Event Bus Demo</h2>

      <div class="metrics">
        <div class="metric"> <strong>Total Events:</strong> {{ eventBus.totalEvents() }} </div>
        <div class="metric"> <strong>Active Subscriptions:</strong> {{ eventBus.subscriptionCount() }} </div>
        <div class="metric"> <strong>Tasks Created:</strong> {{ analyticsConsumer.totalTasksCreated() }} </div>
        <div class="metric"> <strong>Tasks Completed:</strong> {{ analyticsConsumer.totalTasksCompleted() }} </div>
      </div>

      <div class="actions">
        <button (click)="createTask()">Create Task</button>
        <button (click)="updateTask()" [disabled]="recentTasks().length === 0"> Update Last Task </button>
        <button (click)="completeTask()" [disabled]="recentTasks().length === 0"> Complete Last Task </button>
      </div>

      <div class="recent-tasks">
        <h3>Recent Tasks (from event stream)</h3>
        @if (recentTasks().length === 0) {
          <p>No tasks yet. Click "Create Task" to get started.</p>
        } @else {
          <ul>
            @for (task of recentTasks(); track task.id) {
              <li>
                <strong>{{ task.title }}</strong> - {{ task.status }}
                <br />
                <small>Created: {{ task.createdAt.toLocaleString() }}</small>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: 20px 0;
      }

      .metric {
        padding: 15px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .actions {
        display: flex;
        gap: 10px;
        margin: 20px 0;
      }

      button {
        padding: 10px 20px;
        background: #1890ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover:not(:disabled) {
        background: #40a9ff;
      }

      button:disabled {
        background: #d9d9d9;
        cursor: not-allowed;
      }

      .recent-tasks {
        margin-top: 30px;
      }

      ul {
        list-style: none;
        padding: 0;
      }

      li {
        padding: 15px;
        background: #fafafa;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        margin-bottom: 10px;
      }
    `
  ]
})
export class EventBusDemoComponent implements OnInit {
  readonly eventBus = inject(InMemoryEventBus);
  readonly taskService = inject(ExampleTaskService);
  readonly notificationConsumer = inject(ExampleNotificationConsumer);
  readonly analyticsConsumer = inject(ExampleAnalyticsConsumer);
  private readonly destroyRef = inject(DestroyRef);

  readonly recentTasks = signal<Task[]>([]);
  private taskCounter = 0;

  async ngOnInit(): Promise<void> {
    // Initialize consumers
    await this.notificationConsumer.ngOnInit();
    await this.analyticsConsumer.ngOnInit();

    // Subscribe to task creation events
    this.eventBus
      .observe<TaskCreatedEvent>('task.created')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.recentTasks.update(tasks =>
          [
            {
              id: event.payload.task.id,
              title: event.payload.task.title,
              status: event.payload.task.status,
              createdAt: event.payload.task.createdAt
            },
            ...tasks
          ].slice(0, 5)
        );
      });

    // Subscribe to task completion events
    this.eventBus
      .observe<TaskCompletedEvent>('task.completed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.recentTasks.update(tasks => tasks.map(task => (task.id === event.payload.taskId ? { ...task, status: 'completed' } : task)));
      });

    console.log('EventBusDemoComponent initialized');
  }

  async createTask(): Promise<void> {
    this.taskCounter++;

    await this.taskService.createTask({
      title: `Example Task ${this.taskCounter}`,
      description: `This is example task number ${this.taskCounter}`,
      blueprintId: 'blueprint-1',
      creatorId: 'user-1',
      creatorName: 'Demo User'
    });
  }

  async updateTask(): Promise<void> {
    const tasks = this.recentTasks();
    if (tasks.length === 0) return;

    const lastTask = tasks[0];

    await this.taskService.updateTask(lastTask.id, { title: `${lastTask.title} (updated)` }, 'user-1', 'Demo User');
  }

  async completeTask(): Promise<void> {
    const tasks = this.recentTasks();
    if (tasks.length === 0) return;

    const lastTask = tasks[0];

    await this.taskService.completeTask(lastTask.id, 'user-1', 'Demo User');
  }
}
