import { TestBed } from '@angular/core/testing';

import { EnhancedEventBusService } from './enhanced-event-bus.service';
import type { EnhancedBlueprintEvent, EventActor } from './models/blueprint-event.model';
import { EventPriority } from './models/event-priority.enum';
import { SystemEventType } from './types/system-event-type.enum';

describe('EnhancedEventBusService', () => {
  let service: EnhancedEventBusService;

  const mockActor: EventActor = {
    userId: 'user-1',
    userName: 'Test User',
    role: 'admin'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnhancedEventBusService]
    });
    service = TestBed.inject(EnhancedEventBusService);
    service.initialize('blueprint-123', 'user-1');
  });

  afterEach(() => {
    service.dispose();
  });

  describe('emit and subscribe', () => {
    it('should emit and receive events', done => {
      const testData = { taskId: 'task-1', name: 'Test Task' };

      service.onEvent(SystemEventType.TASK_CREATED, event => {
        expect(event.type).toBe(SystemEventType.TASK_CREATED);
        expect(event.data).toEqual(testData);
        expect(event.blueprintId).toBe('blueprint-123');
        done();
      });

      service.emit(SystemEventType.TASK_CREATED, testData, mockActor);
    });

    it('should emit event with emitEvent method', done => {
      const event: EnhancedBlueprintEvent<{ id: string }> = {
        type: SystemEventType.CONTRACT_CREATED,
        blueprintId: 'blueprint-123',
        timestamp: new Date(),
        actor: mockActor,
        data: { id: 'contract-1' }
      };

      service.onEvent(SystemEventType.CONTRACT_CREATED, receivedEvent => {
        expect(receivedEvent.data).toEqual({ id: 'contract-1' });
        expect(receivedEvent.id).toBeDefined();
        done();
      });

      service.emitEvent(event);
    });

    it('should support multiple subscribers', done => {
      let count = 0;

      service.onEvent(SystemEventType.TASK_COMPLETED, () => {
        count++;
        if (count === 2) done();
      });

      service.onEvent(SystemEventType.TASK_COMPLETED, () => {
        count++;
        if (count === 2) done();
      });

      service.emit(SystemEventType.TASK_COMPLETED, { taskId: 'task-1' }, mockActor);
    });

    it('should unsubscribe correctly', () => {
      let called = false;

      const unsubscribe = service.onEvent(SystemEventType.TASK_CREATED, () => {
        called = true;
      });

      unsubscribe();

      service.emit(SystemEventType.TASK_CREATED, { taskId: 'task-1' }, mockActor);

      // 等待一下確保不會被呼叫
      setTimeout(() => {
        expect(called).toBeFalse();
      }, 100);
    });
  });

  describe('onceEvent', () => {
    it('should only receive event once', done => {
      let count = 0;

      service.onceEvent(SystemEventType.TASK_CREATED, () => {
        count++;
      });

      // 發送多個事件，但只應該觸發一次
      setTimeout(() => {
        service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);
      }, 60);

      setTimeout(() => {
        service.emit(SystemEventType.TASK_CREATED, { id: '2' }, mockActor);
      }, 120);

      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 200);
    });
  });

  describe('onEvents (multiple types)', () => {
    it('should subscribe to multiple event types', done => {
      const receivedTypes: string[] = [];

      service.onEvents([SystemEventType.TASK_CREATED, SystemEventType.TASK_UPDATED], event => {
        receivedTypes.push(event.type as string);
        if (receivedTypes.length === 2) {
          expect(receivedTypes).toContain(SystemEventType.TASK_CREATED);
          expect(receivedTypes).toContain(SystemEventType.TASK_UPDATED);
          done();
        }
      });

      setTimeout(() => {
        service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);
      }, 60);

      setTimeout(() => {
        service.emit(SystemEventType.TASK_UPDATED, { id: '2' }, mockActor);
      }, 120);
    });
  });

  describe('onAllEvents', () => {
    it('should receive all events', done => {
      const receivedEvents: string[] = [];

      service.onAllEvents(event => {
        receivedEvents.push(event.type as string);
        if (receivedEvents.length === 2) {
          expect(receivedEvents).toContain(SystemEventType.TASK_CREATED);
          expect(receivedEvents).toContain(SystemEventType.CONTRACT_CREATED);
          done();
        }
      });

      setTimeout(() => {
        service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);
      }, 60);

      setTimeout(() => {
        service.emit(SystemEventType.CONTRACT_CREATED, { id: '2' }, mockActor);
      }, 120);
    });
  });

  describe('validateEvent', () => {
    it('should validate valid event', () => {
      const event: EnhancedBlueprintEvent = {
        type: SystemEventType.TASK_CREATED,
        blueprintId: 'bp-123',
        timestamp: new Date(),
        actor: mockActor,
        data: { id: 'test' }
      };

      expect(service.validateEvent(event)).toBeTrue();
    });

    it('should reject event without type', () => {
      const event = {
        blueprintId: 'bp-123',
        timestamp: new Date(),
        actor: mockActor,
        data: {}
      } as EnhancedBlueprintEvent;

      expect(service.validateEvent(event)).toBeFalse();
    });

    it('should reject event without blueprintId', () => {
      const event = {
        type: SystemEventType.TASK_CREATED,
        timestamp: new Date(),
        actor: mockActor,
        data: {}
      } as EnhancedBlueprintEvent;

      expect(service.validateEvent(event)).toBeFalse();
    });

    it('should reject event without actor', () => {
      const event = {
        type: SystemEventType.TASK_CREATED,
        blueprintId: 'bp-123',
        timestamp: new Date(),
        data: {}
      } as EnhancedBlueprintEvent;

      expect(service.validateEvent(event)).toBeFalse();
    });
  });

  describe('event log', () => {
    it('should log events', () => {
      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);

      const logs = service.getEventLog();
      expect(logs.length).toBe(1);
      expect(logs[0].eventType).toBe(SystemEventType.TASK_CREATED);
      expect(logs[0].success).toBeTrue();
    });

    it('should filter logs by event type', () => {
      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);

      setTimeout(() => {
        service.emit(SystemEventType.CONTRACT_CREATED, { id: '2' }, mockActor);
      }, 60);

      setTimeout(() => {
        const logs = service.getEventLog({ eventTypes: [SystemEventType.TASK_CREATED] });
        expect(logs.length).toBe(1);
        expect(logs[0].eventType).toBe(SystemEventType.TASK_CREATED);
      }, 120);
    });

    it('should clear event log', () => {
      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);
      expect(service.getEventLog().length).toBe(1);

      service.clearEventLog();
      expect(service.getEventLog().length).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize event', () => {
      const event: EnhancedBlueprintEvent = {
        type: SystemEventType.TASK_CREATED,
        blueprintId: 'bp-123',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        actor: mockActor,
        data: { id: 'test' }
      };

      const json = service.serializeEvent(event);
      expect(typeof json).toBe('string');
      expect(json).toContain('2025-01-01T00:00:00.000Z');
    });

    it('should deserialize event', () => {
      const json = JSON.stringify({
        type: SystemEventType.TASK_CREATED,
        blueprintId: 'bp-123',
        timestamp: '2025-01-01T00:00:00.000Z',
        actor: mockActor,
        data: { id: 'test' }
      });

      const event = service.deserializeEvent(json);
      expect(event.type).toBe(SystemEventType.TASK_CREATED);
      expect(event.timestamp instanceof Date).toBeTrue();
    });
  });

  describe('statistics', () => {
    it('should track event count', () => {
      expect(service.eventCount()).toBe(0);

      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);
      expect(service.eventCount()).toBe(1);
    });

    it('should get statistics', () => {
      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);

      const stats = service.getStatistics();
      expect(stats.totalEvents).toBe(1);
      expect(stats.logSize).toBe(1);
      expect(stats.lastEventTime).toBeDefined();
    });

    it('should track subscription count', () => {
      const unsubscribe = service.onEvent(SystemEventType.TASK_CREATED, () => {});

      expect(service.getSubscriptionCount(SystemEventType.TASK_CREATED)).toBe(1);

      unsubscribe();

      expect(service.getSubscriptionCount(SystemEventType.TASK_CREATED)).toBe(0);
    });
  });

  describe('priority', () => {
    it('should accept priority parameter', () => {
      const event: EnhancedBlueprintEvent = {
        type: SystemEventType.TASK_COMPLETED,
        blueprintId: 'bp-123',
        timestamp: new Date(),
        actor: mockActor,
        data: { id: 'test' }
      };

      // 應該不會拋出錯誤
      expect(() => {
        service.emitEvent(event, EventPriority.CRITICAL);
      }).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clean up on dispose', () => {
      service.onEvent(SystemEventType.TASK_CREATED, () => {});
      service.emit(SystemEventType.TASK_CREATED, { id: '1' }, mockActor);

      service.dispose();

      expect(service.eventCount()).toBe(0);
      expect(service.getEventLog().length).toBe(0);
      expect(service.getActiveEventTypes().length).toBe(0);
    });
  });
});
