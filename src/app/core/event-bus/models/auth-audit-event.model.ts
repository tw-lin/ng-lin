/**
 * Auth Audit Event Model
 * 
 * 認證審計事件模型
 * - 用於追蹤所有認證相關操作
 * - 支援 Global Audit Log 系統
 * - 遵循 docs/⭐️/Identity & Auth.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { AuditLevel, AuditCategory } from './audit-event.model';

// Re-export for backward compatibility
export { AuditLevel, AuditCategory };

/**
 * 認證審計事件基礎介面
 */
export interface AuthAuditEvent {
  /** 審計事件 ID (唯一標識) */
  id: string;
  /** 事件類型 (對應 domain event type) */
  eventType: string;
  /** 事件類別 */
  category: AuditCategory;
  /** 嚴重級別 */
  level: AuditLevel;
  /** 用戶 ID */
  userId: string;
  /** 用戶 Email */
  userEmail: string;
  /** 租戶 ID */
  tenantId?: string;
  /** 事件描述 (人類可讀) */
  description: string;
  /** 事件詳細資料 (JSON) */
  details: Record<string, any>;
  /** IP 地址 */
  ipAddress?: string;
  /** User Agent */
  userAgent?: string;
  /** 操作結果 (success, failure, partial) */
  result: 'success' | 'failure' | 'partial';
  /** 錯誤訊息 (如有) */
  errorMessage?: string;
  /** 關聯的事件 ID (用於追蹤事件鏈) */
  correlationId?: string;
  /** 資源類型 (User, Tenant, Role, Permission) */
  resourceType?: string;
  /** 資源 ID */
  resourceId?: string;
  /** 執行動作 */
  action: string;
  /** 事件時間戳 */
  timestamp: Date;
  /** 是否需要進一步審查 */
  requiresReview: boolean;
  /** 標籤 (用於分類和搜尋) */
  tags: string[];
}

/**
 * 登入審計事件
 */
export interface LoginAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  action: 'login';
  details: {
    /** 登入方式 */
    provider: string;
    /** Session ID */
    sessionId: string;
    /** 是否為首次登入 */
    isFirstLogin: boolean;
    /** MFA 是否已啟用 */
    mfaEnabled: boolean;
    /** 登入裝置資訊 */
    deviceInfo?: {
      os?: string;
      browser?: string;
      device?: string;
    };
  };
}

/**
 * 登出審計事件
 */
export interface LogoutAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  action: 'logout';
  details: {
    /** Session ID */
    sessionId: string;
    /** 登出原因 */
    reason: string;
    /** Session 持續時間 (秒) */
    sessionDuration: number;
  };
}

/**
 * 登入失敗審計事件
 */
export interface LoginFailedAuditEvent extends AuthAuditEvent {
  category: AuditCategory.SECURITY;
  level: AuditLevel.WARNING | AuditLevel.CRITICAL;
  action: 'login_failed';
  result: 'failure';
  requiresReview: true;
  details: {
    /** 失敗原因 */
    reason: string;
    /** 連續失敗次數 */
    consecutiveFailures: number;
    /** 是否觸發帳戶鎖定 */
    accountLocked: boolean;
    /** 嘗試的 Email */
    attemptedEmail: string;
  };
}

/**
 * 密碼變更審計事件
 */
export interface PasswordChangedAuditEvent extends AuthAuditEvent {
  category: AuditCategory.SECURITY;
  level: AuditLevel.INFO | AuditLevel.WARNING;
  action: 'password_changed';
  details: {
    /** 變更方式 */
    changeType: 'user_initiated' | 'admin_reset' | 'forgot_password';
    /** 是否強制下次登入時修改 */
    forceChangeOnNextLogin: boolean;
  };
}

/**
 * MFA 啟用審計事件
 */
export interface MFAEnabledAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  level: AuditLevel.INFO;
  action: 'mfa_enabled';
  details: {
    /** MFA 方式 */
    method: 'totp' | 'sms' | 'email';
    /** 備份碼數量 */
    backupCodesGenerated: number;
  };
}

/**
 * MFA 禁用審計事件
 */
export interface MFADisabledAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  level: AuditLevel.WARNING;
  action: 'mfa_disabled';
  requiresReview: true;
  details: {
    /** 禁用原因 */
    reason: string;
    /** 之前使用的 MFA 方式 */
    previousMethod: string;
  };
}

/**
 * Token 刷新審計事件
 */
export interface TokenRefreshedAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  level: AuditLevel.INFO;
  action: 'token_refreshed';
  details: {
    /** Session ID */
    sessionId: string;
    /** 刷新原因 */
    reason: 'auto' | 'manual';
    /** 舊 Token 過期時間 */
    oldTokenExpiry: string;
    /** 新 Token 過期時間 */
    newTokenExpiry: string;
  };
}

/**
 * Session 過期審計事件
 */
export interface SessionExpiredAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  level: AuditLevel.INFO;
  action: 'session_expired';
  details: {
    /** Session ID */
    sessionId: string;
    /** 過期原因 */
    reason: string;
    /** Session 持續時間 (秒) */
    sessionDuration: number;
    /** Session 建立時間 */
    sessionCreatedAt: string;
    /** 最後活動時間 */
    lastActivityAt: string;
  };
}

