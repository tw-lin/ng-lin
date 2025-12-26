/**
 * Auth Audit Service
 * 
 * 認證審計服務
 * - 自動訂閱所有認證相關事件
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
  AuthAuditEvent,
  AuthAuditEventBuilder,
  AuditLevel,
  AuditCategory
} from '../models/auth-audit-event.model';
import {
  UserLoginEvent,
  UserLogoutEvent,
  PasswordChangedEvent,
  MFAEnabledEvent,
  MFADisabledEvent,
  TokenRefreshedEvent,
  SessionExpiredEvent,
  LoginFailedEvent,
  EmailVerifiedEvent
} from '../domain-events/auth-events';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * 審計統計資訊
 */
export interface AuthAuditStatistics {
  /** 總審計事件數 */
  totalEvents: number;
  /** 成功登入次數 */
  successfulLogins: number;
  /** 失敗登入次數 */
  failedLogins: number;
  /** 登出次數 */
  logouts: number;
  /** 密碼變更次數 */
  passwordChanges: number;
  /** MFA 啟用次數 */
  mfaEnabled: number;
  /** MFA 禁用次數 */
  mfaDisabled: number;
  /** Token 刷新次數 */
  tokenRefreshes: number;
  /** Session 過期次數 */
  sessionExpired: number;
  /** Email 驗證次數 */
  emailVerifications: number;
  /** 需要審查的事件數 */
  requiresReview: number;
  /** 嚴重事件數 (WARNING + CRITICAL) */
  criticalEvents: number;
}

/**
 * 審計事件過濾條件
 */
export interface AuthAuditFilter {
  /** 用戶 ID */
  userId?: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 事件類別 */
  category?: AuditCategory;
  /** 嚴重級別 */
  level?: AuditLevel;
  /** 只顯示需要審查的 */
  requiresReviewOnly?: boolean;
  /** 時間範圍 */
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Auth Audit Service
 * 
 * 職責:
 * 1. 訂閱所有認證相關事件
 * 2. 轉換為審計格式
 * 3. 記錄到審計日誌系統
 * 4. 提供即時統計
 * 5. 支援審計事件查詢
 */
@Injectable({ providedIn: 'root' })
export class AuthAuditService {
  private eventBus = inject(EVENT_BUS);
  private destroyRef = inject(DestroyRef);

  // ========================================
  // State Management with Signals
  // ========================================

  /** 審計事件儲存 (In-Memory, 僅供即時統計) */
  private _auditEvents = signal<AuthAuditEvent[]>([]);

  /** Public readonly audit events */
  readonly auditEvents = this._auditEvents.asReadonly();

