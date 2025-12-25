/**
 * Permission Audit Service
 * 
 * 權限審計服務
 * - 自動訂閱所有權限與角色變更事件
 * - 轉換為審計格式並記錄
 * - 提供 Signal-based 即時統計
 * - 遵循 docs/⭐️/Identity & Auth.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { IEventBus } from '../interfaces/event-bus.interface';
import { EVENT_BUS } from '../constants/event-bus-tokens';
import {
  PermissionAuditEvent,
  PermissionAuditEventBuilder,
  PermissionActionType,
  RoleActionType
} from '../models/permission-audit-event.model';
import { AuditLevel, AuditCategory } from '../models/audit-event.model';
import { PermissionChangedEvent, RoleChangedEvent } from '../domain-events/auth-events';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * 權限審計統計資訊
 */
export interface PermissionAuditStatistics {
  /** 總審計事件數 */
  totalEvents: number;
  /** 權限授予次數 */
  permissionsGranted: number;
  /** 權限撤銷次數 */
  permissionsRevoked: number;
  /** 權限更新次數 */
  permissionsUpdated: number;
  /** 角色分配次數 */
  rolesAssigned: number;
  /** 角色移除次數 */
  rolesUnassigned: number;
  /** 角色更新次數 */
  rolesUpdated: number;
  /** 需要審查的事件數 */
  requiresReview: number;
  /** 警告級別事件數 */
  warningEvents: number;
}

/**
 * 權限審計過濾條件
 */
export interface PermissionAuditFilter {
  /** 目標用戶 ID */
  targetUserId?: string;
  /** 執行者 ID */
  executorId?: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 資源類型 */
  resourceType?: string;
  /** 資源 ID */
  resourceId?: string;
  /** 操作類型 */
  actionType?: PermissionActionType | RoleActionType;
  /** 只顯示需要審查的 */
  requiresReviewOnly?: boolean;
  /** 時間範圍 */
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Permission Audit Service
 * 
 * 職責:
 * 1. 訂閱所有權限與角色變更事件
 * 2. 轉換為審計格式
 * 3. 記錄到審計日誌系統
 * 4. 提供即時統計
 * 5. 支援權限變更歷史查詢
 * 6. 檢測異常權限變更
 */
@Injectable({ providedIn: 'root' })
export class PermissionAuditService {
  private eventBus = inject(EVENT_BUS);
  private destroyRef = inject(DestroyRef);

  // ========================================
  // State Management with Signals
  // ========================================

  /** 審計事件儲存 (In-Memory) */
  private _auditEvents = signal<PermissionAuditEvent[]>([]);

  /** Public readonly audit events */
  readonly auditEvents = this._auditEvents.asReadonly();

  /** 統計資訊 (Computed) */
  readonly statistics = computed<PermissionAuditStatistics>(() => {
    const events = this._auditEvents();

    return {
      totalEvents: events.length,
      permissionsGranted: events.filter(e => 
        e.category === AuditCategory.PERMISSION && e.actionType === PermissionActionType.GRANT
      ).length,
      permissionsRevoked: events.filter(e => 
        e.category === AuditCategory.PERMISSION && e.actionType === PermissionActionType.REVOKE
      ).length,
      permissionsUpdated: events.filter(e => 
        e.category === AuditCategory.PERMISSION && e.actionType === PermissionActionType.UPDATE
      ).length,
      rolesAssigned: events.filter(e => 
        e.category === AuditCategory.ROLE && e.actionType === RoleActionType.ASSIGN
      ).length,
      rolesUnassigned: events.filter(e => 
        e.category === AuditCategory.ROLE && e.actionType === RoleActionType.UNASSIGN
      ).length,
      rolesUpdated: events.filter(e => 
        e.category === AuditCategory.ROLE && e.actionType === RoleActionType.UPDATE
      ).length,
      requiresReview: events.filter(e => e.requiresReview).length,
      warningEvents: events.filter(e => e.level === AuditLevel.WARNING).length
    };
  });

