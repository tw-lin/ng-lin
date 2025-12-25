/**
 * Auth Domain Events
 * 
 * 身份認證領域事件定義
 * - 遵循 docs/Global Event Bus.md 規範
 * - 整合 docs/⭐️/Identity & Auth.md 認證系統
 * - 支援 Global Audit Log 自動審計
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { DomainEvent } from '../models/base-event';

/**
 * 用戶登入事件 Payload
 */
export interface UserLoginPayload {
  /** 用戶 ID (Firebase UID) */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 顯示名稱 */
  displayName?: string;
  /** 登入方式 (email, google, github, phone) */
  provider: 'email' | 'google' | 'github' | 'phone' | 'anonymous';
  /** IP 地址 */
  ipAddress?: string;
  /** User Agent */
  userAgent?: string;
  /** 租戶 ID */
  tenantId?: string;
  /** Session ID */
  sessionId: string;
  /** 是否為新用戶首次登入 */
  isFirstLogin: boolean;
  /** MFA 是否已啟用 */
  mfaEnabled: boolean;
  /** 登入時間戳 */
  loginAt: Date;
}

/**
 * 用戶登入事件
 * 
 * 觸發時機:
 * - Firebase Auth 成功認證後
 * - AuthService.login() 成功
 * 
 * 消費者:
 * - AuthAuditService (記錄登入審計)
 * - NotificationConsumer (發送登入通知)
 * - AnalyticsConsumer (追蹤登入指標)
 * - SecurityMonitoringConsumer (異常登入檢測)
 */
export class UserLoginEvent extends DomainEvent<UserLoginPayload> {
  readonly type = 'auth.user.login';

  constructor(payload: UserLoginPayload) {
    super('auth.user.login', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'security', 'audit']
    });
  }
}

/**
 * 用戶登出事件 Payload
 */
export interface UserLogoutPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** Session ID */
  sessionId: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 登出原因 (manual, timeout, forced) */
  reason: 'manual' | 'timeout' | 'forced' | 'token_expired';
  /** 登出時間戳 */
  logoutAt: Date;
  /** Session 持續時間 (秒) */
  sessionDuration: number;
}

/**
 * 用戶登出事件
 * 
 * 觸發時機:
 * - 用戶手動登出
 * - Session 逾時
 * - 管理員強制登出
 * - Token 過期
 */
export class UserLogoutEvent extends DomainEvent<UserLogoutPayload> {
  readonly type = 'auth.user.logout';

  constructor(payload: UserLogoutPayload) {
    super('auth.user.logout', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'security', 'audit']
    });
  }
}

/**
 * 密碼變更事件 Payload
 */
export interface PasswordChangedPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 變更方式 (user_initiated, admin_reset, forgot_password) */
  changeType: 'user_initiated' | 'admin_reset' | 'forgot_password';
  /** 是否強制下次登入時修改 */
  forceChangeOnNextLogin: boolean;
  /** IP 地址 */
  ipAddress?: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 變更時間戳 */
  changedAt: Date;
}

/**
 * 密碼變更事件
 * 
 * 觸發時機:
 * - 用戶修改密碼
 * - 管理員重置密碼
 * - 忘記密碼流程
 * 
 * 安全考量:
 * - 不記錄密碼內容
 * - 記錄變更方式與 IP
 */
export class PasswordChangedEvent extends DomainEvent<PasswordChangedPayload> {
  readonly type = 'auth.password.changed';

  constructor(payload: PasswordChangedPayload) {
    super('auth.password.changed', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'security', 'audit', 'sensitive']
    });
  }
}

/**
 * MFA 啟用事件 Payload
 */
export interface MFAEnabledPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** MFA 方式 (totp, sms, email) */
  method: 'totp' | 'sms' | 'email';
  /** 備份碼數量 */
  backupCodesGenerated: number;
  /** 租戶 ID */
  tenantId?: string;
  /** 啟用時間戳 */
  enabledAt: Date;
}

