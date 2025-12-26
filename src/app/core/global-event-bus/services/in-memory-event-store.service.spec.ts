import { TestBed } from '@angular/core/testing';

import { DomainEvent } from '../models';
import { InMemoryEventStore } from './in-memory-event-store.service';

// Test event class
class TestEvent extends DomainEvent {
  readonly eventType = 'test.event' as const;
  readonly payload: { message: string };

  constructor(message: string, aggregateId = 'test-1') {
    super({
      aggregateId,
      aggregateType: 'test'
    });
    this.payload = { message };
  }
}

describe('InMemoryEventStore', () => {
  let store: InMemoryEventStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InMemoryEventStore]
    });
    store = TestBed.inject(InMemoryEventStore);
  });

  afterEach(async () => {
    await store.clear();
  });

  describe('append', () => {
    it('should append a single event', async () => {
      const event = new TestEvent('Hello');

      await store.append(event);

      expect(store.count()).toBe(1);
    });

    it('should append multiple events', async () => {
      const event1 = new TestEvent('Event 1');
      const event2 = new TestEvent('Event 2');

      await store.append(event1);
      await store.append(event2);

      expect(store.count()).toBe(2);
    });
  });

  describe('appendBatch', () => {
    it('should append multiple events in a batch', async () => {
      const events = [new TestEvent('Event 1'), new TestEvent('Event 2'), new TestEvent('Event 3')];

      await store.appendBatch(events);

      expect(store.count()).toBe(3);
    });
  });

  describe('getEvents', () => {
    beforeEach(async () => {
      // Setup test data
      await store.appendBatch([new TestEvent('Event 1', 'agg-1'), new TestEvent('Event 2', 'agg-2'), new TestEvent('Event 3', 'agg-1')]);
    });

    it('should get all events when no criteria provided', async () => {
      const events = await store.getEvents({});

      expect(events.length).toBe(3);
    });

    it('should filter by event type', async () => {
      const events = await store.getEvents({
        eventType: 'test.event'
      });

      expect(events.length).toBe(3);
    });

    it('should filter by aggregate ID', async () => {
      const events = await store.getEvents({
        aggregateId: 'agg-1'
      });

      expect(events.length).toBe(2);
      expect(events.every(e => e.aggregateId === 'agg-1')).toBe(true);
    });

    it('should filter by aggregate type', async () => {
      const events = await store.getEvents({
        aggregateType: 'test'
      });

      expect(events.length).toBe(3);
    });

    it('should limit results', async () => {
      const events = await store.getEvents({
        limit: 2
      });

      expect(events.length).toBe(2);
    });

    it('should offset results', async () => {
      const events = await store.getEvents({
        offset: 1,
        order: 'asc'
      });

      expect(events.length).toBe(2);
    });

    it('should sort ascending by default', async () => {
      const events = await store.getEvents({
        order: 'asc'
      });

      for (let i = 1; i < events.length; i++) {
        expect(events[i].timestamp.getTime()).toBeGreaterThanOrEqual(events[i - 1].timestamp.getTime());
      }
    });

    it('should sort descending', async () => {
      const events = await store.getEvents({
        order: 'desc'
      });

      for (let i = 1; i < events.length; i++) {
        expect(events[i].timestamp.getTime()).toBeLessThanOrEqual(events[i - 1].timestamp.getTime());
      }
    });
  });

  describe('getEventsByAggregate', () => {
    beforeEach(async () => {
      await store.appendBatch([new TestEvent('Event 1', 'agg-1'), new TestEvent('Event 2', 'agg-2'), new TestEvent('Event 3', 'agg-1')]);
    });

    it('should get events for a specific aggregate', async () => {
      const events = await store.getEventsByAggregate('agg-1', 'test');

      expect(events.length).toBe(2);
      expect(events.every(e => e.aggregateId === 'agg-1')).toBe(true);
    });

    it('should return empty array for non-existent aggregate', async () => {
      const events = await store.getEventsByAggregate('non-existent', 'test');

      expect(events.length).toBe(0);
    });
  });

  describe('getEventsSince', () => {
    it('should get events since a timestamp', async () => {
      const now = new Date();

      // Add events before timestamp
      await store.append(new TestEvent('Old event'));

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const cutoff = new Date();

      // Add events after timestamp
      await store.append(new TestEvent('New event 1'));
      await store.append(new TestEvent('New event 2'));

      const events = await store.getEventsSince(cutoff);

      expect(events.length).toBe(2);
      expect(events.every(e => e.timestamp >= cutoff)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all events', async () => {
      await store.appendBatch([new TestEvent('Event 1'), new TestEvent('Event 2'), new TestEvent('Event 3')]);

      expect(store.count()).toBe(3);

      await store.clear();

      expect(store.count()).toBe(0);
    });
  });
});