  /** 最近的審計事件 (最多保留 100 筆) */
  readonly recentEvents = computed(() => {
    return this._auditEvents().slice(-100).reverse();
  });

  /** 需要審查的事件 */
  readonly eventsRequiringReview = computed(() => {
    return this._auditEvents().filter(e => e.requiresReview);
  });

  /** 權限撤銷事件 (高風險) */
  readonly revokedPermissions = computed(() => {
    return this._auditEvents().filter(e => 
      e.category === AuditCategory.PERMISSION && 
      e.actionType === PermissionActionType.REVOKE
    );
  });

  /** 角色移除事件 (高風險) */
  readonly unassignedRoles = computed(() => {
    return this._auditEvents().filter(e => 
      e.category === AuditCategory.ROLE && 
      e.actionType === RoleActionType.UNASSIGN
    );
  });

  // ========================================
  // Lifecycle
  // ========================================

  constructor() {
    this.subscribeToPermissionEvents();
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 訂閱所有權限與角色事件
   */
  private subscribeToPermissionEvents(): void {
    // 訂閱權限變更事件
    this.eventBus.observe('auth.permission.changed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => this.handlePermissionChangedEvent(event as any),
        error: (error) => console.error('[PermissionAuditService] Permission event error:', error)
      });

    // 訂閱角色變更事件
    this.eventBus.observe('auth.role.changed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => this.handleRoleChangedEvent(event as any),
        error: (error) => console.error('[PermissionAuditService] Role event error:', error)
      });
  }

  /**
   * 處理權限變更事件
   */
  private handlePermissionChangedEvent(domainEvent: PermissionChangedEvent): void {
    try {
      const auditEvent = PermissionAuditEventBuilder.fromPermissionChangedEvent(domainEvent);
      this.recordAuditEvent(auditEvent);
      this.persistAuditEvent(auditEvent);

      // 檢測異常權限變更
      if (this.detectAnomalousPermissionChange(auditEvent)) {
        this.sendAlert(auditEvent);
      }
    } catch (error) {
      console.error('[PermissionAuditService] Failed to handle permission event:', error, domainEvent);
    }
  }

  /**
   * 處理角色變更事件
   */
  private handleRoleChangedEvent(domainEvent: RoleChangedEvent): void {
    try {
      const auditEvent = PermissionAuditEventBuilder.fromRoleChangedEvent(domainEvent);
      this.recordAuditEvent(auditEvent);
      this.persistAuditEvent(auditEvent);

      // 檢測異常角色變更
      if (this.detectAnomalousRoleChange(auditEvent)) {
        this.sendAlert(auditEvent);
      }
    } catch (error) {
      console.error('[PermissionAuditService] Failed to handle role event:', error, domainEvent);
    }
  }

  /**
   * 記錄審計事件到 In-Memory Store
   */
  private recordAuditEvent(auditEvent: PermissionAuditEvent): void {
    this._auditEvents.update(events => {
      const updatedEvents = [...events, auditEvent];
      
      // 限制記憶體使用，只保留最近 1000 筆
      if (updatedEvents.length > 1000) {
        return updatedEvents.slice(-1000);
      }
      
      return updatedEvents;
    });
  }

  /**
   * 持久化審計事件
   */
  private persistAuditEvent(auditEvent: PermissionAuditEvent): void {
    console.log('[PermissionAuditService] Audit event recorded:', {
      type: auditEvent.eventType,
      target: auditEvent.targetUserEmail,
      executor: auditEvent.executorEmail,
      action: auditEvent.actionType,
      resource: `${auditEvent.resourceType}:${auditEvent.resourceId}`,
      timestamp: auditEvent.timestamp
    });

    // TODO: 整合 Global Audit Log Service
  }

