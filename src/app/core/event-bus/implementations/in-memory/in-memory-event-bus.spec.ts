import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { DomainEvent } from '../models';
import { InMemoryEventBus } from './in-memory-event-bus.service';
import { InMemoryEventStore } from './in-memory-event-store.service';

// Test event classes
class TestEvent extends DomainEvent {
  readonly eventType = 'test.event' as const;
  readonly payload: { message: string };
  
  constructor(message: string, aggregateId: string = 'test-1') {
    super({
      aggregateId,
      aggregateType: 'test'
    });
    this.payload = { message };
  }
}

class AnotherTestEvent extends DomainEvent {
  readonly eventType = 'another.test.event' as const;
  readonly payload: { value: number };
  
  constructor(value: number, aggregateId: string = 'test-1') {
    super({
      aggregateId,
      aggregateType: 'test'
    });
    this.payload = { value };
  }
}

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;
  let eventStore: InMemoryEventStore;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InMemoryEventBus,
        InMemoryEventStore
      ]
    });
    
    eventBus = TestBed.inject(InMemoryEventBus);
    eventStore = TestBed.inject(InMemoryEventStore);
  });
  
  afterEach(() => {
    eventBus.dispose();
  });
  
  describe('publish', () => {
    it('should publish an event', async () => {
      const event = new TestEvent('Hello');
      
      await eventBus.publish(event);
      
      expect(eventBus.totalEvents()).toBe(1);
    });
    
    it('should persist event to store', async () => {
      const event = new TestEvent('Hello');
      
      await eventBus.publish(event);
      
      const storedEvents = await eventStore.getEvents({});
      expect(storedEvents.length).toBe(1);
      expect(storedEvents[0].eventType).toBe('test.event');
    });
    
    it('should execute subscribed handlers', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      await eventBus.subscribe('test.event', handlerSpy);
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      expect(handlerSpy).toHaveBeenCalledOnceWith(event);
    });
  });
  
  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const events = [
        new TestEvent('Event 1'),
        new TestEvent('Event 2'),
        new TestEvent('Event 3')
      ];
      
      await eventBus.publishBatch(events);
      
      expect(eventBus.totalEvents()).toBe(3);
    });
    
    it('should execute handlers for all events', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      await eventBus.subscribe('test.event', handlerSpy);
      
      const events = [
        new TestEvent('Event 1'),
        new TestEvent('Event 2')
      ];
      
      await eventBus.publishBatch(events);
      
      expect(handlerSpy).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('subscribe', () => {
    it('should subscribe to events', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      const subscription = await eventBus.subscribe('test.event', handlerSpy);
      
      expect(subscription).toBeDefined();
      expect(subscription.eventType).toBe('test.event');
      expect(eventBus.subscriptionCount()).toBe(1);
    });
    
    it('should execute handler when event is published', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      await eventBus.subscribe('test.event', handlerSpy);
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      expect(handlerSpy).toHaveBeenCalledWith(event);
    });
    
    it('should not execute handler for different event type', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      await eventBus.subscribe('test.event', handlerSpy);
      
      const event = new AnotherTestEvent(42);
      await eventBus.publish(event);
      
      expect(handlerSpy).not.toHaveBeenCalled();
    });
    
    it('should support multiple handlers for same event', async () => {
      const handler1 = jasmine.createSpy('handler1');
      const handler2 = jasmine.createSpy('handler2');
      
      await eventBus.subscribe('test.event', handler1);
      await eventBus.subscribe('test.event', handler2);
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });
    
    it('should support filter option', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      await eventBus.subscribe('test.event', handlerSpy, {
        filter: (event) => (event as TestEvent).payload.message === 'Filtered'
      });
      
      await eventBus.publish(new TestEvent('Not filtered'));
      await eventBus.publish(new TestEvent('Filtered'));
      
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should support retry policy', async () => {
      let attempts = 0;
      const handler = jasmine.createSpy('handler').and.callFake(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Failed');
        }
      });
      
      await eventBus.subscribe('test.event', handler, {
        retryPolicy: {
          maxAttempts: 3,
          backoff: 'fixed',
          initialDelay: 10
        }
      });
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('unsubscribe', () => {
    it('should unsubscribe from events', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      const subscription = await eventBus.subscribe('test.event', handlerSpy);
      expect(eventBus.subscriptionCount()).toBe(1);
      
      await eventBus.unsubscribe(subscription);
      expect(eventBus.subscriptionCount()).toBe(0);
    });
    
    it('should not execute handler after unsubscribe', async () => {
      const handlerSpy = jasmine.createSpy('handler');
      
      const subscription = await eventBus.subscribe('test.event', handlerSpy);
      await eventBus.unsubscribe(subscription);
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      expect(handlerSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('observe', () => {
    it('should return observable of specific event type', async () => {
      const events$ = eventBus.observe<TestEvent>('test.event');
      const collected: TestEvent[] = [];
      
      events$.pipe(take(2)).subscribe(event => collected.push(event));
      
      await eventBus.publish(new TestEvent('Event 1'));
      await eventBus.publish(new AnotherTestEvent(1));
      await eventBus.publish(new TestEvent('Event 2'));
      
      expect(collected.length).toBe(2);
      expect(collected[0].payload.message).toBe('Event 1');
      expect(collected[1].payload.message).toBe('Event 2');
    });
  });
  
  describe('observeAll', () => {
    it('should return observable of all events', async () => {
      const events$ = eventBus.observeAll();
      const collected: DomainEvent[] = [];
      
      events$.pipe(take(3)).subscribe(event => collected.push(event));
      
      await eventBus.publish(new TestEvent('Event 1'));
      await eventBus.publish(new AnotherTestEvent(1));
      await eventBus.publish(new TestEvent('Event 2'));
      
      expect(collected.length).toBe(3);
      expect(collected[0].eventType).toBe('test.event');
      expect(collected[1].eventType).toBe('another.test.event');
      expect(collected[2].eventType).toBe('test.event');
    });
  });
  
  describe('error handling', () => {
    it('should not stop other handlers if one fails', async () => {
      const failingHandler = jasmine.createSpy('failing').and.throwError('Failed');
      const successHandler = jasmine.createSpy('success');
      
      await eventBus.subscribe('test.event', failingHandler);
      await eventBus.subscribe('test.event', successHandler);
      
      const event = new TestEvent('Hello');
      await eventBus.publish(event);
      
      expect(failingHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });
  
  describe('dispose', () => {
    it('should clean up resources', async () => {
      await eventBus.subscribe('test.event', jasmine.createSpy('handler'));
      
      expect(eventBus.subscriptionCount()).toBe(1);
      
      eventBus.dispose();
      
      expect(eventBus.subscriptionCount()).toBe(0);
    });
  });
});