/**
 * Email 驗證審計事件
 */
export interface EmailVerifiedAuditEvent extends AuthAuditEvent {
  category: AuditCategory.AUTHENTICATION;
  level: AuditLevel.INFO;
  action: 'email_verified';
  details: {
    /** 驗證方式 */
    verificationMethod: 'link' | 'code';
    /** 驗證 Token 部分 (不完整) */
    verificationTokenPartial: string;
  };
}

/**
 * 審計事件建構器
 * 
 * 用於從 DomainEvent 建立 AuthAuditEvent
 */
export class AuthAuditEventBuilder {
  /**
   * 從 DomainEvent 建立審計事件
   */
  static fromDomainEvent(
    domainEvent: any,
    additionalContext?: Partial<AuthAuditEvent>
  ): AuthAuditEvent {
    const baseEvent: AuthAuditEvent = {
      id: domainEvent.id,
      eventType: domainEvent.type,
      category: this.getCategoryFromEventType(domainEvent.type),
      level: this.getLevelFromEventType(domainEvent.type),
      userId: domainEvent.payload.userId || domainEvent.metadata.userId,
      userEmail: domainEvent.payload.email || domainEvent.payload.userEmail,
      tenantId: domainEvent.payload.tenantId || domainEvent.metadata.tenantId,
      description: this.getDescriptionFromEvent(domainEvent),
      details: domainEvent.payload,
      ipAddress: domainEvent.payload.ipAddress,
      userAgent: domainEvent.payload.userAgent,
      result: this.getResultFromEvent(domainEvent),
      correlationId: domainEvent.metadata.correlationId,
      resourceType: domainEvent.metadata.aggregateType,
      resourceId: domainEvent.metadata.aggregateId,
      action: this.getActionFromEventType(domainEvent.type),
      timestamp: domainEvent.timestamp,
      requiresReview: this.shouldRequireReview(domainEvent),
      tags: domainEvent.metadata.tags || [],
      ...additionalContext
    };

    return baseEvent;
  }

  /**
   * 從事件類型推斷類別
   */
  private static getCategoryFromEventType(eventType: string): AuditCategory {
    if (eventType.includes('login') || eventType.includes('logout') || eventType.includes('email.verified')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (eventType.includes('permission')) {
      return AuditCategory.PERMISSION;
    }
    if (eventType.includes('role')) {
      return AuditCategory.ROLE;
    }
    if (eventType.includes('mfa')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (eventType.includes('session')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (eventType.includes('token')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (eventType.includes('password') || eventType.includes('failed')) {
      return AuditCategory.SECURITY;
    }
    return AuditCategory.AUTHENTICATION;
  }

  /**
   * 從事件類型推斷嚴重級別
   */
  private static getLevelFromEventType(eventType: string): AuditLevel {
    if (eventType.includes('failed') || eventType.includes('mfa.disabled')) {
      return AuditLevel.WARNING;
    }
    if (eventType.includes('password.changed')) {
      return AuditLevel.INFO;
    }
    return AuditLevel.INFO;
  }

  /**
   * 從事件生成描述
   */
  private static getDescriptionFromEvent(event: any): string {
    const type = event.type;
    const payload = event.payload;

    const descriptions: Record<string, string> = {
      'auth.user.login': `User ${payload.email} logged in via ${payload.provider}`,
      'auth.user.logout': `User ${payload.email} logged out (${payload.reason})`,
      'auth.login.failed': `Failed login attempt for ${payload.email} (${payload.reason})`,
      'auth.password.changed': `Password changed for ${payload.email} (${payload.changeType})`,
      'auth.mfa.enabled': `MFA enabled for ${payload.email} using ${payload.method}`,
      'auth.mfa.disabled': `MFA disabled for ${payload.email} (${payload.reason})`,
      'auth.token.refreshed': `Token refreshed for session ${payload.sessionId}`,
      'auth.session.expired': `Session ${payload.sessionId} expired (${payload.reason})`,
      'auth.email.verified': `Email ${payload.email} verified`,
      'auth.permission.changed': `Permissions ${payload.changeType} for ${payload.email} on ${payload.resourceType}`,
      'auth.role.changed': `Roles ${payload.changeType} for ${payload.email}`
    };

    return descriptions[type] || `Auth event: ${type}`;
  }

  /**
   * 從事件推斷操作結果
   */
  private static getResultFromEvent(event: any): 'success' | 'failure' | 'partial' {
    if (event.type.includes('failed')) {
      return 'failure';
    }
    return 'success';
  }

  /**
   * 從事件類型提取操作
   */
  private static getActionFromEventType(eventType: string): string {
    const parts = eventType.split('.');
    return parts[parts.length - 1].replace(/_/g, '_');
  }

  /**
   * 判斷是否需要審查
   */
  private static shouldRequireReview(event: any): boolean {
    const type = event.type;
    // 登入失敗、MFA 禁用、密碼變更需要審查
    return (
      type.includes('failed') ||
      type === 'auth.mfa.disabled' ||
      (type === 'auth.password.changed' && event.payload.changeType !== 'user_initiated')
    );
  }
}
