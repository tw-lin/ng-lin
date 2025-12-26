/**
 * Activity Feed Consumer
 * 
 * Tracks user activity and updates activity feed for visibility.
 * 
 * @module Consumers/ActivityFeed
 */

import { Injectable, inject, signal } from '@angular/core';
import { EventConsumer } from '../services/event-consumer.base';
import { Subscribe } from '../decorators/subscribe.decorator';
import { EventHandler } from '../decorators/event-handler.decorator';
import { DomainEvent } from '../models/base-event';

/**
 * Activity item interface
 */
interface ActivityItem {
  readonly id: string;
  readonly userId: string;
  readonly eventType: string;
  readonly action: string;
  readonly description: string;
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;
}

/**
 * Activity Feed Consumer
 * 
 * Priority: 5 (medium priority)
 * Tags: activity, feed, timeline
 * 
 * Captures domain events and creates activity feed entries for user timelines.
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 5,
  tags: ['activity', 'feed', 'timeline'],
  description: 'Updates activity feed with domain events',
  group: 'feeds',
  version: '1.0.0'
})
export class ActivityFeedConsumer extends EventConsumer {
  /**
   * Recent activities (in-memory for demo)
   */
  private _activities = signal<ActivityItem[]>([]);
  readonly activities = this._activities.asReadonly();

  /**
   * Subscribe to all task events
   */
  @Subscribe('task.*')
  async handleTaskEvent(event: DomainEvent<any>): Promise<void> {
    const activity = this.createActivityItem(event, 'Task');
    this.addActivity(activity);
    
    console.log('[ActivityFeedConsumer] Task activity:', activity.action);
  }

  /**
   * Subscribe to all user events
   */
  @Subscribe('user.*')
  async handleUserEvent(event: DomainEvent<any>): Promise<void> {
    const activity = this.createActivityItem(event, 'User');
    this.addActivity(activity);
    
    console.log('[ActivityFeedConsumer] User activity:', activity.action);
  }

  /**
   * Subscribe to all blueprint events
   */
  @Subscribe('blueprint.*')
  async handleBlueprintEvent(event: DomainEvent<any>): Promise<void> {
    const activity = this.createActivityItem(event, 'Blueprint');
    this.addActivity(activity);
    
    console.log('[ActivityFeedConsumer] Blueprint activity:', activity.action);
  }

  /**
   * Create activity item from domain event
   */
  private createActivityItem(
    event: DomainEvent<any>,
    entityType: string
  ): ActivityItem {
    const action = this.extractAction(event.eventType);
    const userId = this.extractUserId(event.payload);
    
    return {
      id: event.eventId,
      userId,
      eventType: event.eventType,
      action,
      description: this.generateDescription(entityType, action, event.payload),
      timestamp: event.timestamp,
      metadata: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        correlationId: event.metadata?.correlationId
      }
    };
  }

  /**
   * Extract action from event type (e.g., "task.created" -> "created")
   */
  private extractAction(eventType: string): string {
    const parts = eventType.split('.');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Extract user ID from payload
   */
  private extractUserId(payload: any): string {
    return payload?.userId || payload?.user?.id || 'system';
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(
    entityType: string,
    action: string,
    payload: any
  ): string {
    const templates: Record<string, string> = {
      'task.created': `Created task "${payload?.task?.title || 'Untitled'}"`,
      'task.updated': `Updated task`,
      'task.assigned': `Assigned task to ${payload?.assigneeType || 'user'}`,
      'task.completed': `Completed task`,
      'user.registered': `Joined GigHub via ${payload?.provider || 'email'}`,
      'user.login': `Logged in via ${payload?.provider || 'email'}`,
      'blueprint.created': `Created blueprint "${payload?.blueprint?.name || 'Untitled'}"`,
      'blueprint.published': `Published blueprint`,
      'default': `${action} ${entityType.toLowerCase()}`
    };
    
    const key = `${entityType.toLowerCase()}.${action}`;
    return templates[key] || templates['default'];
  }

  /**
   * Add activity to feed (limit to 100 recent items)
   */
  private addActivity(activity: ActivityItem): void {
    this._activities.update(activities => {
      const updated = [activity, ...activities];
      return updated.slice(0, 100); // Keep only recent 100
    });
    
    // In production, persist to database
    // await this.activityRepository.create(activity);
  }

  /**
   * Get activities for specific user
   */
  getActivitiesForUser(userId: string): ActivityItem[] {
    return this._activities().filter(a => a.userId === userId);
  }

  /**
   * Get activities for specific blueprint/project
   */
  getActivitiesForAggregate(aggregateId: string): ActivityItem[] {
    return this._activities().filter(
      a => a.metadata['aggregateId'] === aggregateId
    );
  }
}