/**
 * MFA 啟用事件
 * 
 * 觸發時機:
 * - 用戶首次設定 MFA
 * - MFA 重新配置
 */
export class MFAEnabledEvent extends DomainEvent<MFAEnabledPayload> {
  readonly type = 'auth.mfa.enabled';

  constructor(payload: MFAEnabledPayload) {
    super('auth.mfa.enabled', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'security', 'mfa', 'audit']
    });
  }
}

/**
 * MFA 禁用事件 Payload
 */
export interface MFADisabledPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 禁用原因 (user_request, admin_action, security_incident) */
  reason: 'user_request' | 'admin_action' | 'security_incident';
  /** 之前使用的 MFA 方式 */
  previousMethod: 'totp' | 'sms' | 'email';
  /** 租戶 ID */
  tenantId?: string;
  /** 禁用時間戳 */
  disabledAt: Date;
}

/**
 * MFA 禁用事件
 * 
 * 觸發時機:
 * - 用戶停用 MFA
 * - 管理員停用 MFA
 * - 安全事件導致停用
 */
export class MFADisabledEvent extends DomainEvent<MFADisabledPayload> {
  readonly type = 'auth.mfa.disabled';

  constructor(payload: MFADisabledPayload) {
    super('auth.mfa.disabled', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'security', 'mfa', 'audit']
    });
  }
}

/**
 * Token 刷新事件 Payload
 */
export interface TokenRefreshedPayload {
  /** 用戶 ID */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** 舊 Token 過期時間 */
  oldTokenExpiry: Date;
  /** 新 Token 過期時間 */
  newTokenExpiry: Date;
  /** 刷新原因 (auto, manual) */
  reason: 'auto' | 'manual';
  /** 租戶 ID */
  tenantId?: string;
  /** 刷新時間戳 */
  refreshedAt: Date;
}

/**
 * Token 刷新事件
 * 
 * 觸發時機:
 * - 自動 Token 刷新 (TokenRefreshInterceptor)
 * - 手動 Token 刷新
 */
export class TokenRefreshedEvent extends DomainEvent<TokenRefreshedPayload> {
  readonly type = 'auth.token.refreshed';

  constructor(payload: TokenRefreshedPayload) {
    super('auth.token.refreshed', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'token', 'session']
    });
  }
}

/**
 * Session 過期事件 Payload
 */
export interface SessionExpiredPayload {
  /** 用戶 ID */
  userId: string;
  /** Session ID */
  sessionId: string;
  /** 過期原因 (timeout, inactivity, max_lifetime) */
  reason: 'timeout' | 'inactivity' | 'max_lifetime';
  /** Session 建立時間 */
  sessionCreatedAt: Date;
  /** Session 最後活動時間 */
  lastActivityAt: Date;
  /** Session 持續時間 (秒) */
  sessionDuration: number;
  /** 租戶 ID */
  tenantId?: string;
  /** 過期時間戳 */
  expiredAt: Date;
}

/**
 * Session 過期事件
 * 
 * 觸發時機:
 * - Session 逾時
 * - 長時間無活動
 * - 達到最大生命週期
 */
export class SessionExpiredEvent extends DomainEvent<SessionExpiredPayload> {
  readonly type = 'auth.session.expired';

  constructor(payload: SessionExpiredPayload) {
    super('auth.session.expired', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'session', 'security']
    });
  }
}

/**
 * 權限變更事件 Payload
 */
export interface PermissionChangedPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 租戶 ID */
  tenantId: string;
  /** 變更類型 (grant, revoke, update) */
  changeType: 'grant' | 'revoke' | 'update';
  /** 資源類型 (blueprint, task, organization) */
  resourceType: string;
  /** 資源 ID */
  resourceId: string;
  /** 之前的權限 */
  previousPermissions: string[];
  /** 新的權限 */
  newPermissions: string[];
  /** 執行者 ID */
  executedBy: string;
  /** 變更原因 */
  reason?: string;
  /** 變更時間戳 */
  changedAt: Date;
}

