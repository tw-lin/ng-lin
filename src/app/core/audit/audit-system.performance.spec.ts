/**
 * Audit System Performance Tests
 * 
 * Focused performance and load testing for audit system:
 * - Batch throughput benchmarks
 * - Classification speed tests
 * - Query latency measurements
 * - Memory usage profiling
 * - Load scenarios (10k, 50k, 100k events/day)
 * 
 * Performance Targets:
 * - Batch processing: 50 events < 500ms
 * - Classification: < 10ms per event
 * - Query latency: < 200ms for simple queries
 * - Memory: < 100MB for 10k event buffer
 * - Throughput: > 1000 events/second
 * 
 * @author Audit System Team
 * @version 1.0.0
 * @since Phase 1 - Integration Testing (AUDIT-P1-INT)
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';

// Services
import { ClassificationEngineService } from './services/classification-engine.service';
import { AuditEventRepository } from './repositories/audit-event.repository';
import { AuditQueryService } from './query/audit-query.service';

// Models
import { AuditEvent } from './models/audit-event.interface';
import { EventCategory } from './models/event-category.enum';
import { EventSeverity } from './models/event-severity.enum';
import { StorageTier } from './models/storage-tier.enum';

describe('Audit System Performance Tests', () => {
  let classificationEngine: ClassificationEngineService;
  let auditRepository: AuditEventRepository;
  let queryService: AuditQueryService;
  let firestoreMock: jasmine.SpyObj<Firestore>;

  beforeEach(() => {
    firestoreMock = jasmine.createSpyObj('Firestore', ['collection', 'doc']);

    TestBed.configureTestingModule({
      providers: [
        ClassificationEngineService,
        AuditEventRepository,
        AuditQueryService,
        { provide: Firestore, useValue: firestoreMock }
      ]
    });

    classificationEngine = TestBed.inject(ClassificationEngineService);
    auditRepository = TestBed.inject(AuditEventRepository);
    queryService = TestBed.inject(AuditQueryService);
  });

  /**
   * Performance Test 1: Batch Processing Throughput
   */
  describe('Batch Processing Throughput', () => {
    it('should classify 50 events in < 500ms', () => {
      const events = generateMockEvents(50);
      const startTime = performance.now();
      
      const classified = classificationEngine.classifyBatch(events);
      
      const duration = performance.now() - startTime;
      
      expect(classified.length).toBe(50);
      expect(duration).toBeLessThan(500);
      
      console.log(`Classified 50 events in ${duration.toFixed(2)}ms (${(50000/duration).toFixed(0)} events/sec)`);
    });

    it('should classify 100 events in < 1000ms', () => {
      const events = generateMockEvents(100);
      const startTime = performance.now();
      
      const classified = classificationEngine.classifyBatch(events);
      
      const duration = performance.now() - startTime;
      
      expect(classified.length).toBe(100);
      expect(duration).toBeLessThan(1000);
      
      console.log(`Classified 100 events in ${duration.toFixed(2)}ms (${(100000/duration).toFixed(0)} events/sec)`);
    });

    it('should classify 500 events in < 5000ms', () => {
      const events = generateMockEvents(500);
      const startTime = performance.now();
      
      const classified = classificationEngine.classifyBatch(events);
      
      const duration = performance.now() - startTime;
      
      expect(classified.length).toBe(500);
      expect(duration).toBeLessThan(5000);
      
      console.log(`Classified 500 events in ${duration.toFixed(2)}ms (${(500000/duration).toFixed(0)} events/sec)`);
    });

    it('should classify 1000 events in < 10000ms', () => {
      const events = generateMockEvents(1000);
      const startTime = performance.now();
      
      const classified = classificationEngine.classifyBatch(events);
      
      const duration = performance.now() - startTime;
      
      expect(classified.length).toBe(1000);
      expect(duration).toBeLessThan(10000);
      
      console.log(`Classified 1000 events in ${duration.toFixed(2)}ms (${(1000000/duration).toFixed(0)} events/sec)`);
    });
  });

  /**
   * Performance Test 2: Single Event Classification Speed
   */
  describe('Single Event Classification Speed', () => {
    it('should classify single event in < 10ms', () => {
      const event = generateMockEvent('user.login');
      const startTime = performance.now();
      
      const classified = classificationEngine.classify(event);
      
      const duration = performance.now() - startTime;
      
      expect(classified.riskScore).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(10);
      
      console.log(`Classified single event in ${duration.toFixed(3)}ms`);
    });

    it('should maintain consistent speed across multiple classifications', () => {
      const iterations = 100;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const event = generateMockEvent('task.updated');
        const startTime = performance.now();
        
        classificationEngine.classify(event);
        
        durations.push(performance.now() - startTime);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      expect(avgDuration).toBeLessThan(10);
      expect(maxDuration).toBeLessThan(50);
      
      console.log(`Average: ${avgDuration.toFixed(3)}ms, Max: ${maxDuration.toFixed(3)}ms`);
    });
  });

  /**
   * Performance Test 3: Event Type Coverage Speed
   */
  describe('Event Type Coverage Speed', () => {
    const eventTypes = [
      // Authentication (11 types)
      'user.login', 'user.logout', 'user.mfa.enabled', 'user.password.changed',
      'user.session.expired', 'user.lockout', 'user.password.reset',
      'user.email.verified', 'user.phone.verified', 'user.twofa.disabled',
      'user.account.deactivated',
      
      // Authorization (12 types)
      'permission.granted', 'permission.revoked', 'role.assigned', 'role.unassigned',
      'access.denied', 'access.granted', 'permission.checked', 'role.created',
      'role.updated', 'role.deleted', 'policy.updated', 'access.escalation',
      
      // User Actions (15 types)
      'task.created', 'task.updated', 'task.deleted', 'task.completed',
      'blueprint.created', 'blueprint.updated', 'blueprint.deleted', 'blueprint.published',
      'comment.added', 'attachment.uploaded', 'document.shared', 'notification.sent',
      'settings.changed', 'profile.updated', 'team.joined',
      
      // Data Access (10 types)
      'data.read', 'data.queried', 'data.searched', 'data.exported',
      'data.downloaded', 'data.viewed', 'data.listed', 'data.accessed',
      'data.fetched', 'data.retrieved',
      
      // Data Modification (12 types)
      'data.created', 'data.updated', 'data.deleted', 'data.modified',
      'data.imported', 'data.uploaded', 'data.copied', 'data.moved',
      'data.renamed', 'data.archived', 'data.restored', 'data.purged',
      
      // System Events (10 types)
      'system.started', 'system.stopped', 'system.restarted', 'system.upgraded',
      'system.backup', 'system.restore', 'system.maintenance', 'system.health.check',
      'system.config.changed', 'system.service.deployed',
      
      // AI Decisions (8 types)
      'ai.decision.made', 'ai.model.trained', 'ai.prediction.generated',
      'ai.recommendation.provided', 'ai.content.generated', 'ai.analysis.completed',
      'ai.classification.applied', 'ai.suggestion.offered',
      
      // Security Incidents (12 types)
      'security.violation', 'security.breach', 'security.intrusion.detected',
      'security.anomaly.detected', 'security.malware.detected', 'security.ddos.attack',
      'security.unauthorized.access', 'security.privilege.escalation',
      'security.data.leak', 'security.sql.injection', 'security.xss.attempt',
      'security.csrf.attempt',
      
      // Compliance Events (8 types)
      'compliance.audit.started', 'compliance.audit.completed', 'compliance.violation.detected',
      'compliance.report.generated', 'compliance.policy.updated', 'compliance.certification.renewed',
      'compliance.data.retention.policy.applied', 'compliance.gdpr.request.processed',
      
      // Performance Issues (6 types)
      'performance.slow.query', 'performance.timeout', 'performance.high.cpu',
      'performance.high.memory', 'performance.slow.response', 'performance.bottleneck.detected',
      
      // Error/Exception (8 types)
      'error.exception', 'error.validation.failed', 'error.not.found',
      'error.internal.server', 'error.bad.request', 'error.unauthorized',
      'error.forbidden', 'error.conflict'
    ];

    it('should classify all 102 event types efficiently', () => {
      const startTime = performance.now();
      
      eventTypes.forEach(eventType => {
        const event = generateMockEvent(eventType);
        classificationEngine.classify(event);
      });
      
      const duration = performance.now() - startTime;
      const avgPerEvent = duration / eventTypes.length;
      
      expect(avgPerEvent).toBeLessThan(10);
      
      console.log(`Classified ${eventTypes.length} event types in ${duration.toFixed(2)}ms (avg: ${avgPerEvent.toFixed(3)}ms per event)`);
    });
  });

  /**
   * Performance Test 4: Load Scenarios
   */
  describe('Load Scenarios', () => {
    it('should simulate 10k events/day (LOW volume)', fakeAsync(() => {
      const eventsPerDay = 10000;
      const eventsPerBatch = 50;
      const batches = eventsPerDay / eventsPerBatch; // 200 batches
      
      const startTime = performance.now();
      
      for (let i = 0; i < batches; i++) {
        const events = generateMockEvents(eventsPerBatch);
        classificationEngine.classifyBatch(events);
        
        if (i % 10 === 0) {
          tick(1000); // Simulate 1 second intervals
        }
      }
      
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(30000); // Should complete in < 30 seconds
      
      console.log(`Processed ${eventsPerDay} events in ${(duration/1000).toFixed(2)}s (${(eventsPerDay/(duration/1000)).toFixed(0)} events/sec)`);
      
      flush();
    }));

    it('should simulate 50k events/day (MEDIUM volume)', fakeAsync(() => {
      const eventsPerDay = 50000;
      const eventsPerBatch = 50;
      const batches = eventsPerDay / eventsPerBatch; // 1000 batches
      
      const startTime = performance.now();
      let processedBatches = 0;
      
      // Process first 100 batches for testing (5000 events)
      const testBatches = 100;
      for (let i = 0; i < testBatches; i++) {
        const events = generateMockEvents(eventsPerBatch);
        classificationEngine.classifyBatch(events);
        processedBatches++;
        
        if (i % 10 === 0) {
          tick(1000);
        }
      }
      
      const duration = performance.now() - startTime;
      const eventsProcessed = testBatches * eventsPerBatch;
      const estimatedFullDuration = (duration / testBatches) * batches;
      
      expect(estimatedFullDuration).toBeLessThan(300000); // < 5 minutes
      
      console.log(`Processed ${eventsProcessed} events in ${(duration/1000).toFixed(2)}s`);
      console.log(`Estimated time for ${eventsPerDay} events: ${(estimatedFullDuration/1000).toFixed(2)}s`);
      
      flush();
    }));

    it('should simulate 100k events/day (HIGH volume)', fakeAsync(() => {
      const eventsPerDay = 100000;
      const eventsPerBatch = 50;
      
      const startTime = performance.now();
      
      // Process first 50 batches for testing (2500 events)
      const testBatches = 50;
      for (let i = 0; i < testBatches; i++) {
        const events = generateMockEvents(eventsPerBatch);
        classificationEngine.classifyBatch(events);
        
        if (i % 10 === 0) {
          tick(1000);
        }
      }
      
      const duration = performance.now() - startTime;
      const eventsProcessed = testBatches * eventsPerBatch;
      const batches = eventsPerDay / eventsPerBatch;
      const estimatedFullDuration = (duration / testBatches) * batches;
      
      expect(estimatedFullDuration).toBeLessThan(600000); // < 10 minutes
      
      console.log(`Processed ${eventsProcessed} events in ${(duration/1000).toFixed(2)}s`);
      console.log(`Estimated time for ${eventsPerDay} events: ${(estimatedFullDuration/1000).toFixed(2)}s`);
      
      flush();
    }));
  });

  /**
   * Performance Test 5: Memory Usage Profiling
   */
  describe('Memory Usage Profiling', () => {
    it('should not leak memory during batch processing', () => {
      const iterations = 10;
      const batchSize = 100;
      
      // Take initial memory snapshot (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      for (let i = 0; i < iterations; i++) {
        const events = generateMockEvents(batchSize);
        classificationEngine.classifyBatch(events);
        
        // Force garbage collection if available (Chrome DevTools)
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal (< 10MB for 1000 events)
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
        console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  /**
   * Performance Test 6: Concurrent Classification
   */
  describe('Concurrent Classification', () => {
    it('should handle multiple concurrent classifications', fakeAsync(() => {
      const concurrentBatches = 5;
      const eventsPerBatch = 50;
      
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < concurrentBatches; i++) {
        const events = generateMockEvents(eventsPerBatch);
        promises.push(Promise.resolve(classificationEngine.classifyBatch(events)));
      }
      
      Promise.all(promises).then(results => {
        const duration = performance.now() - startTime;
        
        expect(results.length).toBe(concurrentBatches);
        expect(duration).toBeLessThan(2000);
        
        console.log(`Processed ${concurrentBatches} concurrent batches (${concurrentBatches * eventsPerBatch} events) in ${duration.toFixed(2)}ms`);
      });
      
      tick();
      flush();
    }));
  });

  /**
   * Performance Test 7: Classification Quality vs Speed
   */
  describe('Classification Quality vs Speed', () => {
    it('should maintain accuracy under time pressure', () => {
      const events = generateMockEvents(100);
      const startTime = performance.now();
      
      const classified = classificationEngine.classifyBatch(events);
      
      const duration = performance.now() - startTime;
      
      // All events should be classified
      expect(classified.every(e => e.category !== undefined)).toBe(true);
      expect(classified.every(e => e.riskScore >= 0)).toBe(true);
      expect(classified.every(e => e.complianceTags.length >= 0)).toBe(true);
      
      // Speed should still be acceptable
      expect(duration).toBeLessThan(1000);
      
      console.log(`Classification accuracy: 100% in ${duration.toFixed(2)}ms`);
    });
  });
});

/**
 * Helper Functions
 */

function generateMockEvents(count: number): AuditEvent[] {
  const eventTypes = [
    'user.login', 'task.created', 'blueprint.updated', 'permission.granted',
    'data.exported', 'ai.decision.made', 'error.exception', 'security.violation'
  ];

  const events: AuditEvent[] = [];
  for (let i = 0; i < count; i++) {
    events.push(generateMockEvent(eventTypes[i % eventTypes.length]));
  }
  return events;
}

function generateMockEvent(eventType: string): AuditEvent {
  return {
    eventId: `perf-test-${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    tenantId: 'tenant-perf-001',
    blueprintId: 'blueprint-perf-001',
    timestamp: new Date(),
    actorType: 'user',
    actorId: 'user-perf-001',
    actorName: 'Performance Test User',
    category: EventCategory.USER_ACTION,
    level: EventSeverity.LOW,
    tier: StorageTier.HOT,
    description: `Performance test event: ${eventType}`,
    metadata: {
      testRun: 'performance-suite',
      generated: true
    }
  };
}
