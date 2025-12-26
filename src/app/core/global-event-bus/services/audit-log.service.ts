/**
 * Global Audit Log Service
 *
 * 全域審計日誌服務
 * - 統一審計事件收集與查詢
 * - 整合 Event Bus 自動記錄所有重要操作
 * - 提供 Signal-based 即時統計
 * - 支援 Firestore 長期持久化
 * - 遵循 docs/⭐️/Global Audit Log.md 規範
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EVENT_BUS } from '../constants/event-bus-tokens';
import { IEventBus } from '../interfaces/event-bus.interface';
import {
  AuditEvent,
  AuditEventBuilder,
  AuditLevel,
  AuditCategory,
  AuditEventQuery,
  AuditEventStatistics,
  AuditChanges
} from '../models/audit-event.model';
import { DomainEvent } from '../models/base-event';

/**
 * 審計日誌配置
 */
export interface AuditLogConfig {
  /** 是否啟用自動審計 */
  enabled: boolean;
  /** In-Memory 儲存上限 */
  maxInMemoryEvents: number;
  /** 是否啟用 Firestore 持久化 */
  persistToFirestore: boolean;
  /** Firestore Collection 名稱 */
  firestoreCollection: string;
  /** 是否自動標記高風險操作需要審查 */
  autoMarkHighRiskForReview: boolean;
  /** 高風險操作列表 */
  highRiskActions: string[];
}

/**
 * 預設配置
 */
