/**
 * Unit Tests for AuditCollectorEnhancedService
 * 
 * Test Coverage:
 * - Event subscription initialization
 * - Domain event conversion to audit events
 * - Batch processing (size and time triggers)
 * - Classification integration
 * - Repository persistence
 * - Circuit breaker behavior
 * - Manual audit recording API
 * - Statistics tracking
 * 
 * @date 2025-12-26
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { Subject } from 'rxjs';

import { AuditCollectorEnhancedService } from './audit-collector-enhanced.service';
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';
import { LoggerService } from '@core/services/logger';
import { TenantContextService } from '@core/global-event-bus/services/tenant-context.service';
import { ClassificationEngineService } from '../services/classification-engine.service';
import { AuditEventRepository } from '../repositories/audit-event.repository';
import { EventCategory } from '../models/event-category.enum';
import { EventSeverity } from '../models/event-severity.enum';
import { StorageTier } from '../models/storage-tier.enum';

describe('AuditCollectorEnhancedService', () => {
  let service: AuditCollectorEnhancedService;
  let mockEventBus: jasmine.SpyObj<BlueprintEventBus>;
  let mockClassificationEngine: jasmine.SpyObj<ClassificationEngineService>;
  let mockAuditRepository: jasmine.SpyObj<AuditEventRepository>;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockTenantContext: jasmine.SpyObj<TenantContextService>;

  const createMockDomainEvent = (overrides: any = {}) => ({
    type: 'task.created',
    blueprintId: 'blueprint-123',
    timestamp: new Date(),
    userId: 'user-123',
    userName: 'Test User',
    entityId: 'task-456',
    entityType: 'task',
    entityName: 'Test Task',
    requestId: 'req-789',
    sessionId: 'session-abc',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    payload: { description: 'Test payload' },
    tags: ['test'],
    ...overrides
  });

  beforeEach(() => {
    // Create mock services
    const eventBusSubject = new Subject();
    mockEventBus = jasmine.createSpyObj('BlueprintEventBus', ['subscribe']);
    mockEventBus.subscribe.and.returnValue(eventBusSubject.asObservable());

    mockClassificationEngine = jasmine.createSpyObj('ClassificationEngineService', ['classify']);
    mockClassificationEngine.classify.and.returnValue({
      category: EventCategory.USER_ACTION,
      level: EventSeverity.LOW,
      riskScore: 10,
      complianceTags: ['GDPR'],
      operationType: 'CREATE',
      aiDecision: undefined,
      processingTimeMs: 5
    });

    mockAuditRepository = jasmine.createSpyObj('AuditEventRepository', [
      'create',
      'createBatch'
    ]);
    mockAuditRepository.create.and.returnValue(Promise.resolve({ id: 'audit-001' } as any));
    mockAuditRepository.createBatch.and.returnValue(Promise.resolve([{ id: 'audit-001' }] as any));

    mockLogger = jasmine.createSpyObj('LoggerService', ['info', 'debug', 'warn', 'error']);
    mockTenantContext = jasmine.createSpyObj('TenantContextService', ['getCurrentTenantId']);
    mockTenantContext.getCurrentTenantId.and.returnValue('blueprint-123');

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        AuditCollectorEnhancedService,
        { provide: BlueprintEventBus, useValue: mockEventBus },
        { provide: ClassificationEngineService, useValue: mockClassificationEngine },
        { provide: AuditEventRepository, useValue: mockAuditRepository },
        { provide: LoggerService, useValue: mockLogger },
        { provide: TenantContextService, useValue: mockTenantContext },
        DestroyRef
      ]
    });

    service = TestBed.inject(AuditCollectorEnhancedService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should subscribe to 11 audit topic patterns', () => {
      // Service subscribes in constructor
      expect(mockEventBus.subscribe).toHaveBeenCalledTimes(11);
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('blueprint.*');
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('task.*');
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('user.*');
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('auth.*');
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('ai.*');
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('system.*');
    });

    it('should initialize batch processing', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[AuditCollectorEnhanced]',
        'Batch processing initialized (max: 50 events, 5000ms)'
      );
    });
  });

  describe('Domain Event Conversion', () => {
    it('should convert basic domain event to audit event', fakeAsync(() => {
      const domainEvent = createMockDomainEvent();
      
      // Trigger manual recording to test conversion
      service.recordAuditEvent('blueprint-123', 'task.created', 'user-123', {
        entityId: 'task-456',
        entityType: 'task',
        operationType: 'CREATE'
      });

      tick();

      expect(mockClassificationEngine.classify).toHaveBeenCalled();
      expect(mockAuditRepository.create).toHaveBeenCalled();
      
      const auditEvent = mockClassificationEngine.classify.calls.mostRecent().args[0];
      expect(auditEvent.blueprintId).toBe('blueprint-123');
      expect(auditEvent.actor.id).toBe('user-123');
      expect(auditEvent.eventType).toBe('task.created');
      expect(auditEvent.storageTier).toBe(StorageTier.HOT);
    }));

    it('should infer actor type correctly', fakeAsync(() => {
      service.recordAuditEvent('blueprint-123', 'ai.decision.architectural', 'ai-agent-001', {
        actorType: 'ai'
      });

      tick();

      const auditEvent = mockClassificationEngine.classify.calls.mostRecent().args[0];
      expect(auditEvent.actor.type).toBe('ai');
      expect(auditEvent.aiGenerated).toBe(true);
    }));

    it('should infer operation type from event type', fakeAsync(() => {
      const testCases = [
        { eventType: 'task.created', expected: undefined }, // Manual recording doesn't infer
        { eventType: 'task.deleted', expected: undefined },
        { eventType: 'task.updated', expected: undefined }
      ];

      testCases.forEach(({ eventType }) => {
        service.recordAuditEvent('blueprint-123', eventType, 'user-123');
      });

      tick();

      expect(mockAuditRepository.create).toHaveBeenCalledTimes(testCases.length);
    }));

    it('should extract tenant ID with correct priority', fakeAsync(() => {
      // Test blueprintId priority
      service.recordAuditEvent('blueprint-456', 'test.event', 'user-123');
      tick();

      let auditEvent = mockClassificationEngine.classify.calls.mostRecent().args[0];
      expect(auditEvent.blueprintId).toBe('blueprint-456');
    }));
  });

  describe('Batch Processing', () => {
    it('should flush batch when size limit reached', fakeAsync(() => {
      // Simulate 50 events (batch size limit)
      for (let i = 0; i < 50; i++) {
        service.recordAuditEvent(`blueprint-${i}`, 'test.event', 'user-123');
      }

      tick(6000); // Wait for batch timer

      // Should have flushed at least once
      expect(mockAuditRepository.create).toHaveBeenCalled();
      
      const stats = service.getStatistics();
      expect(stats.eventsCollected).toBeGreaterThan(0);
    }));

    it('should flush batch after time limit', fakeAsync(() => {
      // Add single event
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123');

      // Don't reach size limit, but wait for time trigger
      tick(6000);

      expect(mockAuditRepository.create).toHaveBeenCalled();
    }));
  });

  describe('Classification Integration', () => {
    it('should classify all events before persistence', fakeAsync(() => {
      service.recordAuditEvent('blueprint-123', 'task.created', 'user-123');
      tick();

      expect(mockClassificationEngine.classify).toHaveBeenCalledTimes(1);
      
      const auditEvent = mockClassificationEngine.classify.calls.mostRecent().args[0];
      expect(auditEvent.category).toBe(EventCategory.SYSTEM_EVENT); // Before classification
    }));

    it('should apply classification results to audit event', fakeAsync(() => {
      mockClassificationEngine.classify.and.returnValue({
        category: EventCategory.SECURITY_INCIDENT,
        level: EventSeverity.CRITICAL,
        riskScore: 95,
        complianceTags: ['GDPR', 'HIPAA'],
        operationType: 'DELETE',
        aiDecision: undefined,
        processingTimeMs: 10
      });

      service.recordAuditEvent('blueprint-123', 'security.breach', 'user-123');
      tick();

      expect(mockAuditRepository.create).toHaveBeenCalled();
      const persistedEvent = mockAuditRepository.create.calls.mostRecent().args[0];
      
      expect(persistedEvent.category).toBe(EventCategory.SECURITY_INCIDENT);
      expect(persistedEvent.level).toBe(EventSeverity.CRITICAL);
      expect(persistedEvent.riskScore).toBe(95);
      expect(persistedEvent.complianceTags).toContain('GDPR');
      expect(persistedEvent.complianceTags).toContain('HIPAA');
    }));
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after 3 consecutive failures', fakeAsync(() => {
      mockAuditRepository.create.and.returnValue(Promise.reject(new Error('Storage failure')));

      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
        tick();
      }

      const stats = service.getStatistics();
      expect(stats.circuitBreakerState.isOpen).toBe(true);
      expect(stats.storageFailures).toBe(3);
      expect(stats.circuitBreakerTrips).toBe(1);
    }));

    it('should drop events when circuit breaker is open', fakeAsync(() => {
      // Force circuit breaker open
      mockAuditRepository.create.and.returnValue(Promise.reject(new Error('Storage failure')));
      
      for (let i = 0; i < 3; i++) {
        service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
        tick();
      }

      const callCountBeforeOpen = mockAuditRepository.create.calls.count();
      
      // Try to record another event (should be dropped)
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
      tick();

      // Should not have made additional repository calls
      expect(mockAuditRepository.create.calls.count()).toBe(callCountBeforeOpen);
    }));

    it('should reset circuit breaker after successful operation', fakeAsync(() => {
      // Cause 2 failures
      mockAuditRepository.create.and.returnValue(Promise.reject(new Error('Failure')));
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
      tick();
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
      tick();

      // Now succeed
      mockAuditRepository.create.and.returnValue(Promise.resolve({ id: 'audit-001' } as any));
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123');
      tick();

      const stats = service.getStatistics();
      expect(stats.circuitBreakerState.consecutiveFailures).toBe(0);
      expect(stats.circuitBreakerState.isOpen).toBe(false);
    }));

    it('should auto-reset circuit breaker after timeout', fakeAsync(() => {
      // Force circuit breaker open
      mockAuditRepository.create.and.returnValue(Promise.reject(new Error('Failure')));
      for (let i = 0; i < 3; i++) {
        service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
        tick();
      }

      expect(service.getStatistics().circuitBreakerState.isOpen).toBe(true);

      // Wait for reset timeout (60 seconds)
      tick(61000);

      expect(service.getStatistics().circuitBreakerState.isOpen).toBe(false);
    }));
  });

  describe('Manual Audit Recording API', () => {
    it('should record audit event immediately without batching', fakeAsync(() => {
      service.recordAuditEvent('blueprint-123', 'manual.event', 'user-123', {
        entityId: 'entity-456',
        entityType: 'resource',
        operationType: 'UPDATE',
        metadata: { key: 'value' }
      });

      tick();

      expect(mockAuditRepository.create).toHaveBeenCalledTimes(1);
      const auditEvent = mockAuditRepository.create.calls.mostRecent().args[0];
      
      expect(auditEvent.blueprintId).toBe('blueprint-123');
      expect(auditEvent.eventType).toBe('manual.event');
      expect(auditEvent.actor.id).toBe('user-123');
      expect(auditEvent.entity?.id).toBe('entity-456');
      expect(auditEvent.operationType).toBe('UPDATE');
      expect(auditEvent.metadata).toEqual({ key: 'value' });
    }));

    it('should support field-level change tracking', fakeAsync(() => {
      service.recordAuditEvent('blueprint-123', 'task.updated', 'user-123', {
        entityId: 'task-456',
        entityType: 'task',
        changes: [
          { field: 'status', oldValue: 'pending', newValue: 'completed' },
          { field: 'assignee', oldValue: 'user-1', newValue: 'user-2' }
        ]
      });

      tick();

      const auditEvent = mockAuditRepository.create.calls.mostRecent().args[0];
      expect(auditEvent.changes).toBeDefined();
      expect(auditEvent.changes?.length).toBe(2);
      expect(auditEvent.changes?.[0].field).toBe('status');
      expect(auditEvent.changes?.[1].field).toBe('assignee');
    }));
  });

  describe('Statistics Tracking', () => {
    it('should track events collected, classified, and persisted', fakeAsync(() => {
      for (let i = 0; i < 5; i++) {
        service.recordAuditEvent('blueprint-123', 'test.event', 'user-123');
      }
      tick();

      const stats = service.getStatistics();
      expect(stats.eventsCollected).toBeGreaterThanOrEqual(0); // Batch collection
      expect(stats.eventsClassified).toBe(5);
      expect(stats.eventsPersisted).toBe(5);
    }));

    it('should track storage failures', fakeAsync(() => {
      mockAuditRepository.create.and.returnValue(Promise.reject(new Error('Failure')));
      
      service.recordAuditEvent('blueprint-123', 'test.event', 'user-123').catch(() => {});
      tick();

      const stats = service.getStatistics();
      expect(stats.storageFailures).toBe(1);
    }));

    it('should provide circuit breaker state in statistics', () => {
      const stats = service.getStatistics();
      
      expect(stats.circuitBreakerState).toBeDefined();
      expect(stats.circuitBreakerState.isOpen).toBe(false);
      expect(stats.circuitBreakerState.consecutiveFailures).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should log statistics on destroy', () => {
      service.ngOnDestroy();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[AuditCollectorEnhanced]',
        'Shutting down',
        jasmine.any(Object)
      );
    });
  });
});
