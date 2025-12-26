/**
 * Classification Engine Service - Unit Tests
 *
 * Tests for ClassificationEngineService
 * Validates rule matching, risk scoring, and compliance tagging
 */

import { TestBed } from '@angular/core/testing';
import { ClassificationEngineService, ClassifiedAuditEvent } from './classification-engine.service';
import { AuditEvent, AuditLevel, AuditCategory } from '../../event-bus/models/audit-event.model';

describe('ClassificationEngineService', () => {
  let service: ClassificationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClassificationEngineService]
    });
    service = TestBed.inject(ClassificationEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Authentication Events', () => {
    it('should classify user login success', () => {
      const event: AuditEvent = createMockEvent('user.login');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHENTICATION);
      expect(classified.level).toBe(AuditLevel.INFO);
      expect(classified.riskScore).toBeLessThanOrEqual(15);
      expect(classified.autoReviewRequired).toBe(false);
      expect(classified.complianceTags).toContain('GDPR');
      expect(classified.operationType).toBe('EXECUTE');
    });

    it('should classify user login failure with higher risk', () => {
      const event: AuditEvent = createMockEvent('auth.login.failed', 'failure');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHENTICATION);
      expect(classified.level).toBe(AuditLevel.WARNING);
      expect(classified.riskScore).toBeGreaterThan(40);
      expect(classified.autoReviewRequired).toBe(true);
      expect(classified.complianceTags).toContain('ISO27001');
    });

    it('should classify password change as high risk', () => {
      const event: AuditEvent = createMockEvent('password.changed');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHENTICATION);
      expect(classified.level).toBe(AuditLevel.WARNING);
      expect(classified.riskScore).toBeGreaterThanOrEqual(50);
      expect(classified.autoReviewRequired).toBe(true);
    });

    it('should classify MFA toggle as critical', () => {
      const event: AuditEvent = createMockEvent('mfa.disabled');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHENTICATION);
      expect(classified.level).toBe(AuditLevel.CRITICAL);
      expect(classified.riskScore).toBeGreaterThanOrEqual(80);
      expect(classified.autoReviewRequired).toBe(true);
    });
  });

  describe('Authorization Events', () => {
    it('should classify permission granted', () => {
      const event: AuditEvent = createMockEvent('permission.granted');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHORIZATION);
      expect(classified.level).toBe(AuditLevel.WARNING);
      expect(classified.riskScore).toBeGreaterThanOrEqual(60);
      expect(classified.autoReviewRequired).toBe(true);
      expect(classified.operationType).toBe('CREATE');
    });

    it('should classify permission revoked as critical', () => {
      const event: AuditEvent = createMockEvent('permission.revoked');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.AUTHORIZATION);
      expect(classified.level).toBe(AuditLevel.CRITICAL);
      expect(classified.riskScore).toBeGreaterThanOrEqual(70);
      expect(classified.autoReviewRequired).toBe(true);
      expect(classified.operationType).toBe('DELETE');
    });

    it('should classify role changes correctly', () => {
      const assignEvent = createMockEvent('role.assigned');
      const unassignEvent = createMockEvent('role.unassigned');

      const assignClassified = service.classify(assignEvent);
      const unassignClassified = service.classify(unassignEvent);

      expect(assignClassified.category).toBe(AuditCategory.ROLE);
      expect(unassignClassified.category).toBe(AuditCategory.ROLE);
      expect(unassignClassified.level).toBe(AuditLevel.CRITICAL);
      expect(unassignClassified.riskScore).toBeGreaterThan(assignClassified.riskScore);
    });
  });

  describe('Data Events', () => {
    it('should classify data read as low risk', () => {
      const event: AuditEvent = createMockEvent('data.read');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.DATA_ACCESS);
      expect(classified.level).toBe(AuditLevel.INFO);
      expect(classified.riskScore).toBeLessThan(20);
      expect(classified.autoReviewRequired).toBe(false);
      expect(classified.operationType).toBe('READ');
    });

    it('should classify PII access with higher risk', () => {
      const event: AuditEvent = createMockEvent('pii.accessed');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.DATA_ACCESS);
      expect(classified.level).toBe(AuditLevel.WARNING);
      expect(classified.riskScore).toBeGreaterThanOrEqual(55);
      expect(classified.autoReviewRequired).toBe(true);
      expect(classified.complianceTags).toContain('HIPAA');
    });

    it('should classify data deletion as critical', () => {
      const event: AuditEvent = createMockEvent('blueprint.deleted');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.DATA_MODIFICATION);
      expect(classified.level).toBe(AuditLevel.CRITICAL);
      expect(classified.riskScore).toBeGreaterThanOrEqual(85);
      expect(classified.autoReviewRequired).toBe(true);
      expect(classified.operationType).toBe('DELETE');
    });
  });

  describe('AI Decision Events', () => {
    it('should classify AI architectural decisions', () => {
      const event: AuditEvent = createMockEvent('ai.decision.architectural');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.BUSINESS_OPERATION);
      expect(classified.level).toBe(AuditLevel.INFO);
      expect(classified.aiGenerated).toBe(true);
      expect(classified.complianceTags).toContain('AI_GOVERNANCE');
      expect(classified.autoReviewRequired).toBe(true);
    });

    it('should classify AI compliance checks', () => {
      const event: AuditEvent = createMockEvent('ai.compliance');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.COMPLIANCE);
      expect(classified.aiGenerated).toBe(true);
      expect(classified.complianceTags).toContain('AI_GOVERNANCE');
    });

    it('should classify AI side effect detection', () => {
      const event: AuditEvent = createMockEvent('ai.side_effect.detected');
      const classified = service.classify(event);

      expect(classified.level).toBe(AuditLevel.WARNING);
      expect(classified.aiGenerated).toBe(true);
      expect(classified.riskScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Security Events', () => {
    it('should classify security violations as critical', () => {
      const event: AuditEvent = createMockEvent('security.violation');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.SECURITY);
      expect(classified.level).toBe(AuditLevel.CRITICAL);
      expect(classified.riskScore).toBeGreaterThanOrEqual(95);
      expect(classified.autoReviewRequired).toBe(true);
    });

    it('should classify suspicious activity', () => {
      const event: AuditEvent = createMockEvent('security.suspicious');
      const classified = service.classify(event);

      expect(classified.category).toBe(AuditCategory.SECURITY);
      expect(classified.level).toBe(AuditLevel.CRITICAL);
      expect(classified.riskScore).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Batch Classification', () => {
    it('should classify multiple events', () => {
      const events: AuditEvent[] = [createMockEvent('user.login'), createMockEvent('data.created'), createMockEvent('permission.revoked')];

      const classified = service.classifyBatch(events);

      expect(classified.length).toBe(3);
      expect(classified[0].category).toBe(AuditCategory.AUTHENTICATION);
      expect(classified[1].category).toBe(AuditCategory.DATA_MODIFICATION);
      expect(classified[2].category).toBe(AuditCategory.AUTHORIZATION);
    });
  });

  describe('Risk Statistics', () => {
    it('should calculate risk statistics correctly', () => {
      const events: ClassifiedAuditEvent[] = [
        service.classify(createMockEvent('user.login')),
        service.classify(createMockEvent('security.violation')),
        service.classify(createMockEvent('permission.revoked')),
        service.classify(createMockEvent('data.read'))
      ];

      const stats = service.getRiskStatistics(events);

      expect(stats.averageRisk).toBeGreaterThan(0);
      expect(stats.highRiskCount).toBeGreaterThan(0);
      expect(stats.criticalCount).toBeGreaterThanOrEqual(1);
      expect(stats.reviewRequiredCount).toBeGreaterThan(0);
    });

    it('should handle empty events array', () => {
      const stats = service.getRiskStatistics([]);

      expect(stats.averageRisk).toBe(0);
      expect(stats.highRiskCount).toBe(0);
      expect(stats.criticalCount).toBe(0);
      expect(stats.reviewRequiredCount).toBe(0);
    });
  });

  describe('Default Classification', () => {
    it('should apply default classification for unknown event types', () => {
      const event: AuditEvent = createMockEvent('unknown.event.type');
      const classified = service.classify(event);

      expect(classified.riskScore).toBe(20);
      expect(classified.autoReviewRequired).toBe(false);
      expect(classified.complianceTags).toEqual([]);
    });
  });

  describe('Operation Type Inference', () => {
    it('should infer CREATE operation', () => {
      const event = createMockEvent('resource.created');
      const classified = service.classify(event);
      expect(classified.operationType).toBe('CREATE');
    });

    it('should infer UPDATE operation', () => {
      const event = createMockEvent('entity.updated');
      const classified = service.classify(event);
      expect(classified.operationType).toBe('UPDATE');
    });

    it('should infer DELETE operation', () => {
      const event = createMockEvent('task.deleted');
      const classified = service.classify(event);
      expect(classified.operationType).toBe('DELETE');
    });

    it('should infer EXECUTE operation', () => {
      const event = createMockEvent('process.execute');
      const classified = service.classify(event);
      expect(classified.operationType).toBe('EXECUTE');
    });
  });
});

/**
 * Helper function to create mock audit events
 */
function createMockEvent(eventType: string, result: 'success' | 'failure' | 'partial' = 'success'): AuditEvent {
  return {
    id: `audit-${Date.now()}`,
    eventId: `event-${Date.now()}`,
    eventType,
    timestamp: new Date(),
    level: AuditLevel.INFO,
    category: AuditCategory.BUSINESS_OPERATION,
    actor: 'test-user',
    tenantId: 'test-tenant',
    action: eventType.split('.').pop() || 'unknown',
    resourceType: 'test-resource',
    resourceId: 'test-id',
    result,
    metadata: {},
    requiresReview: false,
    reviewed: false
  };
}
