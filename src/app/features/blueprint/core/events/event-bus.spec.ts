import { TestBed } from '@angular/core/testing';

import { EventBus } from './event-bus';
import { IBlueprintEvent } from './event-bus.interface';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventBus]
    });
    eventBus = TestBed.inject(EventBus);
    eventBus.initialize('test-blueprint', 'test-user');
  });

  afterEach(() => {
    eventBus.dispose();
  });

  describe('Initialization', () => {
    it('should create an instance', () => {
      expect(eventBus).toBeTruthy();
    });

    it('should initialize with blueprint and user context', () => {
      eventBus.initialize('bp-123', 'user-456');

      eventBus.emit('TEST_EVENT', { test: true }, 'test-module');
      const history = eventBus.getHistory();

      expect(history[0].context.blueprintId).toBe('bp-123');
      expect(history[0].context.userId).toBe('user-456');
    });

    it('should start with event count of 0', () => {
      expect(eventBus.eventCount()).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit events with correct structure', () => {
      const payload = { taskId: '123', name: 'Test Task' };

      eventBus.emit('TASK_CREATED', payload, 'tasks-module');

      const history = eventBus.getHistory();
      expect(history.length).toBe(1);

      const event = history[0];
      expect(event.type).toBe('TASK_CREATED');
      expect(event.payload).toEqual(payload);
      expect(event.source).toBe('tasks-module');
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.id).toBeTruthy();
      expect(event.context.blueprintId).toBe('test-blueprint');
      expect(event.context.userId).toBe('test-user');
    });

    it('should increment event count when emitting', () => {
      expect(eventBus.eventCount()).toBe(0);

      eventBus.emit('TEST_1', {}, 'module-1');
      expect(eventBus.eventCount()).toBe(1);

      eventBus.emit('TEST_2', {}, 'module-2');
      expect(eventBus.eventCount()).toBe(2);
    });

    it('should generate unique event IDs', () => {
      eventBus.emit('TEST_1', {}, 'module-1');
      eventBus.emit('TEST_2', {}, 'module-2');
      eventBus.emit('TEST_3', {}, 'module-3');

      const history = eventBus.getHistory();
      const ids = history.map(e => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should handle different payload types', () => {
      eventBus.emit('STRING_EVENT', 'test string', 'module');
      eventBus.emit('NUMBER_EVENT', 42, 'module');
      eventBus.emit('OBJECT_EVENT', { complex: { nested: true } }, 'module');
      eventBus.emit('ARRAY_EVENT', [1, 2, 3], 'module');

      const history = eventBus.getHistory();
      expect(history.length).toBe(4);
      expect(history[0].payload).toBe('test string');
      expect(history[1].payload).toBe(42);
      expect(history[2].payload).toEqual({ complex: { nested: true } });
      expect(history[3].payload).toEqual([1, 2, 3]);
    });
  });

  describe('Event Subscription', () => {
    it('should call handler when subscribed event is emitted', done => {
      const payload = { test: 'data' };

      eventBus.on<{ test: string }>('TEST_EVENT', event => {
        expect(event.type).toBe('TEST_EVENT');
        expect(event.payload).toEqual(payload);
        done();
      });

      eventBus.emit('TEST_EVENT', payload, 'test-module');
    });

    it('should not call handler for different event types', done => {
      let handlerCalled = false;

      eventBus.on('EVENT_A', () => {
        handlerCalled = true;
      });

      eventBus.emit('EVENT_B', {}, 'module');

      setTimeout(() => {
        expect(handlerCalled).toBe(false);
        done();
      }, 50);
    });

    it('should call multiple handlers for the same event', done => {
      let handler1Called = false;
      let handler2Called = false;

      eventBus.on('TEST_EVENT', () => {
        handler1Called = true;
      });

      eventBus.on('TEST_EVENT', () => {
        handler2Called = true;

        // Check after second handler
        expect(handler1Called).toBe(true);
        expect(handler2Called).toBe(true);
        done();
      });

      eventBus.emit('TEST_EVENT', {}, 'module');
    });

    it('should handle async handlers', async () => {
      let handlerCompleted = false;

      eventBus.on('ASYNC_EVENT', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        handlerCompleted = true;
      });

      eventBus.emit('ASYNC_EVENT', {}, 'module');

      // Wait for async handler
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(handlerCompleted).toBe(true);
    });

    it('should handle errors in handlers gracefully', done => {
      const consoleSpy = spyOn(console, 'error');

      eventBus.on('ERROR_EVENT', () => {
        throw new Error('Handler error');
      });

      eventBus.emit('ERROR_EVENT', {}, 'module');

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should return unsubscribe function', () => {
      let handlerCalled = 0;

      const unsubscribe = eventBus.on('TEST_EVENT', () => {
        handlerCalled++;
      });

      eventBus.emit('TEST_EVENT', {}, 'module');
      expect(handlerCalled).toBe(1);

      // Unsubscribe
      unsubscribe();

      eventBus.emit('TEST_EVENT', {}, 'module');
      expect(handlerCalled).toBe(1); // Should not increase
    });
  });

  describe('Once Subscription', () => {
    it('should call handler only once', done => {
      let callCount = 0;

      eventBus.once('ONCE_EVENT', () => {
        callCount++;
      });

      eventBus.emit('ONCE_EVENT', {}, 'module');
      eventBus.emit('ONCE_EVENT', {}, 'module');
      eventBus.emit('ONCE_EVENT', {}, 'module');

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });

    it('should return unsubscribe function that works before first call', done => {
      let handlerCalled = false;

      const unsubscribe = eventBus.once('ONCE_EVENT', () => {
        handlerCalled = true;
      });

      // Unsubscribe before emitting
      unsubscribe();

      eventBus.emit('ONCE_EVENT', {}, 'module');

      setTimeout(() => {
        expect(handlerCalled).toBe(false);
        done();
      }, 50);
    });
  });

  describe('Unsubscribe', () => {
    it('should remove all handlers for event type with off()', done => {
      let handler1Called = 0;
      let handler2Called = 0;

      const handler1 = () => {
        handler1Called++;
      };
      const handler2 = () => {
        handler2Called++;
      };

      eventBus.on('TEST_EVENT', handler1);
      eventBus.on('TEST_EVENT', handler2);

      eventBus.emit('TEST_EVENT', {}, 'module');

      setTimeout(() => {
        expect(handler1Called).toBe(1);
        expect(handler2Called).toBe(1);

        // Unsubscribe all
        eventBus.off('TEST_EVENT', handler1);

        eventBus.emit('TEST_EVENT', {}, 'module');

        setTimeout(() => {
          // Should not have increased
          expect(handler1Called).toBe(1);
          expect(handler2Called).toBe(1);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('Event History', () => {
    it('should store all emitted events', () => {
      eventBus.emit('EVENT_1', { data: 1 }, 'module-1');
      eventBus.emit('EVENT_2', { data: 2 }, 'module-2');
      eventBus.emit('EVENT_3', { data: 3 }, 'module-3');

      const history = eventBus.getHistory();
      expect(history.length).toBe(3);
    });

    it('should filter history by event type', () => {
      eventBus.emit('TYPE_A', {}, 'module');
      eventBus.emit('TYPE_B', {}, 'module');
      eventBus.emit('TYPE_A', {}, 'module');
      eventBus.emit('TYPE_C', {}, 'module');

      const typeAHistory = eventBus.getHistory('TYPE_A');
      expect(typeAHistory.length).toBe(2);
      expect(typeAHistory.every(e => e.type === 'TYPE_A')).toBe(true);
    });

    it('should limit history results', () => {
      // Emit 10 events
      for (let i = 0; i < 10; i++) {
        eventBus.emit('TEST_EVENT', { index: i }, 'module');
      }

      const limitedHistory = eventBus.getHistory(undefined, 5);
      expect(limitedHistory.length).toBe(5);

      // Should return most recent 5
      expect(limitedHistory[4].payload).toEqual({ index: 9 });
    });

    it('should maintain maximum history size', () => {
      // Emit more events than max history size (1000)
      for (let i = 0; i < 1100; i++) {
        eventBus.emit('TEST_EVENT', { index: i }, 'module');
      }

      const history = eventBus.getHistory(undefined, 2000);
      expect(history.length).toBe(1000); // Should be capped at max size
    });

    it('should clear history', () => {
      eventBus.emit('EVENT_1', {}, 'module');
      eventBus.emit('EVENT_2', {}, 'module');

      expect(eventBus.getHistory().length).toBe(2);

      eventBus.clearHistory();

      expect(eventBus.getHistory().length).toBe(0);
    });
  });

  describe('Subscription Tracking', () => {
    it('should track subscription count', () => {
      expect(eventBus.getSubscriptionCount('TEST_EVENT')).toBe(0);

      const unsub1 = eventBus.on('TEST_EVENT', () => {});
      expect(eventBus.getSubscriptionCount('TEST_EVENT')).toBe(1);

      const unsub2 = eventBus.on('TEST_EVENT', () => {});
      expect(eventBus.getSubscriptionCount('TEST_EVENT')).toBe(2);

      unsub1();
      expect(eventBus.getSubscriptionCount('TEST_EVENT')).toBe(1);

      unsub2();
      expect(eventBus.getSubscriptionCount('TEST_EVENT')).toBe(0);
    });

    it('should return active event types', () => {
      eventBus.on('EVENT_A', () => {});
      eventBus.on('EVENT_B', () => {});
      eventBus.on('EVENT_C', () => {});

      const activeTypes = eventBus.getActiveEventTypes();
      expect(activeTypes).toContain('EVENT_A');
      expect(activeTypes).toContain('EVENT_B');
      expect(activeTypes).toContain('EVENT_C');
      expect(activeTypes.length).toBe(3);
    });
  });

  describe('Disposal', () => {
    it('should unsubscribe all handlers on dispose', done => {
      let handlerCalled = false;

      eventBus.on('TEST_EVENT', () => {
        handlerCalled = true;
      });

      eventBus.dispose();

      // Cannot emit after dispose (Subject is completed)
      eventBus.emit('TEST_EVENT', {}, 'module');

      setTimeout(() => {
        expect(handlerCalled).toBe(false);
        done();
      }, 50);
    });

    it('should clear history on dispose', () => {
      eventBus.emit('EVENT_1', {}, 'module');
      eventBus.emit('EVENT_2', {}, 'module');

      expect(eventBus.getHistory().length).toBe(2);

      eventBus.dispose();

      expect(eventBus.getHistory().length).toBe(0);
    });

    it('should reset event count on dispose', () => {
      eventBus.emit('EVENT_1', {}, 'module');
      eventBus.emit('EVENT_2', {}, 'module');

      expect(eventBus.eventCount()).toBe(2);

      eventBus.dispose();

      expect(eventBus.eventCount()).toBe(0);
    });

    it('should clear all subscriptions on dispose', () => {
      eventBus.on('EVENT_A', () => {});
      eventBus.on('EVENT_B', () => {});

      expect(eventBus.getActiveEventTypes().length).toBe(2);

      eventBus.dispose();

      expect(eventBus.getActiveEventTypes().length).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for payloads', done => {
      interface TaskPayload {
        taskId: string;
        name: string;
        completed: boolean;
      }

      eventBus.on<TaskPayload>('TASK_CREATED', event => {
        expect(typeof event.payload.taskId).toBe('string');
        expect(typeof event.payload.name).toBe('string');
        expect(typeof event.payload.completed).toBe('boolean');
        done();
      });

      eventBus.emit<TaskPayload>(
        'TASK_CREATED',
        {
          taskId: '123',
          name: 'Test Task',
          completed: false
        },
        'tasks-module'
      );
    });
  });
});
