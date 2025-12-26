import { TestBed } from '@angular/core/testing';
import {
  AuditQueryService,
  TimelineQueryOptions,
  ActorQueryOptions,
  EntityQueryOptions,
  ComplianceQueryOptions
} from './audit-query.service';
import { AuditEventRepository, StorageTier } from '../repositories';
import { ClassifiedAuditEvent } from '../services';
import { AuditLevel, AuditCategory } from '@core/event-bus/models';

describe('AuditQueryService', () => {
  let service: AuditQueryService;
  let mockRepository: jasmine.SpyObj<AuditEventRepository>;

  const createMockEvent = (overrides?: Partial<ClassifiedAuditEvent>): ClassifiedAuditEvent => ({
    id: 'event-1',
    eventId: 'evt-123',
    eventType: 'user.action.login',
    timestamp: new Date('2025-01-15T10:00:00Z'),
    level: AuditLevel.INFO,
    category: AuditCategory.AUTHENTICATION,
    actor: 'user-123',
    tenantId: 'tenant-1',
    action: 'login',
    resourceType: 'user',
    resourceId: 'user-123',
    result: 'success',
    requiresReview: false,
    reviewed: false,
    riskScore: 25,
    complianceTags: ['GDPR', 'SOC2'],
    autoReviewRequired: false,
    aiGenerated: false,
    operationType: 'READ',
    ...overrides
  });

  beforeEach(() => {
    const repositorySpy = jasmine.createSpyObj('AuditEventRepository', ['query']);

    TestBed.configureTestingModule({
      providers: [AuditQueryService, { provide: AuditEventRepository, useValue: repositorySpy }]
    });

    service = TestBed.inject(AuditQueryService);
    mockRepository = TestBed.inject(AuditEventRepository) as jasmine.SpyObj<AuditEventRepository>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('queryTimeline', () => {
    it('should reconstruct timeline with sequence numbers', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ id: 'e1', timestamp: new Date('2025-01-15T10:00:00Z') }),
        createMockEvent({ id: 'e2', timestamp: new Date('2025-01-15T09:00:00Z') }),
        createMockEvent({ id: 'e3', timestamp: new Date('2025-01-15T11:00:00Z') })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: TimelineQueryOptions = {
        tenantId: 'tenant-1',
        startTime: new Date('2025-01-15T00:00:00Z'),
        endTime: new Date('2025-01-15T23:59:59Z')
      };

      const timeline = await service.queryTimeline(options);

      expect(timeline.length).toBe(3);
      expect(timeline[0].id).toBe('e2'); // Earliest first
      expect(timeline[0].sequenceNumber).toBe(1);
      expect(timeline[1].id).toBe('e1');
      expect(timeline[1].sequenceNumber).toBe(2);
      expect(timeline[2].id).toBe('e3'); // Latest last
      expect(timeline[2].sequenceNumber).toBe(3);
    });

    it('should apply actor filter', async () => {
      mockRepository.query.and.returnValue(Promise.resolve([]));

      const options: TimelineQueryOptions = {
        tenantId: 'tenant-1',
        actors: ['user-123', 'user-456'],
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-31')
      };

      await service.queryTimeline(options);

      expect(mockRepository.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          actor: 'user-123' // Uses first actor
        })
      );
    });
  });

  describe('queryByActor', () => {
    it('should query events by specific actor', async () => {
      const events: ClassifiedAuditEvent[] = [createMockEvent({ actor: 'user-123' }), createMockEvent({ actor: 'user-123' })];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: ActorQueryOptions = {
        tenantId: 'tenant-1',
        actorId: 'user-123'
      };

      const results = await service.queryByActor(options);

      expect(results.length).toBe(2);
      expect(mockRepository.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          actor: 'user-123'
        })
      );
    });

    it('should filter by actor type', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ eventType: 'ai.decision.architectural' }),
        createMockEvent({ eventType: 'user.action.login' })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: ActorQueryOptions = {
        tenantId: 'tenant-1',
        actorId: 'ai-agent-1',
        actorType: 'ai'
      };

      const results = await service.queryByActor(options);

      expect(results.length).toBe(1);
      expect(results[0].eventType).toContain('ai.');
    });
  });

  describe('queryByEntity', () => {
    it('should query events for specific entity', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ resourceType: 'blueprint', resourceId: 'bp-123' }),
        createMockEvent({ resourceType: 'blueprint', resourceId: 'bp-123' })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: EntityQueryOptions = {
        tenantId: 'tenant-1',
        resourceType: 'blueprint',
        resourceId: 'bp-123'
      };

      const results = await service.queryByEntity(options);

      expect(results.length).toBe(2);
      expect(mockRepository.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          resourceType: 'blueprint',
          resourceId: 'bp-123'
        })
      );
    });

    it('should filter by operation type', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ action: 'create', operationType: 'CREATE' }),
        createMockEvent({ action: 'update', operationType: 'UPDATE' }),
        createMockEvent({ action: 'delete', operationType: 'DELETE' })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: EntityQueryOptions = {
        tenantId: 'tenant-1',
        resourceType: 'task',
        resourceId: 'task-456',
        operation: 'DELETE'
      };

      const results = await service.queryByEntity(options);

      expect(results.length).toBe(1);
      expect(results[0].action).toBe('delete');
    });
  });

  describe('queryCompliance', () => {
    it('should filter by compliance framework tag', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ complianceTags: ['GDPR', 'SOC2'] }),
        createMockEvent({ complianceTags: ['HIPAA'] }),
        createMockEvent({ complianceTags: ['GDPR', 'ISO27001'] })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: ComplianceQueryOptions = {
        tenantId: 'tenant-1',
        framework: 'GDPR',
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-31')
      };

      const results = await service.queryCompliance(options);

      expect(results.length).toBe(2);
      results.forEach(event => {
        expect(event.complianceTags).toContain('GDPR');
      });
    });

    it('should filter high-risk events when requested', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ riskScore: 85, complianceTags: ['SOC2'] }),
        createMockEvent({ riskScore: 45, complianceTags: ['SOC2'] }),
        createMockEvent({ riskScore: 75, complianceTags: ['SOC2'] })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: ComplianceQueryOptions = {
        tenantId: 'tenant-1',
        framework: 'SOC2',
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-31'),
        includeHighRiskOnly: true
      };

      const results = await service.queryCompliance(options);

      expect(results.length).toBe(2);
      results.forEach(event => {
        expect(event.riskScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should sort by risk score descending', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ riskScore: 50, complianceTags: ['HIPAA'] }),
        createMockEvent({ riskScore: 90, complianceTags: ['HIPAA'] }),
        createMockEvent({ riskScore: 70, complianceTags: ['HIPAA'] })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const options: ComplianceQueryOptions = {
        tenantId: 'tenant-1',
        framework: 'HIPAA',
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-31')
      };

      const results = await service.queryCompliance(options);

      expect(results[0].riskScore).toBe(90);
      expect(results[1].riskScore).toBe(70);
      expect(results[2].riskScore).toBe(50);
    });
  });

  describe('aggregate', () => {
    it('should calculate aggregation statistics', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ category: AuditCategory.AUTHENTICATION, level: AuditLevel.INFO, riskScore: 20, result: 'success' }),
        createMockEvent({ category: AuditCategory.AUTHENTICATION, level: AuditLevel.WARNING, riskScore: 60, result: 'failure' }),
        createMockEvent({ category: AuditCategory.DATA_ACCESS, level: AuditLevel.CRITICAL, riskScore: 90, result: 'success' }),
        createMockEvent({ category: AuditCategory.SECURITY_EVENT, level: AuditLevel.ERROR, riskScore: 75, result: 'failure' })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const stats = await service.aggregate('tenant-1', new Date('2025-01-01'), new Date('2025-01-31'));

      expect(stats.totalEvents).toBe(4);
      expect(stats.byCategory[AuditCategory.AUTHENTICATION]).toBe(2);
      expect(stats.byCategory[AuditCategory.DATA_ACCESS]).toBe(1);
      expect(stats.byResult.success).toBe(2);
      expect(stats.byResult.failure).toBe(2);
      expect(stats.averageRiskScore).toBe(61); // (20+60+90+75)/4 = 61
      expect(stats.highRiskCount).toBe(2); // 90 and 75
      expect(stats.criticalCount).toBe(1);
    });
  });

  describe('search', () => {
    it('should perform full-text search', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ eventType: 'user.action.login', actor: 'john@example.com' }),
        createMockEvent({ eventType: 'user.action.logout', actor: 'jane@example.com' }),
        createMockEvent({ eventType: 'task.created', resourceType: 'task' })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const results = await service.search('tenant-1', 'login');

      expect(results.length).toBe(1);
      expect(results[0].eventType).toContain('login');
    });
  });

  describe('detectAnomalies', () => {
    it('should identify high-risk events', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ riskScore: 85, autoReviewRequired: true }),
        createMockEvent({ riskScore: 45, autoReviewRequired: false }),
        createMockEvent({ riskScore: 92, autoReviewRequired: true })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const anomalies = await service.detectAnomalies('tenant-1', { riskThreshold: 70 });

      expect(anomalies.length).toBe(2);
      expect(anomalies[0].riskScore).toBe(92); // Sorted descending
      expect(anomalies[1].riskScore).toBe(85);
    });
  });

  describe('getRecentCriticalEvents', () => {
    it('should query recent critical events', async () => {
      mockRepository.query.and.returnValue(Promise.resolve([]));

      await service.getRecentCriticalEvents('tenant-1', 24);

      expect(mockRepository.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          level: AuditLevel.CRITICAL,
          tier: StorageTier.HOT
        })
      );
    });
  });

  describe('getAIDecisions', () => {
    it('should filter AI-related events', async () => {
      const events: ClassifiedAuditEvent[] = [
        createMockEvent({ eventType: 'ai.decision.architectural', aiGenerated: true }),
        createMockEvent({ eventType: 'user.action.login', aiGenerated: false }),
        createMockEvent({ eventType: 'ai.compliance.check', complianceTags: ['AI_GOVERNANCE'] })
      ];
      mockRepository.query.and.returnValue(Promise.resolve(events));

      const aiEvents = await service.getAIDecisions('tenant-1');

      expect(aiEvents.length).toBe(2);
      aiEvents.forEach(event => {
        const isAiEvent =
          event.eventType.startsWith('ai.') || event.aiGenerated === true || event.complianceTags?.includes('AI_GOVERNANCE');
        expect(isAiEvent).toBeTrue();
      });
    });
  });
});