  /**
   * 檢測異常權限變更
   */
  private detectAnomalousPermissionChange(auditEvent: PermissionAuditEvent): boolean {
    // 1. 撤銷權限一律視為異常
    if (auditEvent.actionType === PermissionActionType.REVOKE) {
      return true;
    }

    // 2. 大量權限變更 (>5 個權限)
    const addedCount = auditEvent.newState.permissions?.length || 0;
    const previousCount = auditEvent.previousState.permissions?.length || 0;
    const changeCount = Math.abs(addedCount - previousCount);
    
    if (changeCount > 5) {
      return true;
    }

    // 3. 授予高風險權限 (例如: admin, delete, write-all)
    const highRiskPermissions = ['admin', 'delete', 'write-all', 'manage-users', 'manage-roles'];
    const hasHighRiskPermission = auditEvent.newState.permissions?.some(p => 
      highRiskPermissions.some(risk => p.toLowerCase().includes(risk))
    );
    
    if (hasHighRiskPermission) {
      return true;
    }

    return false;
  }

  /**
   * 檢測異常角色變更
   */
  private detectAnomalousRoleChange(auditEvent: PermissionAuditEvent): boolean {
    // 1. 移除角色一律視為異常
    if (auditEvent.actionType === RoleActionType.UNASSIGN) {
      return true;
    }

    // 2. 分配高權限角色 (例如: admin, owner, superuser)
    const highRiskRoles = ['admin', 'owner', 'superuser', 'root'];
    const hasHighRiskRole = auditEvent.newState.roles?.some(r => 
      highRiskRoles.some(risk => r.toLowerCase().includes(risk))
    );
    
    if (hasHighRiskRole) {
      return true;
    }

    return false;
  }

  /**
   * 發送告警
   */
  private sendAlert(auditEvent: PermissionAuditEvent): void {
    console.warn('[PermissionAuditService] ALERT - Anomalous permission/role change:', {
      type: auditEvent.eventType,
      target: auditEvent.targetUserEmail,
      executor: auditEvent.executorEmail,
      action: auditEvent.actionType,
      description: auditEvent.description
    });

    // TODO: 整合 Notification Service
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * 查詢審計事件 (基於過濾條件)
   */
  getFilteredEvents(filter: PermissionAuditFilter): PermissionAuditEvent[] {
    let events = this._auditEvents();

    if (filter.targetUserId) {
      events = events.filter(e => e.targetUserId === filter.targetUserId);
    }

    if (filter.executorId) {
      events = events.filter(e => e.executorId === filter.executorId);
    }

    if (filter.tenantId) {
      events = events.filter(e => e.tenantId === filter.tenantId);
    }

    if (filter.resourceType) {
      events = events.filter(e => e.resourceType === filter.resourceType);
    }

    if (filter.resourceId) {
      events = events.filter(e => e.resourceId === filter.resourceId);
    }

    if (filter.actionType) {
      events = events.filter(e => e.actionType === filter.actionType);
    }

    if (filter.requiresReviewOnly) {
      events = events.filter(e => e.requiresReview);
    }

    if (filter.dateRange) {
      events = events.filter(e => {
        const timestamp = new Date(e.timestamp);
        return timestamp >= filter.dateRange!.from && timestamp <= filter.dateRange!.to;
      });
    }

    return events;
  }

  /**
   * 獲取用戶的權限變更歷史
   */
  getUserPermissionHistory(userId: string, limit = 50): PermissionAuditEvent[] {
    return this._auditEvents()
      .filter(e => e.targetUserId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * 獲取資源的權限變更歷史
   */
  getResourcePermissionHistory(
    resourceType: string, 
    resourceId: string, 
    limit = 50
  ): PermissionAuditEvent[] {
    return this._auditEvents()
      .filter(e => e.resourceType === resourceType && e.resourceId === resourceId)
      .slice(-limit)
      .reverse();
  }

  /**
   * 清除審計事件 (僅 In-Memory)
   */
  clearAuditEvents(): void {
    this._auditEvents.set([]);
    console.log('[PermissionAuditService] In-memory audit events cleared');
  }

  /**
   * 導出審計事件
   */
  exportAuditEvents(filter?: PermissionAuditFilter): string {
    const events = filter ? this.getFilteredEvents(filter) : this._auditEvents();
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      statistics: this.statistics(),
      events: events
    }, null, 2);
  }
}
