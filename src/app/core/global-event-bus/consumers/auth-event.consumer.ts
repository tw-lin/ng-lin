/**
 * Auth Event Consumer
 * 
 * 認證事件消費者
 * - 優先級: 100 (最高優先級，確保認證事件優先處理)
 * - 訂閱所有認證相關事件
 * - 自動觸發審計記錄
 * - 整合 AuthAuditService & PermissionAuditService
 * - 遵循 docs/Global Event Bus.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { EventConsumerBase } from '../services/event-consumer.base';
import { Subscribe } from '../decorators/subscribe.decorator';
import { EventHandler } from '../decorators/event-handler.decorator';
import { Retry } from '../decorators/retry.decorator';
import { AuthAuditService } from '../services/auth-audit.service';
import { PermissionAuditService } from '../services/permission-audit.service';
import {
  UserLoginEvent,
  UserLogoutEvent,
  PasswordChangedEvent,
  MFAEnabledEvent,
  MFADisabledEvent,
  TokenRefreshedEvent,
  SessionExpiredEvent,
  PermissionChangedEvent,
  RoleChangedEvent,
  LoginFailedEvent,
  EmailVerifiedEvent
} from '../domain-events/auth-events';

/**
 * Auth Event Consumer
 * 
 * 優先級: 100 (最高)
 * 標籤: ['auth', 'security', 'audit', 'critical']
 * 
 * 職責:
 * 1. 訂閱所有認證事件
 * 2. 整合 AuthAuditService 自動記錄
 * 3. 整合 PermissionAuditService 追蹤權限變更
 * 4. 發送安全告警
 * 5. 觸發次要業務邏輯 (通知、分析等)
 */
@Injectable({ providedIn: 'root' })
@EventHandler({
  priority: 100, // 最高優先級
  tags: ['auth', 'security', 'audit', 'critical'],
  group: 'security',
  enabled: true,
  version: '1.0.0'
})
export class AuthEventConsumer extends EventConsumerBase {
  private authAuditService = inject(AuthAuditService);
  private permissionAuditService = inject(PermissionAuditService);

  // ========================================
  // Login Events
  // ========================================

  /**
   * 處理用戶登入事件
   * 
   * 業務邏輯:
   * 1. 記錄登入審計
   * 2. 更新用戶最後登入時間
   * 3. 檢測異常登入 (地理位置、裝置)
   * 4. 發送登入通知
   */
  @Subscribe('auth.user.login', { targetVersion: 'latest' })
  @Retry({
    maxAttempts: 3,
    initialDelay: 1000,
    backoffStrategy: 'exponential'
  })
  async handleUserLogin(event: UserLoginEvent): Promise<void> {
    console.log('[AuthEventConsumer] User logged in:', {
      userId: event.payload.userId,
      email: event.payload.email,
      provider: event.payload.provider,
      isFirstLogin: event.payload.isFirstLogin
    });

    // 審計記錄由 AuthAuditService 自動處理
    
    // TODO: 實作次要業務邏輯
    // - 更新用戶最後登入時間
    // - 檢測異常登入
    // - 發送登入通知 (email/push)
    // - 記錄登入地理位置
    // - 更新 Session 資訊
  }