const DEFAULT_CONFIG: AuditLogConfig = {
  enabled: true,
  maxInMemoryEvents: 1000,
  persistToFirestore: false, // Phase 7B 先使用 In-Memory
  firestoreCollection: 'audit_logs',
  autoMarkHighRiskForReview: true,
  highRiskActions: [
    'delete',
    'remove',
    'revoke',
    'disable',
    'admin',
    'owner',
    'superuser',
    'password.changed',
    'mfa.disabled',
    'permission.revoked',
    'role.unassigned'
  ]
};

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private eventBus = inject(EVENT_BUS);
  private destroyRef = inject(DestroyRef);

  /**
   * 服務配置
   */
  private _config = signal<AuditLogConfig>(DEFAULT_CONFIG);
  readonly config = this._config.asReadonly();

  /**
   * In-Memory 審計事件儲存
   */
  private _auditEvents = signal<AuditEvent[]>([]);
  readonly auditEvents = this._auditEvents.asReadonly();

  /**
   * 審計統計 (Signal-based)
   */
  private _totalEvents = signal(0);
  private _infoEvents = signal(0);
  private _warningEvents = signal(0);
  private _errorEvents = signal(0);
  private _criticalEvents = signal(0);
  private _successCount = signal(0);
  private _failureCount = signal(0);
  private _requiresReviewCount = signal(0);
  private _reviewedCount = signal(0);

  readonly totalEvents = this._totalEvents.asReadonly();
  readonly infoEvents = this._infoEvents.asReadonly();
  readonly warningEvents = this._warningEvents.asReadonly();
  readonly errorEvents = this._errorEvents.asReadonly();
  readonly criticalEvents = this._criticalEvents.asReadonly();
  readonly successCount = this._successCount.asReadonly();
  readonly failureCount = this._failureCount.asReadonly();
  readonly requiresReviewCount = this._requiresReviewCount.asReadonly();
  readonly reviewedCount = this._reviewedCount.asReadonly();

  /**
   * Computed Signals
   */
  readonly statistics = computed(
    (): AuditEventStatistics => ({
      totalEvents: this._totalEvents(),
      byLevel: {
        [AuditLevel.INFO]: this._infoEvents(),
        [AuditLevel.WARNING]: this._warningEvents(),
        [AuditLevel.ERROR]: this._errorEvents(),
        [AuditLevel.CRITICAL]: this._criticalEvents()
      },
      byCategory: this.calculateCategoryStatistics(),
      successCount: this._successCount(),
      failureCount: this._failureCount(),
      requiresReviewCount: this._requiresReviewCount(),
      reviewedCount: this._reviewedCount(),
      lastUpdated: new Date()
    })
  );

  readonly recentEvents = computed(() => this._auditEvents().slice(-100).reverse());

  readonly eventsRequiringReview = computed(() => this._auditEvents().filter(event => event.requiresReview && !event.reviewed));

  readonly criticalUnreviewedEvents = computed(() =>
    this._auditEvents().filter(event => (event.level === AuditLevel.CRITICAL || event.level === AuditLevel.ERROR) && !event.reviewed)
  );

  constructor() {
    // Phase 7B: No auto-subscription to Event Bus
    // Audit events will be created by specific consumers (AuthEventConsumer, etc.)
    console.log('[AuditLogService] Initialized - Ready to collect audit events');
  }

  /**
   * 記錄審計事件
   */
  async logAuditEvent(event: AuditEvent): Promise<void> {
    if (!this._config().enabled) {
      return;
    }

    // 檢查是否需要標記為需審查
    if (this._config().autoMarkHighRiskForReview && !event.requiresReview) {
      const isHighRisk = this.isHighRiskAction(event.action);
      if (isHighRisk) {
        event = { ...event, requiresReview: true };
      }
    }

    // 新增到 In-Memory 儲存
    this._auditEvents.update(events => {
      const updatedEvents = [...events, event];
      const maxEvents = this._config().maxInMemoryEvents;

      // 如果超過上限，移除最舊的事件
      if (updatedEvents.length > maxEvents) {
        return updatedEvents.slice(-maxEvents);
      }
      return updatedEvents;
    });

    // 更新統計
    this.updateStatistics(event);

    // TODO Phase 7C: Persist to Firestore if enabled
    if (this._config().persistToFirestore) {
      await this.persistToFirestore(event);
    }

    console.log('[AuditLogService] Audit event logged:', event.id, event.action);
  }

  /**
   * 批次記錄審計事件
   */
  async logBatch(events: AuditEvent[]): Promise<void> {
    for (const event of events) {
      await this.logAuditEvent(event);
    }
  }

  /**
   * 查詢審計事件
   */
  queryEvents(query: AuditEventQuery): AuditEvent[] {
    let filtered = this._auditEvents();

    if (query.tenantId) {
      filtered = filtered.filter(e => e.tenantId === query.tenantId);
    }

    if (query.actor) {
      filtered = filtered.filter(e => e.actor === query.actor);
    }

    if (query.resourceType) {
      filtered = filtered.filter(e => e.resourceType === query.resourceType);
    }

    if (query.resourceId) {
      filtered = filtered.filter(e => e.resourceId === query.resourceId);
    }

    if (query.level) {
      filtered = filtered.filter(e => e.level === query.level);
    }

    if (query.category) {
      filtered = filtered.filter(e => e.category === query.category);
    }

    if (query.result) {
      filtered = filtered.filter(e => e.result === query.result);
    }

    if (query.requiresReviewOnly) {
      filtered = filtered.filter(e => e.requiresReview && !e.reviewed);
    }

    if (query.reviewedOnly) {
      filtered = filtered.filter(e => e.reviewed);
    }

    if (query.startTime) {
      filtered = filtered.filter(e => e.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      filtered = filtered.filter(e => e.timestamp <= query.endTime!);
    }

    // 排序: 最新的在前
    filtered = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 分頁
    const offset = query.offset || 0;
    const limit = query.limit || filtered.length;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * 取得用戶審計歷史
   */
  getUserAuditHistory(userId: string, limit = 100): AuditEvent[] {
    return this.queryEvents({
      actor: userId,
      limit
    });
  }

  /**
   * 取得資源審計歷史
   */
  getResourceAuditHistory(resourceType: string, resourceId: string, limit = 100): AuditEvent[] {
    return this.queryEvents({
      resourceType,
      resourceId,
      limit
    });
  }

  /**
   * 標記事件為已審查
   */
  markAsReviewed(eventId: string, reviewedBy: string, notes?: string): void {
    this._auditEvents.update(events =>
      events.map(event => {
        if (event.id === eventId) {
          this._reviewedCount.update(c => c + 1);
          if (event.requiresReview) {
            this._requiresReviewCount.update(c => Math.max(0, c - 1));
          }
          return {
            ...event,
            reviewed: true,
            reviewedBy,
            reviewedAt: new Date(),
            reviewNotes: notes
          };
        }
        return event;
      })
    );
  }

  /**
   * 導出審計事件 (JSON)
   */
  exportToJSON(query?: AuditEventQuery): string {
    const events = query ? this.queryEvents(query) : this._auditEvents();
    return JSON.stringify(events, null, 2);
  }

  /**
   * 清除所有審計事件 (危險操作)
   */
  clearAll(): void {
    this._auditEvents.set([]);
    this.resetStatistics();
    console.warn('[AuditLogService] All audit events cleared');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AuditLogConfig>): void {
    this._config.update(current => ({ ...current, ...config }));
  }

  /**
   * 私有方法: 更新統計
   */
  private updateStatistics(event: AuditEvent): void {
    this._totalEvents.update(c => c + 1);

    // 更新級別統計
    switch (event.level) {
      case AuditLevel.INFO:
        this._infoEvents.update(c => c + 1);
        break;
      case AuditLevel.WARNING:
        this._warningEvents.update(c => c + 1);
        break;
      case AuditLevel.ERROR:
        this._errorEvents.update(c => c + 1);
        break;
      case AuditLevel.CRITICAL:
        this._criticalEvents.update(c => c + 1);
        break;
    }

    // 更新結果統計
    if (event.result === 'success') {
      this._successCount.update(c => c + 1);
    } else if (event.result === 'failure') {
      this._failureCount.update(c => c + 1);
    }

    // 更新審查統計
    if (event.requiresReview && !event.reviewed) {
      this._requiresReviewCount.update(c => c + 1);
    }
    if (event.reviewed) {
      this._reviewedCount.update(c => c + 1);
    }
  }

  /**
   * 私有方法: 計算類別統計
   */
  private calculateCategoryStatistics(): Record<AuditCategory, number> {
    const stats: Record<AuditCategory, number> = {
      [AuditCategory.AUTHENTICATION]: 0,
      [AuditCategory.AUTHORIZATION]: 0,
      [AuditCategory.PERMISSION]: 0,
      [AuditCategory.ROLE]: 0,
      [AuditCategory.DATA_ACCESS]: 0,
      [AuditCategory.DATA_MODIFICATION]: 0,
      [AuditCategory.SYSTEM_CONFIGURATION]: 0,
      [AuditCategory.SECURITY]: 0,
      [AuditCategory.COMPLIANCE]: 0,
      [AuditCategory.BUSINESS_OPERATION]: 0
    };

    this._auditEvents().forEach(event => {
      stats[event.category] = (stats[event.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * 私有方法: 檢查是否為高風險操作
   */
  private isHighRiskAction(action: string): boolean {
    const highRiskActions = this._config().highRiskActions;
    return highRiskActions.some(riskAction => action.toLowerCase().includes(riskAction.toLowerCase()));
  }

  /**
   * 私有方法: 重置統計
   */
  private resetStatistics(): void {
    this._totalEvents.set(0);
    this._infoEvents.set(0);
    this._warningEvents.set(0);
    this._errorEvents.set(0);
    this._criticalEvents.set(0);
    this._successCount.set(0);
    this._failureCount.set(0);
    this._requiresReviewCount.set(0);
    this._reviewedCount.set(0);
  }

  /**
   * 私有方法: 持久化到 Firestore (Phase 7C 實作)
   */
  private async persistToFirestore(event: AuditEvent): Promise<void> {
    // TODO: Implement Firestore persistence
    console.log('[AuditLogService] Firestore persistence not yet implemented:', event.id);
  }
}
