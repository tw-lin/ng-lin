import { DomainEvent } from '../models/base-event';

/**
 * Test Event Builder
 * Fluent API for creating test events
 */
export class TestEvent<T = any> {
  private event: Partial<DomainEvent<T>> = {};

  constructor(eventType: string) {
    this.event.eventType = eventType;
    this.event.eventId = Math.random().toString(36);
    this.event.timestamp = new Date();
  }

  withPayload(payload: T): this {
    this.event.payload = payload;
    return this;
  }

  withAggregateId(id: string): this {
    this.event.aggregateId = id;
    return this;
  }

  build(): DomainEvent<T> {
    return this.event as DomainEvent<T>;
  }

  static createBatch<T>(eventType: string, count: number, payloadFn: (i: number) => T): Array<DomainEvent<T>> {
    return Array.from({ length: count }, (_, i) => new TestEvent<T>(eventType).withPayload(payloadFn(i)).build());
  }
}