  /** 統計資訊 (Computed) */
  readonly statistics = computed<AuthAuditStatistics>(() => {
    const events = this._auditEvents();
    
    return {
      totalEvents: events.length,
      successfulLogins: events.filter(e => e.eventType === 'auth.user.login').length,
      failedLogins: events.filter(e => e.eventType === 'auth.login.failed').length,
      logouts: events.filter(e => e.eventType === 'auth.user.logout').length,
      passwordChanges: events.filter(e => e.eventType === 'auth.password.changed').length,
      mfaEnabled: events.filter(e => e.eventType === 'auth.mfa.enabled').length,
      mfaDisabled: events.filter(e => e.eventType === 'auth.mfa.disabled').length,
      tokenRefreshes: events.filter(e => e.eventType === 'auth.token.refreshed').length,
      sessionExpired: events.filter(e => e.eventType === 'auth.session.expired').length,
      emailVerifications: events.filter(e => e.eventType === 'auth.email.verified').length,
      requiresReview: events.filter(e => e.requiresReview).length,
      criticalEvents: events.filter(e => 
        e.level === AuditLevel.WARNING || e.level === AuditLevel.CRITICAL
      ).length
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

  /** 嚴重事件 */
  readonly criticalEvents = computed(() => {
    return this._auditEvents().filter(e => 
      e.level === AuditLevel.WARNING || e.level === AuditLevel.CRITICAL
    );
  });

  // ========================================
  // Lifecycle
  // ========================================

  constructor() {
    this.subscribeToAuthEvents();
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * 訂閱所有認證事件
   */
  private subscribeToAuthEvents(): void {
    // 訂閱所有 auth.* 事件
    this.eventBus.observe<any>('auth.*')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => this.handleAuthEvent(event),
        error: (error) => console.error('[AuthAuditService] Event subscription error:', error)
      });
  }

  /**
   * 處理認證事件
   */
  private handleAuthEvent(domainEvent: any): void {
    try {
      // 轉換為審計事件
      const auditEvent = AuthAuditEventBuilder.fromDomainEvent(domainEvent);

      // 記錄到 In-Memory Store (僅供即時統計)
      this.recordAuditEvent(auditEvent);

      // 記錄到持久化審計日誌 (未來整合 Global Audit Log Service)
      this.persistAuditEvent(auditEvent);

      // 發送告警 (如有需要)
      if (auditEvent.requiresReview || auditEvent.level === AuditLevel.CRITICAL) {
        this.sendAlert(auditEvent);
      }
    } catch (error) {
      console.error('[AuthAuditService] Failed to handle auth event:', error, domainEvent);
    }
  }

  /**
   * 記錄審計事件到 In-Memory Store
   */
  private recordAuditEvent(auditEvent: AuthAuditEvent): void {
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
   * 持久化審計事件 (整合 Global Audit Log Service)
   * 
   * TODO: 整合 Global Audit Log Service
   * - 寫入 Firestore audit_logs collection
   * - 支援長期儲存與查詢
   * - 支援合規性報告
   */
  private persistAuditEvent(auditEvent: AuthAuditEvent): void {
    // Placeholder for future Global Audit Log Service integration
    console.log('[AuthAuditService] Audit event recorded:', {
      type: auditEvent.eventType,
      user: auditEvent.userEmail,
      level: auditEvent.level,
      timestamp: auditEvent.timestamp
    });

    // 未來實作:
    // await this.auditLogService.recordEvent({
    //   ...auditEvent,
    //   source: 'auth-audit-service',
    //   version: '1.0.0'
    // });
  }

  /**
   * 發送告警
   */
  private sendAlert(auditEvent: AuthAuditEvent): void {
    // Placeholder for future Alert/Notification integration
    console.warn('[AuthAuditService] ALERT - Critical auth event:', {
      type: auditEvent.eventType,
      user: auditEvent.userEmail,
      level: auditEvent.level,
      description: auditEvent.description
    });

    // 未來實作:
    // await this.notificationService.sendAlert({
    //   title: 'Critical Auth Event',
    //   message: auditEvent.description,
    //   severity: auditEvent.level,
    //   targetAudience: ['security-team', 'admin']
    // });
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * 查詢審計事件 (基於過濾條件)
   */
  getFilteredEvents(filter: AuthAuditFilter): AuthAuditEvent[] {
    let events = this._auditEvents();

    if (filter.userId) {
      events = events.filter(e => e.userId === filter.userId);
    }

    if (filter.tenantId) {
      events = events.filter(e => e.tenantId === filter.tenantId);
    }

    if (filter.category) {
      events = events.filter(e => e.category === filter.category);
    }

    if (filter.level) {
      events = events.filter(e => e.level === filter.level);
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
   * 獲取用戶的審計歷史
   */
  getUserAuditHistory(userId: string, limit = 50): AuthAuditEvent[] {
    return this._auditEvents()
      .filter(e => e.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * 獲取租戶的審計歷史
   */
  getTenantAuditHistory(tenantId: string, limit = 100): AuthAuditEvent[] {
    return this._auditEvents()
      .filter(e => e.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  /**
   * 清除審計事件 (僅 In-Memory，不影響持久化資料)
   */
  clearAuditEvents(): void {
    this._auditEvents.set([]);
    console.log('[AuthAuditService] In-memory audit events cleared');
  }

  /**
   * 導出審計事件 (用於報告或備份)
   */
  exportAuditEvents(filter?: AuthAuditFilter): string {
    const events = filter ? this.getFilteredEvents(filter) : this._auditEvents();
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      statistics: this.statistics(),
      events: events
    }, null, 2);
  }
}
