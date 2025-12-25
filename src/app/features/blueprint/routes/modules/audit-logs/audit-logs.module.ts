/**
 * Audit Logs Module
 *
 * Implementation of IBlueprintModule interface for audit logging.
 * Handles module lifecycle and integration with Blueprint Container.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Injectable, signal, inject, WritableSignal } from '@angular/core';

import { AUDIT_LOGS_MODULE_METADATA, AUDIT_LOGS_MODULE_DEFAULT_CONFIG, AUDIT_LOGS_MODULE_EVENTS } from './module.metadata';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditLogsService } from './services/audit-logs.service';
import { ModuleStatus } from '../../shared/enums/module-status.enum';
import type { IExecutionContext } from '../../shared/interfaces/execution-context.interface';
import { IBlueprintModule } from '../../shared/interfaces/module.interface';

/**
 * Audit Logs Module Implementation
 *
 * Provides audit logging functionality for Blueprint V2.
 * Implements full module lifecycle: init → start → ready → stop → dispose.
 */
@Injectable()
export class AuditLogsModule implements IBlueprintModule {
  private readonly auditService = inject(AuditLogsService);
  private readonly auditRepository = inject(AuditLogRepository);

  /** Module ID */
  readonly id = AUDIT_LOGS_MODULE_METADATA.id;

  /** Module name */
  readonly name = AUDIT_LOGS_MODULE_METADATA.name;

  /** Module version */
  readonly version = AUDIT_LOGS_MODULE_METADATA.version;

  /** Module description */
  readonly description = AUDIT_LOGS_MODULE_METADATA.description;

  /** Module dependencies */
  readonly dependencies = AUDIT_LOGS_MODULE_METADATA.dependencies;

  /** Module status signal */
  readonly status: WritableSignal<ModuleStatus> = signal(ModuleStatus.UNINITIALIZED);

  /** Execution context */
  private context?: IExecutionContext;

  /** Blueprint ID */
  private blueprintId?: string;

  /** Event unsubscribe functions */
  private eventUnsubscribers: Array<() => void> = [];

  /** Module exports */
  readonly exports = {
    service: () => this.auditService,
    repository: () => this.auditRepository,
    metadata: AUDIT_LOGS_MODULE_METADATA,
    defaultConfig: AUDIT_LOGS_MODULE_DEFAULT_CONFIG,
    events: AUDIT_LOGS_MODULE_EVENTS
  };

  /**
   * Initialize the module
   */
  async init(context: IExecutionContext): Promise<void> {
    this.status.set(ModuleStatus.INITIALIZING);

    try {
      // Store context
      this.context = context;

      // Extract blueprint ID from context
      this.blueprintId = context.blueprintId;

      if (!this.blueprintId) {
        throw new Error('Blueprint ID not found in execution context');
      }

      // Validate dependencies
      this.validateDependencies(context);

      // Subscribe to module events
      this.subscribeToEvents(context);

      // Register module exports
      this.registerExports(context);

      this.status.set(ModuleStatus.INITIALIZED);
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Start the module
   */
  async start(): Promise<void> {
    this.status.set(ModuleStatus.STARTING);

    try {
      if (!this.blueprintId) {
        throw new Error('Module not initialized - blueprint ID missing');
      }

      // Load initial audit logs (optional - can be lazy loaded)
      // await this.auditService.loadLogs(this.blueprintId, { limit: 50 });

      this.status.set(ModuleStatus.STARTED);
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Signal module is ready
   */
  async ready(): Promise<void> {
    this.status.set(ModuleStatus.READY);

    try {
      // Emit module ready event
      if (this.context?.['eventBus']) {
        this.context['eventBus'].emit(AUDIT_LOGS_MODULE_EVENTS.LOGS_LOADED, { status: 'ready' }, this.id);
      }

      this.status.set(ModuleStatus.RUNNING);
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    this.status.set(ModuleStatus.STOPPING);

    try {
      // Clear service state
      this.auditService.clearState();

      this.status.set(ModuleStatus.STOPPED);
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    try {
      // Unsubscribe from events
      this.unsubscribeFromEvents();

      // Clear all state
      this.auditService.clearState();
      this.context = undefined;
      this.blueprintId = undefined;

      this.status.set(ModuleStatus.DISPOSED);
    } catch (error) {
      this.status.set(ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Validate module dependencies
   *
   * @param _context - Execution context (unused but required by interface)
   */
  private validateDependencies(_context: IExecutionContext): void {
    // Currently no dependencies to validate
  }

  /**
   * Subscribe to module events
   */
  private subscribeToEvents(context: IExecutionContext): void {
    if (!context['eventBus']) {
      return;
    }

    const eventBus = context['eventBus'];

    // Subscribe to audit log events
    this.eventUnsubscribers.push(
      eventBus.on(AUDIT_LOGS_MODULE_EVENTS.LOG_CREATED, (event: any) => {
        // Handle log created event
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on(AUDIT_LOGS_MODULE_EVENTS.LOGS_LOADED, (event: any) => {
        // Handle logs loaded event
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on(AUDIT_LOGS_MODULE_EVENTS.ERROR_OCCURRED, (event: any) => {
        console.error('[AuditLogsModule]', 'Audit error event received', event.payload);
      })
    );
  }

  /**
   * Unsubscribe from events
   */
  private unsubscribeFromEvents(): void {
    // Clean up event subscriptions
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
  }

  /**
   * Register module exports
   *
   * @param _context - Execution context (unused but required by pattern)
   */
  private registerExports(_context: IExecutionContext): void {
    // Exports are available via the exports property
  }
}
