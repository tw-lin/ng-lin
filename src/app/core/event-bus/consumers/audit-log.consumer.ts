/**
 * Audit Log Consumer
 * 
 * Records all domain events for compliance and security auditing.
 * 
 * **Phase 7B Enhancement**: Integrates with Global Audit Log Service
 * - Converts all domain events to standardized audit events
 * - Leverages AuditCollectorService for intelligent categorization
 * - Maintains backward compatibility with in-memory logs
 * 
 * @module Consumers/AuditLog
 */

import { Injectable, inject, signal } from '@angular/core';
import { EventConsumer } from '../services/event-consumer.base';
import { Subscribe } from '../decorators/subscribe.decorator';
import { EventHandler } from '../decorators/event-handler.decorator';
import { Retry } from '../decorators/retry.decorator';
import { DomainEvent } from '../models/base-event';
import { AuditLogService } from '../services/audit-log.service';
import { AuditCollectorService } from '../services/audit-collector.service';
import { AuditLevel } from '../models/audit-event.model';

/**
 * Audit log entry (legacy interface for backward compatibility)
 */
interface AuditLogEntry {
  readonly id: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly userId: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly changes?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly correlationId?: string;
}

/**
 * Audit Log Consumer
 * 
 * Priority: 100 (highest priority - compliance critical)
 * Tags: audit, compliance, security
 * 
 * Logs all events for compliance auditing.
 * MUST succeed - uses aggressive retry strategy.
 * 
 * **Phase 7B**: Enhanced with Global Audit Log Service integration
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 100,
  tags: ['audit', 'compliance', 'security'],
  description: 'Records all events for audit trail',
  group: 'audit',
  version: '2.0.0' // Updated for Phase 7B
})
export class AuditLogConsumer extends EventConsumer {
  /**
   * Phase 7B: Inject Global Audit Services
   */
  private auditLogService = inject(AuditLogService);
  private auditCollector = inject(AuditCollectorService);
  
  /**
   * Legacy: Audit logs (in-memory for backward compatibility)
   */
  private _auditLogs = signal<AuditLogEntry[]>([]);
  readonly auditLogs = this._auditLogs.asReadonly();

  /**
   * Subscribe to ALL events
   * 
   * Priority 100 ensures this runs before other consumers.
   * Aggressive retry ensures audit trail completeness.
   * 
   * **Phase 7B**: Enhanced with Global Audit Log Service
   */
  @Subscribe('**')
  @Retry({
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  })
  async handleAllEvents(event: DomainEvent<any>): Promise<void> {
    // Phase 7B: Convert to standardized audit event using AuditCollector
    await this.auditCollector.collectFromDomainEvent(event, {
      level: this.determineAuditLevel(event.eventType),
      requiresReview: this.shouldRequireReview(event.eventType)
    });
    
    // Legacy: Also maintain in-memory logs for backward compatibility
    const auditEntry = this.createAuditEntry(event);
    await this.persistAuditLog(auditEntry);
    
    console.log('[AuditLogConsumer] Audit logged (Phase 7B):', event.eventType);
  }

  /**
   * Phase 7B: Determine audit level based on event type
   */
  private determineAuditLevel(eventType: string): AuditLevel {
    const type = eventType.toLowerCase();
    
    if (type.includes('delete') || type.includes('remove') || type.includes('revoke')) {
      return AuditLevel.WARNING;
    }
    if (type.includes('fail') || type.includes('error') || type.includes('denied')) {
      return AuditLevel.ERROR;
    }
    if (type.includes('mfa.disabled') || type.includes('admin') || type.includes('critical')) {
      return AuditLevel.CRITICAL;
    }
    
    return AuditLevel.INFO;
  }
  
  /**
   * Phase 7B: Determine if event should require review
   */
  private shouldRequireReview(eventType: string): boolean {
    const type = eventType.toLowerCase();
    
    const highRiskKeywords = [
      'delete', 'remove', 'revoke', 'disable',
      'admin', 'owner', 'superuser',
      'mfa.disabled', 'password.changed'
    ];
    
    return highRiskKeywords.some(keyword => type.includes(keyword));
  }

  /**
   * Create audit log entry from domain event
   */
  private createAuditEntry(event: DomainEvent<any>): AuditLogEntry {
    const userId = this.extractUserId(event.payload);
    const action = this.extractAction(event.eventType);
    const resource = event.aggregateType || 'Unknown';
    const resourceId = event.aggregateId || event.eventId;
    
    return {
      id: `audit-${event.eventId}`,
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      userId,
      action,
      resource,
      resourceId,
      changes: this.extractChanges(event.payload),
      ipAddress: event.payload?.ipAddress,
      userAgent: event.payload?.userAgent,
      correlationId: event.metadata?.correlationId
    };
  }

  /**
   * Extract user ID from payload
   */
  private extractUserId(payload: any): string {
    return payload?.userId || payload?.user?.id || 'system';
  }

  /**
   * Extract action from event type
   */
  private extractAction(eventType: string): string {
    const parts = eventType.split('.');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Extract changes from payload
   */
  private extractChanges(payload: any): Record<string, unknown> | undefined {
    if (payload?.changes) {
      return {
        new: payload.changes,
        old: payload.previousValues
      };
    }
    return undefined;
  }

  /**
   * Persist audit log entry
   * 
   * In production, this should write to:
   * - Immutable append-only log
   * - Separate audit database
   * - WORM (Write Once Read Many) storage
   */
  private async persistAuditLog(entry: AuditLogEntry): Promise<void> {
    // Add to in-memory store
    this._auditLogs.update(logs => [...logs, entry]);
    
    // Simulate persistence delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // In production:
    // await this.auditLogRepository.create(entry);
    // await this.s3.putObject({
    //   Bucket: 'audit-logs',
    //   Key: `${entry.timestamp.toISOString()}/${entry.id}.json`,
    //   Body: JSON.stringify(entry)
    // });
  }

  /**
   * Query audit logs by user
   */
  getAuditLogsByUser(userId: string): AuditLogEntry[] {
    return this._auditLogs().filter(log => log.userId === userId);
  }

  /**
   * Query audit logs by resource
   */
  getAuditLogsByResource(
    resource: string,
    resourceId: string
  ): AuditLogEntry[] {
    return this._auditLogs().filter(
      log => log.resource === resource && log.resourceId === resourceId
    );
  }

  /**
   * Query audit logs by time range
   */
  getAuditLogsByTimeRange(
    startDate: Date,
    endDate: Date
  ): AuditLogEntry[] {
    return this._auditLogs().filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Query audit logs by correlation ID (trace a request chain)
   */
  getAuditLogsByCorrelation(correlationId: string): AuditLogEntry[] {
    return this._auditLogs().filter(
      log => log.correlationId === correlationId
    );
  }

  /**
   * Export audit logs for compliance reporting
   */
  exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this._auditLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV format
    const headers = Object.keys(logs[0] || {}).join(',');
    const rows = logs.map(log => 
      Object.values(log).map(v => JSON.stringify(v)).join(',')
    );
    return [headers, ...rows].join('\n');
  }
}
