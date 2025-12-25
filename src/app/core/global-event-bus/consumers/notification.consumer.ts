/**
 * Notification Consumer
 *
 * Handles domain events and sends notifications via multiple channels.
 *
 * @module Consumers/Notification
 */

import { Injectable, inject } from '@angular/core';

import { EventHandler } from '../decorators/event-handler.decorator';
import { Retry } from '../decorators/retry.decorator';
import { Subscribe } from '../decorators/subscribe.decorator';
import { TaskCreatedEvent, TaskAssignedEvent, TaskCompletedEvent, UserRegisteredEvent } from '../domain-events';
import { EventConsumer } from '../services/event-consumer.base';

/**
 * Notification channel type
 */
type NotificationChannel = 'email' | 'push' | 'sms' | 'in-app';

/**
 * Notification Consumer
 *
 * Priority: 10 (high priority for timely notifications)
 * Tags: notification, email, push
 *
 * Sends notifications via multiple channels when domain events occur.
 * Implements retry logic for transient failures.
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 10,
  tags: ['notification', 'email', 'push'],
  description: 'Sends notifications for domain events',
  group: 'notifications',
  version: '1.0.0'
})
export class NotificationConsumer extends EventConsumer {
  /**
   * Handle task created event
   *
   * Sends notification to task creator and blueprint members.
   */
  @Subscribe('task.created')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { task, userId } = event.payload;

    console.log('[NotificationConsumer] Task created:', task.id);

    // Send notification to creator
    await this.sendNotification({
      userId,
      channel: 'in-app',
      title: 'Task Created',
      body: `Task "${task.title}" has been created successfully.`,
      data: { taskId: task.id, eventId: event.eventId }
    });

    // Send email to assignee if assigned
    if (task.assigneeId && task.assigneeId !== userId) {
      await this.sendNotification({
        userId: task.assigneeId,
        channel: 'email',
        title: 'New Task Assigned',
        body: `You have been assigned to task "${task.title}".`,
        data: { taskId: task.id, eventId: event.eventId }
      });
    }
  }

  /**
   * Handle task assigned event
   *
   * Notifies the assignee about the new assignment.
   */
  @Subscribe('task.assigned')
  @Retry({ maxAttempts: 3, backoff: 'exponential', initialDelay: 1000 })
  async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    const { taskId, assigneeId, assigneeType } = event.payload;

    console.log('[NotificationConsumer] Task assigned:', taskId, 'to', assigneeId);

    // Send multi-channel notification
    await Promise.all([
      this.sendNotification({
        userId: assigneeId,
        channel: 'push',
        title: 'Task Assigned',
        body: `You have been assigned to a task.`,
        data: { taskId, eventId: event.eventId, assigneeType }
      }),
      this.sendNotification({
        userId: assigneeId,
        channel: 'in-app',
        title: 'Task Assigned',
        body: `You have been assigned to a task.`,
        data: { taskId, eventId: event.eventId, assigneeType }
      })
    ]);
  }

  /**
   * Handle task completed event
   *
   * Congratulates the assignee and notifies stakeholders.
   */
  @Subscribe('task.completed')
  @Retry({ maxAttempts: 2, backoff: 'linear', initialDelay: 500 })
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const { taskId, userId } = event.payload;

    console.log('[NotificationConsumer] Task completed:', taskId);

    // Congratulate the user
    await this.sendNotification({
      userId,
      channel: 'in-app',
      title: 'Task Completed! 🎉',
      body: `Great job completing the task!`,
      data: { taskId, eventId: event.eventId }
    });
  }

  /**
   * Handle user registered event
   *
   * Sends welcome email to new users.
   */
  @Subscribe('user.registered')
  @Retry({ maxAttempts: 5, backoff: 'exponential', initialDelay: 2000 })
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    const { user, provider } = event.payload;

    console.log('[NotificationConsumer] User registered:', user.id);

    // Send welcome email
    await this.sendNotification({
      userId: user.id,
      channel: 'email',
      title: 'Welcome to GigHub!',
      body: `Welcome ${user.displayName || 'there'}! Your account has been created via ${provider}.`,
      data: { provider, eventId: event.eventId }
    });
  }

  /**
   * Send notification via specified channel
   *
   * @private
   */
  private async sendNotification(options: {
    userId: string;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    // Simulate notification sending
    console.log(`[NotificationConsumer] Sending ${options.channel} notification to ${options.userId}:`, options.title);

    // In production, integrate with:
    // - Email: SendGrid, AWS SES, Mailgun
    // - Push: Firebase Cloud Messaging, OneSignal
    // - SMS: Twilio, AWS SNS
    // - In-app: Custom notification service

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
