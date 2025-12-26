/**
 * Analytics Consumer
 *
 * Collects analytics data from domain events for business intelligence.
 *
 * @module Consumers/Analytics
 */

import { Injectable, inject, signal, computed } from '@angular/core';

import { EventHandler } from '../decorators/event-handler.decorator';
import { Subscribe } from '../decorators/subscribe.decorator';
import { DomainEvent } from '../models/base-event';
import { EventConsumer } from '../services/event-consumer.base';

/**
 * Analytics metrics
 */
interface AnalyticsMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  userActivity: Record<string, number>;
  taskMetrics: {
    created: number;
    completed: number;
    assigned: number;
  };
  userMetrics: {
    registered: number;
    logins: number;
  };
}

/**
 * Analytics Consumer
 *
 * Priority: 1 (low priority, non-critical)
 * Tags: analytics, metrics, bi
 *
 * Tracks metrics and analytics from all domain events.
 * Non-critical, so failures won't retry extensively.
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 1,
  tags: ['analytics', 'metrics', 'bi'],
  description: 'Collects analytics data from events',
  group: 'analytics',
  version: '1.0.0'
})
export class AnalyticsConsumer extends EventConsumer {
  /**
   * Analytics metrics (Signals for reactivity)
   */
  private _metrics = signal<AnalyticsMetrics>({
    totalEvents: 0,
    eventsByType: {},
    userActivity: {},
    taskMetrics: { created: 0, completed: 0, assigned: 0 },
    userMetrics: { registered: 0, logins: 0 }
  });

  /**
   * Public readonly metrics
   */
  readonly metrics = this._metrics.asReadonly();

  /**
   * Computed: Most active users
   */
  readonly mostActiveUsers = computed(() => {
    const activity = this._metrics().userActivity;
    return Object.entries(activity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
  });

  /**
   * Computed: Most common event types
   */
  readonly topEventTypes = computed(() => {
    const types = this._metrics().eventsByType;
    return Object.entries(types)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([eventType, count]) => ({ eventType, count }));
  });

  /**
   * Subscribe to all events for analytics
   *
   * Note: Using wildcard '**' to capture all events
   */
  @Subscribe('**')
  async handleAllEvents(event: DomainEvent<any>): Promise<void> {
    this.trackEvent(event);
  }

  /**
   * Track specific task events with detailed metrics
   */
  @Subscribe('task.created')
  async handleTaskCreated(event: DomainEvent<any>): Promise<void> {
    this._metrics.update(m => ({
      ...m,
      taskMetrics: { ...m.taskMetrics, created: m.taskMetrics.created + 1 }
    }));

    console.log('[AnalyticsConsumer] Task created metric updated');
  }

  @Subscribe('task.completed')
  async handleTaskCompleted(event: DomainEvent<any>): Promise<void> {
    this._metrics.update(m => ({
      ...m,
      taskMetrics: { ...m.taskMetrics, completed: m.taskMetrics.completed + 1 }
    }));

    console.log('[AnalyticsConsumer] Task completed metric updated');
  }

  @Subscribe('task.assigned')
  async handleTaskAssigned(event: DomainEvent<any>): Promise<void> {
    this._metrics.update(m => ({
      ...m,
      taskMetrics: { ...m.taskMetrics, assigned: m.taskMetrics.assigned + 1 }
    }));

    console.log('[AnalyticsConsumer] Task assigned metric updated');
  }

  /**
   * Track user registration
   */
  @Subscribe('user.registered')
  async handleUserRegistered(event: DomainEvent<any>): Promise<void> {
    this._metrics.update(m => ({
      ...m,
      userMetrics: { ...m.userMetrics, registered: m.userMetrics.registered + 1 }
    }));

    console.log('[AnalyticsConsumer] User registration metric updated');
  }

  /**
   * Track user login
   */
  @Subscribe('user.login')
  async handleUserLogin(event: DomainEvent<any>): Promise<void> {
    this._metrics.update(m => ({
      ...m,
      userMetrics: { ...m.userMetrics, logins: m.userMetrics.logins + 1 }
    }));

    console.log('[AnalyticsConsumer] User login metric updated');
  }

  /**
   * Track event in analytics
   */
  private trackEvent(event: DomainEvent<any>): void {
    const userId = this.extractUserId(event.payload);

    this._metrics.update(m => ({
      totalEvents: m.totalEvents + 1,
      eventsByType: {
        ...m.eventsByType,
        [event.eventType]: (m.eventsByType[event.eventType] || 0) + 1
      },
      userActivity: {
        ...m.userActivity,
        [userId]: (m.userActivity[userId] || 0) + 1
      },
      taskMetrics: m.taskMetrics,
      userMetrics: m.userMetrics
    }));

    // In production, send to analytics platform:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics service
    this.sendToAnalyticsPlatform(event);
  }

  /**
   * Extract user ID from payload
   */
  private extractUserId(payload: any): string {
    return payload?.userId || payload?.user?.id || 'anonymous';
  }

  /**
   * Send event to external analytics platform
   */
  private sendToAnalyticsPlatform(event: DomainEvent<any>): void {
    // Simulate sending to analytics platform
    console.log('[AnalyticsConsumer] Sending to analytics:', event.eventType);

    // In production:
    // await this.googleAnalytics.trackEvent({
    //   category: event.aggregateType || 'Unknown',
    //   action: event.eventType,
    //   label: event.aggregateId,
    //   value: 1
    // });
  }

  /**
   * Get completion rate for tasks
   */
  getTaskCompletionRate(): number {
    const metrics = this._metrics().taskMetrics;
    if (metrics.created === 0) return 0;
    return Math.round((metrics.completed / metrics.created) * 100);
  }

  /**
   * Export metrics for reporting
   */
  exportMetrics(): AnalyticsMetrics {
    return this._metrics();
  }
}