/**
 * 權限變更事件
 * 
 * 觸發時機:
 * - 授予新權限
 * - 撤銷權限
 * - 更新權限
 * 
 * 消費者:
 * - PermissionAuditService (記錄權限審計)
 * - PermissionCacheService (清除權限快取)
 * - NotificationConsumer (通知權限變更)
 */
export class PermissionChangedEvent extends DomainEvent<PermissionChangedPayload> {
  readonly type = 'auth.permission.changed';

  constructor(payload: PermissionChangedPayload) {
    super('auth.permission.changed', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'permission', 'rbac', 'audit']
    });
  }
}

/**
 * 角色變更事件 Payload
 */
export interface RoleChangedPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 租戶 ID */
  tenantId: string;
  /** 變更類型 (assign, unassign, update) */
  changeType: 'assign' | 'unassign' | 'update';
  /** 之前的角色 */
  previousRoles: string[];
  /** 新的角色 */
  newRoles: string[];
  /** 執行者 ID */
  executedBy: string;
  /** 變更原因 */
  reason?: string;
  /** 變更時間戳 */
  changedAt: Date;
}

/**
 * 角色變更事件
 * 
 * 觸發時機:
 * - 分配新角色
 * - 移除角色
 * - 更新角色
 */
export class RoleChangedEvent extends DomainEvent<RoleChangedPayload> {
  readonly type = 'auth.role.changed';

  constructor(payload: RoleChangedPayload) {
    super('auth.role.changed', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'role', 'rbac', 'audit']
    });
  }
}

/**
 * 登入失敗事件 Payload
 */
export interface LoginFailedPayload {
  /** 嘗試登入的 Email */
  email: string;
  /** 失敗原因 (invalid_credentials, account_locked, mfa_required, email_not_verified) */
  reason: 'invalid_credentials' | 'account_locked' | 'mfa_required' | 'email_not_verified' | 'user_not_found';
  /** IP 地址 */
  ipAddress?: string;
  /** User Agent */
  userAgent?: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 連續失敗次數 */
  consecutiveFailures: number;
  /** 是否觸發帳戶鎖定 */
  accountLocked: boolean;
  /** 失敗時間戳 */
  failedAt: Date;
}

/**
 * 登入失敗事件
 * 
 * 觸發時機:
 * - 密碼錯誤
 * - 帳戶被鎖定
 * - MFA 驗證失敗
 * - Email 未驗證
 * 
 * 安全用途:
 * - 暴力破解檢測
 * - 異常登入監控
 * - 自動帳戶鎖定
 */
export class LoginFailedEvent extends DomainEvent<LoginFailedPayload> {
  readonly type = 'auth.login.failed';

  constructor(payload: LoginFailedPayload) {
    super('auth.login.failed', payload, {
      aggregateId: payload.email, // 使用 email 作為 aggregateId
      aggregateType: 'LoginAttempt',
      version: '1.0.0',
      tags: ['auth', 'security', 'audit', 'alert']
    });
  }
}

/**
 * Email 驗證完成事件 Payload
 */
export interface EmailVerifiedPayload {
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  email: string;
  /** 驗證 Token (僅記錄部分，不完整) */
  verificationTokenPartial: string;
  /** 驗證方式 (link, code) */
  verificationMethod: 'link' | 'code';
  /** 租戶 ID */
  tenantId?: string;
  /** 驗證時間戳 */
  verifiedAt: Date;
}

/**
 * Email 驗證完成事件
 * 
 * 觸發時機:
 * - 用戶點擊驗證連結
 * - 用戶輸入驗證碼
 */
export class EmailVerifiedEvent extends DomainEvent<EmailVerifiedPayload> {
  readonly type = 'auth.email.verified';

  constructor(payload: EmailVerifiedPayload) {
    super('auth.email.verified', payload, {
      aggregateId: payload.userId,
      aggregateType: 'User',
      version: '1.0.0',
      tags: ['auth', 'verification', 'audit']
    });
  }
}
