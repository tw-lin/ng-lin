/**
 * Audit Logs Service
 *
 * Business logic layer for audit log management.
 * Provides high-level operations for recording and querying audit logs.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, inject, signal, computed } from '@angular/core';

import {
  AuditLogDocument,
  CreateAuditLogData,
  AuditLogQueryOptions,
  AuditLogSummary,
  AuditEventType,
  AuditCategory,
  AuditSeverity,
  AuditStatus,
  ActorType
} from '../models/audit-log.model';
import { AuditLogRepository } from '../repositories/audit-log.repository';

/**
 * Audit Logs Service
 *
 * Provides centralized audit logging functionality with Signal-based state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private readonly repository = inject(AuditLogRepository);

  // Private state signals
  private readonly _logs = signal<AuditLogDocument[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<Error | null>(null);
  private readonly _summary = signal<AuditLogSummary | null>(null);

  // Public readonly signals
  readonly logs = this._logs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly summary = this._summary.asReadonly();

  // Computed signals
  readonly hasLogs = computed(() => this._logs().length > 0);
  readonly errorCount = computed(() => this._logs().filter(log => log.status === AuditStatus.FAILED).length);
  readonly recentLogs = computed(() => this._logs().slice(0, 10));

  /**
   * Record a new audit log entry
   */
  async recordLog(data: CreateAuditLogData): Promise<AuditLogDocument> {
    try {
      const log = await this.repository.create(data);

      // Add to local state
      this._logs.update(logs => [log, ...logs]);

      return log;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record a batch of audit log entries
   */
  async recordBatch(logs: CreateAuditLogData[]): Promise<void> {
    try {
      await this.repository.createBatch(logs);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load audit logs for a blueprint
   */
  async loadLogs(blueprintId: string, options: AuditLogQueryOptions = {}): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const logs = await this.repository.queryLogs(blueprintId, {
        ...options,
        limit: options.limit || 100
      });

      this._logs.set(logs);
    } catch (error) {
      this._error.set(error as Error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load audit log summary statistics
   */
  async loadSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<void> {
    try {
      const summary = await this.repository.getSummary(blueprintId, startDate, endDate);
      this._summary.set(summary);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filter logs by category
   */
  async filterByCategory(blueprintId: string, category: AuditCategory): Promise<void> {
    await this.loadLogs(blueprintId, { category });
  }

  /**
   * Filter logs by event type
   */
  async filterByEventType(blueprintId: string, eventType: AuditEventType): Promise<void> {
    await this.loadLogs(blueprintId, { eventType });
  }

  /**
   * Filter logs by resource type
   */
  async filterByResourceType(blueprintId: string, resourceType: string): Promise<void> {
    await this.loadLogs(blueprintId, { resourceType });
  }

  /**
   * Clear local state
   */
  clearState(): void {
    this._logs.set([]);
    this._error.set(null);
    this._summary.set(null);
    this._loading.set(false);
  }

  /**
   * Helper: Create a success audit log
   */
  createSuccessLog(
    blueprintId: string,
    eventType: AuditEventType,
    category: AuditCategory,
    actorId: string,
    action: string,
    message: string,
    options?: Partial<CreateAuditLogData>
  ): CreateAuditLogData {
    return {
      blueprintId,
      eventType,
      category,
      severity: AuditSeverity.INFO,
      actorId,
      actorType: ActorType.USER,
      resourceType: 'blueprint',
      action,
      message,
      status: AuditStatus.SUCCESS,
      ...options
    };
  }

  /**
   * Helper: Create an error audit log
   */
  createErrorLog(
    blueprintId: string,
    eventType: AuditEventType,
    category: AuditCategory,
    actorId: string,
    action: string,
    message: string,
    error: Error,
    options?: Partial<CreateAuditLogData>
  ): CreateAuditLogData {
    return {
      blueprintId,
      eventType,
      category,
      severity: AuditSeverity.HIGH,
      actorId,
      actorType: ActorType.USER,
      resourceType: 'blueprint',
      action,
      message,
      status: AuditStatus.FAILED,
      error: {
        code: 'ERROR',
        message: error.message,
        stackTrace: error.stack
      },
      ...options
    };
  }
}