  /**
   * 處理用戶登出事件
   */
  @Subscribe('auth.user.logout', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 2, initialDelay: 500 })
  async handleUserLogout(event: UserLogoutEvent): Promise<void> {
    console.log('[AuthEventConsumer] User logged out:', {
      userId: event.payload.userId,
      email: event.payload.email,
      reason: event.payload.reason,
      sessionDuration: event.payload.sessionDuration
    });

    // TODO: 實作次要業務邏輯
    // - 清理 Session
    // - 撤銷 Token
    // - 記錄登出原因分析
  }

  /**
   * 處理登入失敗事件
   * 
   * 安全考量:
   * 1. 記錄失敗嘗試
   * 2. 檢測暴力破解
   * 3. 觸發帳戶鎖定 (如達到閾值)
   * 4. 發送安全告警
   */
  @Subscribe('auth.login.failed', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 5, initialDelay: 2000 }) // 失敗事件重試次數較多
  async handleLoginFailed(event: LoginFailedEvent): Promise<void> {
    console.warn('[AuthEventConsumer] Login failed:', {
      email: event.payload.email,
      reason: event.payload.reason,
      consecutiveFailures: event.payload.consecutiveFailures,
      accountLocked: event.payload.accountLocked
    });

    // 檢測暴力破解
    if (event.payload.consecutiveFailures >= 5) {
      console.error('[AuthEventConsumer] SECURITY ALERT - Potential brute force attack:', {
        email: event.payload.email,
        failures: event.payload.consecutiveFailures,
        ip: event.payload.ipAddress
      });

      // TODO: 發送安全告警給管理員
      // await this.securityAlertService.sendBruteForceAlert(event.payload);
    }

    // 帳戶鎖定通知
    if (event.payload.accountLocked) {
      console.warn('[AuthEventConsumer] Account locked:', event.payload.email);

      // TODO: 發送帳戶鎖定通知給用戶
      // await this.notificationService.sendAccountLockedEmail(event.payload.email);
    }
  }

  // ========================================
  // Password & MFA Events
  // ========================================

  /**
   * 處理密碼變更事件
   */
  @Subscribe('auth.password.changed', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 3, initialDelay: 1000 })
  async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
    console.log('[AuthEventConsumer] Password changed:', {
      userId: event.payload.userId,
      email: event.payload.email,
      changeType: event.payload.changeType
    });

    // TODO: 實作次要業務邏輯
    // - 發送密碼變更確認 email
    // - 撤銷所有現有 Session (如需)
    // - 記錄密碼變更歷史
  }

  /**
   * 處理 MFA 啟用事件
   */
  @Subscribe('auth.mfa.enabled', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 2, initialDelay: 500 })
  async handleMFAEnabled(event: MFAEnabledEvent): Promise<void> {
    console.log('[AuthEventConsumer] MFA enabled:', {
      userId: event.payload.userId,
      email: event.payload.email,
      method: event.payload.method
    });

    // TODO: 實作次要業務邏輯
    // - 發送 MFA 啟用確認通知
    // - 更新用戶安全等級
  }

  /**
   * 處理 MFA 禁用事件
   * 
   * 安全考量:
   * - MFA 禁用視為高風險操作
   * - 需要二次確認
   * - 記錄詳細審計日誌
   */
  @Subscribe('auth.mfa.disabled', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 5, initialDelay: 2000 })
  async handleMFADisabled(event: MFADisabledEvent): Promise<void> {
    console.warn('[AuthEventConsumer] MFA disabled (HIGH RISK):', {
      userId: event.payload.userId,
      email: event.payload.email,
      reason: event.payload.reason,
      previousMethod: event.payload.previousMethod
    });

    // TODO: 實作次要業務邏輯
    // - 發送 MFA 禁用警告通知
    // - 降低用戶安全等級
    // - 觸發額外安全檢查
  }

  // ========================================
  // Session & Token Events
  // ========================================

  /**
   * 處理 Token 刷新事件
   */
  @Subscribe('auth.token.refreshed', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 2, initialDelay: 500 })
  async handleTokenRefreshed(event: TokenRefreshedEvent): Promise<void> {
    console.log('[AuthEventConsumer] Token refreshed:', {
      userId: event.payload.userId,
      sessionId: event.payload.sessionId,
      reason: event.payload.reason
    });

    // Token 刷新不需額外業務邏輯，審計即可
  }

  /**
   * 處理 Session 過期事件
   */
  @Subscribe('auth.session.expired', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 2, initialDelay: 500 })
  async handleSessionExpired(event: SessionExpiredEvent): Promise<void> {
    console.log('[AuthEventConsumer] Session expired:', {
      userId: event.payload.userId,
      sessionId: event.payload.sessionId,
      reason: event.payload.reason,
      sessionDuration: event.payload.sessionDuration
    });

    // TODO: 實作次要業務邏輯
    // - 清理過期 Session 資料
    // - 記錄 Session 使用統計
  }

  // ========================================
  // Permission & Role Events
  // ========================================

  /**
   * 處理權限變更事件
   * 
   * 業務邏輯:
   * 1. 記錄權限審計 (由 PermissionAuditService 處理)
   * 2. 清除權限快取
   * 3. 發送權限變更通知
   * 4. 觸發存取控制更新
   */
  @Subscribe('auth.permission.changed', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 5, initialDelay: 2000 })
  async handlePermissionChanged(event: PermissionChangedEvent): Promise<void> {
    console.log('[AuthEventConsumer] Permission changed:', {
      userId: event.payload.userId,
      email: event.payload.email,
      changeType: event.payload.changeType,
      resourceType: event.payload.resourceType,
      resourceId: event.payload.resourceId
    });

    // TODO: 實作次要業務邏輯
    // - 清除用戶權限快取
    // await this.permissionCacheService.clearUserCache(event.payload.userId);
    
    // - 發送權限變更通知
    // await this.notificationService.sendPermissionChangeNotification(event.payload);

    // - 觸發存取控制更新
    // await this.accessControlService.refreshUserPermissions(event.payload.userId);
  }

  /**
   * 處理角色變更事件
   */
  @Subscribe('auth.role.changed', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 5, initialDelay: 2000 })
  async handleRoleChanged(event: RoleChangedEvent): Promise<void> {
    console.log('[AuthEventConsumer] Role changed:', {
      userId: event.payload.userId,
      email: event.payload.email,
      changeType: event.payload.changeType,
      previousRoles: event.payload.previousRoles,
      newRoles: event.payload.newRoles
    });

    // TODO: 實作次要業務邏輯
    // - 清除用戶角色快取
    // - 重新計算用戶權限
    // - 發送角色變更通知
  }

  // ========================================
  // Email Verification
  // ========================================

  /**
   * 處理 Email 驗證完成事件
   */
  @Subscribe('auth.email.verified', { targetVersion: 'latest' })
  @Retry({ maxAttempts: 3, initialDelay: 1000 })
  async handleEmailVerified(event: EmailVerifiedEvent): Promise<void> {
    console.log('[AuthEventConsumer] Email verified:', {
      userId: event.payload.userId,
      email: event.payload.email,
      verificationMethod: event.payload.verificationMethod
    });

    // TODO: 實作次要業務邏輯
    // - 更新用戶帳戶狀態
    // - 啟用完整功能存取
    // - 發送歡迎 email
  }

  // ========================================
  // Error Handling
  // ========================================

  /**
   * 覆寫錯誤處理
   * 
   * 認證事件處理失敗屬於嚴重問題，需要特殊處理
   */
  protected override handleError(error: Error, event: any): void {
    console.error('[AuthEventConsumer] CRITICAL - Failed to handle auth event:', {
      eventType: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack
    });

    // TODO: 發送嚴重錯誤告警
    // await this.alertService.sendCriticalAlert({
    //   title: 'Auth Event Consumer Error',
    //   message: `Failed to process ${event.type} event`,
    //   error: error,
    //   event: event
    // });
  }
}
