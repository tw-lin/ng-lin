import type { EventHandler } from '../interfaces/event-handler.interface';
import type { DomainEvent } from '../models/base-event';

/**
 * Mock Event Bus for Testing
 * Jest-compatible mock implementation
 */
export class MockEventBus {
  publishedEvents: Array<DomainEvent<any>> = [];
  subscriptions = new Map<string, Array<EventHandler<any>>>();

  async publish(event: DomainEvent<any>): Promise<void> {
    this.publishedEvents.push(event);
  }

  async subscribe<T extends DomainEvent<any>>(eventType: string, handler: EventHandler<T>): Promise<void> {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(handler);
  }

  assertEventPublished(eventType: string): void {
    const found = this.publishedEvents.some(e => e.eventType === eventType);
    if (!found) {
      throw new Error(`Event ${eventType} was not published`);
    }
  }

  reset(): void {
    this.publishedEvents = [];
    this.subscriptions.clear();
  }
}
